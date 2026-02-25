import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/risk-ranker';
import { updateJobStatus, getJob } from '@/lib/blob-storage';
import { RoadmapItem } from '@/types';

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
    
    // Check if job is in correct state for roadmap generation
    if (job.status !== 'roadmapping') {
      return NextResponse.json(
        { error: `Job is in ${job.status} state, cannot generate roadmap` },
        { status: 400 }
      );
    }
    
    console.log(`Starting roadmap generation for job ${jobId} with ${job.intents.length} modules`);
    
    try {
      // Generate roadmap
      const roadmap = await generateRoadmap(jobId, job.intents);
      
      console.log(`Generated roadmap with ${roadmap.length} items for job ${jobId}`);
      
      // Update job with roadmap and mark as complete
      await updateJobStatus(jobId, 'complete', {
        roadmap,
        processedModules: job.intents.length
      });
      
      return NextResponse.json({
        success: true,
        jobId,
        totalModules: job.intents.length,
        roadmapItems: roadmap.length,
        status: 'complete',
        summary: {
          phase1: roadmap.filter(item => item.phase === 1).length,
          phase2: roadmap.filter(item => item.phase === 2).length,
          phase3: roadmap.filter(item => item.phase === 3).length,
          totalEffortDays: roadmap.reduce((sum, item) => sum + item.effortDays, 0)
        }
      });
      
    } catch (error: any) {
      console.error('Roadmap generation failed for job:', jobId, error);
      
      // Update job status to error
      await updateJobStatus(jobId, 'error', {
        errorMessage: error.message || 'Unknown error during roadmap generation'
      });
      
      return NextResponse.json(
        { error: error.message || 'Roadmap generation failed' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Roadmap API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
