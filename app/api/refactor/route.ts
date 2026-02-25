import { NextRequest, NextResponse } from 'next/server';
import { checkSemanticDrift } from '@/lib/intent-extractor';
import { generateTestScaffold } from '@/lib/test-scaffolder';
import { updateJobStatus, getJob } from '@/lib/blob-storage';
import { searchRelatedModules } from '@/lib/azure-search';
import { RefactoredModule } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { moduleId, jobId, targetLanguage } = await request.json();
    
    if (!moduleId || !jobId || !targetLanguage) {
      return NextResponse.json(
        { error: 'moduleId, jobId, and targetLanguage are required' },
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
    
    // Find the module intent from job data
    const moduleIntent = job.intents.find(intent => intent.moduleId === moduleId);
    if (!moduleIntent) {
      return NextResponse.json(
        { error: 'Module not found in job' },
        { status: 404 }
      );
    }
    
    console.log(`Starting refactoring for module ${moduleId} to ${targetLanguage}`);
    
    try {
      // Get related modules for context (optional but helpful)
      let relatedModules: string[] = [];
      try {
        const related = await searchRelatedModules(moduleId, 3);
        relatedModules = related.map(m => m.moduleId);
      } catch (error: any) {
        console.error('Failed to get related modules:', error);
        // Continue without related modules
      }
      
      // Build context prompt with related modules
      const contextPrompt = relatedModules.length > 0 
        ? `\n\nRelated Modules Context:\n${relatedModules.join(', ')}`
        : '';
      
      // Call GPT-4o for refactoring
      const systemPrompt = `You are a senior software architect specializing in modernizing legacy code.
Your job is to refactor the following ${moduleIntent.language} code to modern ${targetLanguage} while preserving the exact business logic.

Business Intent (use as guardrail):
${moduleIntent.intent}

Requirements:
1. Preserve all business logic exactly as described in the intent
2. Use modern ${targetLanguage} best practices and idioms
3. Improve code structure, readability, and maintainability
4. Add proper error handling and validation
5. Use meaningful variable names and add comments where helpful
6. Ensure the refactored code does nothing the intent doesn't describe
7. Do not add new features or change business behavior

Output only the refactored code. No preamble, no explanation, no markdown fences.${contextPrompt}

Original Code:
${moduleIntent.rawCode}`;

      const userPrompt = `Refactor this ${moduleIntent.language} code to modern ${targetLanguage}:`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/azure-openai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          temperature: 0.1,
          maxTokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to call OpenAI: ${response.statusText}`);
      }

      const { refactoredCode } = await response.json();
      
      // Check for semantic drift
      let driftWarning: string | undefined;
      try {
        const driftResult = await checkSemanticDrift(moduleIntent.intent, refactoredCode);
        
        if (driftResult.drifted) {
          driftWarning = driftResult.explanation;
          console.warn(`Semantic drift detected for ${moduleId}:`, driftResult.explanation);
        }
      } catch (error: any) {
        console.error('Semantic drift check failed:', error);
        driftWarning = `Failed to check semantic drift: ${error.message}`;
      }
      
      // Generate test scaffold
      let testScaffold: string;
      try {
        testScaffold = await generateTestScaffold({
          moduleId,
          originalCode: moduleIntent.rawCode,
          refactoredCode,
          targetLanguage,
          intentUsedAsGuardrail: moduleIntent.intent,
          guardrailMode: true
        });
      } catch (error: any) {
        console.error('Test scaffold generation failed:', error);
        testScaffold = `# Test scaffold generation failed\n# Error: ${error.message}\n# TODO: Generate tests manually`;
      }
      
      // Create refactored module object
      const refactoredModule: RefactoredModule = {
        moduleId,
        originalCode: moduleIntent.rawCode,
        refactoredCode,
        targetLanguage,
        testScaffold,
        intentUsedAsGuardrail: moduleIntent.intent,
        guardrailMode: true
      };
      
      // Update job with refactored module
      const existingRefactoredModules = job.refactoredModules || [];
      const updatedRefactoredModules = [...existingRefactoredModules, refactoredModule];
      
      await updateJobStatus(jobId, 'complete', {
        refactoredModules: updatedRefactoredModules
      });
      
      console.log(`Successfully refactored module ${moduleId} to ${targetLanguage}`);
      
      return NextResponse.json({
        success: true,
        moduleId,
        targetLanguage,
        refactoredCode,
        testScaffold,
        driftWarning,
        relatedModules: relatedModules.length
      });
      
    } catch (error: any) {
      console.error('Refactoring failed for module:', moduleId, error);
      
      return NextResponse.json(
        { error: error.message || 'Refactoring failed' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Refactor API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
