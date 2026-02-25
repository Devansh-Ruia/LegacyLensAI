import { callGPT4oJSON } from './azure-openai';
import { searchRelatedModules, getAllModulesForJob } from './azure-search';
import { ModuleIntent, RoadmapItem } from '@/types';

interface RoadmapGenerationResult {
  moduleId: string;
  phase: 1 | 2 | 3;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  effortDays: number;
  reasoning: string;
  recommendation: 'refactor' | 'rewrite' | 'isolate' | 'defer';
  dependencies: string[];
}

export async function generateRoadmap(
  jobId: string,
  intents: ModuleIntent[]
): Promise<RoadmapItem[]> {
  try {
    console.log(`Generating roadmap for job ${jobId} with ${intents.length} modules`);
    
    // Step 1 — build a lightweight dependency summary
    const dependencySummary: string[] = [];
    
    for (const intent of intents) {
      try {
        const relatedModules = await searchRelatedModules(intent.moduleId, 3);
        if (relatedModules.length > 0) {
          const relatedNames = relatedModules.map(m => m.moduleId).join(', ');
          dependencySummary.push(
            `Module ${intent.moduleId} appears related to: ${relatedNames}`
          );
        }
      } catch (error: any) {
        console.error(`Failed to get related modules for ${intent.moduleId}:`, error);
        dependencySummary.push(
          `Module ${intent.moduleId} dependency analysis failed: ${error.message}`
        );
      }
    }
    
    // Step 2 — GPT-4o roadmap call
    const systemPrompt = `You are a software modernization architect. Given a list of modules with their 
inferred business intent and dependency relationships, produce a phased 
migration roadmap.

Phase 1: Safe to refactor now (low risk, low interdependency, no compliance flags)
Phase 2: Refactor after Phase 1 is validated (medium risk or moderate dependencies)
Phase 3: Requires human architectural review before touching (high risk, 
         critical path, compliance-sensitive, or requiresHumanReview flagged)

For each module output a JSON object:
{
  "moduleId": "string",
  "phase": 1 | 2 | 3,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "effortDays": number,
  "reasoning": "2-3 sentence explanation of why this module got this risk/phase score",
  "recommendation": "refactor" | "rewrite" | "isolate" | "defer",
  "dependencies": ["moduleId", ...]
}

Output a JSON array only. No preamble.`;

    // Prepare user prompt with intents and dependency summary
    const intentsText = intents.map(intent => 
      `Module: ${intent.moduleId}\nIntent: ${intent.intent}\nConfidence: ${intent.confidence}\nHuman Review Required: ${intent.requiresHumanReview}\nLanguage: ${intent.language}`
    ).join('\n\n');

    const dependencyText = dependencySummary.join('\n');

    const userPrompt = `Module Intents and Business Logic:
${intentsText}

Dependency Relationships:
${dependencyText}

Generate a phased modernization roadmap for these modules.`;

    const result = await callGPT4oJSON<RoadmapGenerationResult[]>(systemPrompt, userPrompt);
    
    console.log(`Generated roadmap with ${result.length} items for job ${jobId}`);
    
    // Convert to RoadmapItem format
    return result.map(item => ({
      moduleId: item.moduleId,
      phase: item.phase,
      riskLevel: item.riskLevel,
      effortDays: item.effortDays,
      reasoning: item.reasoning,
      recommendation: item.recommendation,
      dependencies: item.dependencies
    }));
    
  } catch (error: any) {
    console.error('Roadmap generation failed:', error);
    throw new Error(`Failed to generate roadmap: ${error.message}`);
  }
}
