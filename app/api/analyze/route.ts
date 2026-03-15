import { NextRequest, NextResponse } from 'next/server';
import { extractIntentsInBatches } from '@/lib/intent-extractor';
import { indexModule, getAllModulesForJob } from '@/lib/azure-search';
import { updateJobStatus, getJob } from '@/lib/blob-storage';
import { generateRoadmap } from '@/lib/risk-ranker';
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
    
    const existingJob = await getJob(jobId);
    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (existingJob.status !== 'ingesting') {
      return NextResponse.json({ message: 'Job already processing or complete' }, { status: 200 });
    }
    
    const job = existingJob;
    
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
      
      // Update job with processed intents and generate roadmap
      await updateJobStatus(jobId, 'roadmapping', {
        intents: processedIntents,
        processedModules: processedIntents.length
      });
      
      // Generate roadmap directly instead of fetching /api/roadmap
      const roadmap = await generateRoadmap(jobId, processedIntents);

      await updateJobStatus(jobId, 'complete', {
        roadmap,
        processedModules: processedIntents.length
      });
      
      return NextResponse.json({
        success: true,
        jobId,
        totalModules: processedIntents.length,
        indexedModules: indexedCount,
        status: 'complete',
        roadmapItems: roadmap.length
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
