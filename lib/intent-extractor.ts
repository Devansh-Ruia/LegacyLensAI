import { callGPT4oJSON } from './azure-openai';
import { updateJobStatus } from './blob-storage';
import { ModuleIntent } from '@/types';

interface IntentExtractionResult {
  intent: string;
  confidence: number;
  requiresHumanReview: boolean;
  domainHints: string[];
}

export async function extractIntent(chunk: ModuleIntent): Promise<ModuleIntent> {
  const systemPrompt = `You are a senior software architect specializing in legacy system analysis.
Your job is to infer the BUSINESS INTENT of the following code — not what it 
does syntactically, but what business problem it is solving.

Respond with a JSON object containing exactly these fields:
{
  "intent": "1-3 sentence plain-English description of the business logic",
  "confidence": 0.0 to 1.0,
  "requiresHumanReview": true or false,
  "domainHints": ["array", "of", "detected", "business", "domains"]
}

Set confidence below 0.65 if: variable names are single letters or cryptic 
abbreviations, logic is deeply nested without comments, or the purpose is 
genuinely ambiguous.

Set requiresHumanReview to true if: confidence < 0.65, OR the module appears 
to touch financial calculations, authentication, data deletion, or compliance 
logic.

Output only valid JSON. No preamble, no explanation, no markdown fences.`;

  const userPrompt = `Language: ${chunk.language}
File Path: ${chunk.filePath}
Function Name: ${chunk.functionName || 'Unknown'}

Code:
${chunk.rawCode}`;

  try {
    const result = await callGPT4oJSON<IntentExtractionResult>(systemPrompt, userPrompt);
    
    return {
      ...chunk,
      intent: result.intent,
      confidence: result.confidence,
      requiresHumanReview: result.requiresHumanReview,
      domainHints: result.domainHints
    };
  } catch (error: any) {
    console.error(`Intent extraction failed for ${chunk.moduleId}:`, error);
    
    // Return chunk with failure indicators
    return {
      ...chunk,
      intent: `Failed to extract intent: ${error.message}`,
      confidence: 0,
      requiresHumanReview: true,
      domainHints: ['extraction-failed']
    };
  }
}

export async function extractIntentsInBatches(
  chunks: ModuleIntent[],
  batchSize: number = 5
): Promise<ModuleIntent[]> {
  const processedChunks: ModuleIntent[] = [];
  
  // Extract jobId from first chunk to update job status
  const jobId = chunks[0]?.moduleId?.split('_')[0];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    try {
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(chunk => extractIntent(chunk))
      );
      
      processedChunks.push(...batchResults);
      
      // Update job progress
      if (jobId) {
        await updateJobStatus(jobId, 'analyzing', {
          processedModules: processedChunks.length
        });
      }
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} - ${processedChunks.length}/${chunks.length} modules`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`Batch processing failed at index ${i}:`, error);
      
      // Add failed chunks with error indicators
      const failedChunks = batch.map(chunk => ({
        ...chunk,
        intent: `Batch processing failed: ${error.message}`,
        confidence: 0,
        requiresHumanReview: true,
        domainHints: ['batch-failed']
      }));
      
      processedChunks.push(...failedChunks);
    }
  }
  
  return processedChunks;
}

export async function checkSemanticDrift(
  originalIntent: string,
  refactoredCode: string
): Promise<{ drifted: boolean; explanation: string }> {
  const systemPrompt = `You are a senior software architect comparing original business intent with refactored code.

Your job is to determine if the refactored code maintains the original business intent.

Respond with a JSON object containing exactly these fields:
{
  "drifted": true or false,
  "explanation": "1-2 sentence explanation of why semantic drift was detected or not detected"
}

Set drifted to true if:
- The refactored code does anything not described in original intent
- The refactored code omits functionality that original intent requires
- The business logic meaning has changed in any way

Set drifted to false if refactored code faithfully implements original intent.

Output only valid JSON. No preamble, no explanation, no markdown fences.`;

  const userPrompt = `Original Intent:
${originalIntent}

Refactored Code:
${refactoredCode}`;

  try {
    return await callGPT4oJSON<{ drifted: boolean; explanation: string }>(systemPrompt, userPrompt);
  } catch (error: any) {
    console.error('Semantic drift check failed:', error);
    return {
      drifted: true,
      explanation: `Failed to check semantic drift: ${error.message}`
    };
  }
}
