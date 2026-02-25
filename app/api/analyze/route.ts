import { NextRequest, NextResponse } from 'next/server';
import { extractIntentsInBatches } from '@/lib/intent-extractor';
import { indexModule, getAllModulesForJob } from '@/lib/azure-search';
import { updateJobStatus, getJob } from '@/lib/blob-storage';
import { ModuleIntent } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing job
    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if job is in correct state for analysis
    if (job.status !== 'ingesting') {
      return NextResponse.json(
        { error: `Job is in ${job.status} state, cannot analyze` },
        { status: 400 }
      );
    }
    
    // Update job status to analyzing
    await updateJobStatus(jobId, 'analyzing');
    
    console.log(`Starting intent extraction for job ${jobId} with ${job.intents.length} modules`);
    
    try {
      // Extract intents in batches
      const processedIntents = await extractIntentsInBatches(job.intents);
      
      console.log(`Intent extraction completed for job ${jobId}. Processed ${processedIntents.length} modules`);
      
      // Index all processed intents into Azure AI Search
      let indexedCount = 0;
      for (const intent of processedIntents) {
        try {
          await indexModule(intent);
          indexedCount++;
        } catch (error: any) {
          console.error(`Failed to index module ${intent.moduleId}:`, error);
          // Continue processing other modules even if one fails
        }
      }
      
      console.log(`Indexed ${indexedCount}/${processedIntents.length} modules for job ${jobId}`);
      
      // Update job with processed intents and trigger roadmap generation
      await updateJobStatus(jobId, 'roadmapping', {
        intents: processedIntents,
        processedModules: processedIntents.length
      });
      
      // Trigger roadmap generation asynchronously
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).catch(error => {
        console.error('Failed to trigger roadmap generation:', error);
      });
      
      return NextResponse.json({
        success: true,
        jobId,
        totalModules: processedIntents.length,
        indexedModules: indexedCount,
        status: 'roadmapping'
      });
      
    } catch (error: any) {
      console.error('Analysis failed for job:', jobId, error);
      
      // Update job status to error
      await updateJobStatus(jobId, 'error', {
        errorMessage: error.message || 'Unknown error during analysis'
      });
      
      return NextResponse.json(
        { error: error.message || 'Analysis failed' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
