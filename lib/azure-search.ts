import { SearchClient, SearchIndexClient, AzureKeyCredential, SearchFieldDataType } from '@azure/search-documents';
import { ModuleIntent } from '@/types';

interface SearchDocument {
  moduleId: string;
  jobId: string;
  filePath: string;
  language: string;
  rawCode: string;
  intent: string;
  confidence: number;
  domainHints: string[];
}

function getSearchIndexClient(): SearchIndexClient {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const apiKey = process.env.AZURE_SEARCH_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('Missing required Azure Search environment variables');
  }

  return new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));
}

function getSearchClient(): SearchClient<SearchDocument> {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const apiKey = process.env.AZURE_SEARCH_API_KEY;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME || 'legacylens-index';

  if (!endpoint || !apiKey) {
    throw new Error('Missing required Azure Search environment variables');
  }

  return new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));
}

export async function indexModule(module: ModuleIntent): Promise<void> {
  const client = getSearchClient();
  
  const document: SearchDocument = {
    moduleId: module.moduleId,
    jobId: module.moduleId.split('_')[0], // Extract jobId from moduleId
    filePath: module.filePath,
    language: module.language,
    rawCode: module.rawCode,
    intent: module.intent,
    confidence: module.confidence,
    domainHints: module.domainHints
  };

  try {
    await client.mergeOrUploadDocuments([document]);
  } catch (error: any) {
    throw new Error(`Failed to index module ${module.moduleId}: ${error.message}`);
  }
}

export async function searchRelatedModules(
  moduleId: string,
  topK: number = 5
): Promise<ModuleIntent[]> {
  const client = getSearchClient();

  try {
    // First get the source module to use its intent for semantic search
    const sourceResult = await client.getDocument(moduleId);
    
    // Search for semantically similar modules using the intent
    const searchResults = await client.search(sourceResult.intent, {
      top: topK + 1 // +1 to include the source module itself
    });

    const relatedModules: ModuleIntent[] = [];
    
    for await (const result of searchResults.results) {
      // Skip the source module itself
      if (result.document.moduleId === moduleId) {
        continue;
      }

      relatedModules.push({
        moduleId: result.document.moduleId,
        filePath: result.document.filePath,
        functionName: undefined, // Not stored in search index
        intent: result.document.intent,
        confidence: result.document.confidence,
        requiresHumanReview: result.document.confidence < 0.65,
        rawCode: result.document.rawCode,
        language: result.document.language,
        domainHints: result.document.domainHints
      });

      if (relatedModules.length >= topK) {
        break;
      }
    }

    return relatedModules;
  } catch (error: any) {
    throw new Error(`Failed to search for related modules: ${error.message}`);
  }
}

export async function getAllModulesForJob(jobId: string): Promise<ModuleIntent[]> {
  const client = getSearchClient();

  try {
    const searchResults = await client.search(`jobId:${jobId}`, {
      top: 1000,
      filter: `jobId eq '${jobId}'`
    });

    const modules: ModuleIntent[] = [];
    
    for await (const result of searchResults.results) {
      modules.push({
        moduleId: result.document.moduleId,
        filePath: result.document.filePath,
        functionName: undefined, // Not stored in search index
        intent: result.document.intent,
        confidence: result.document.confidence,
        requiresHumanReview: result.document.confidence < 0.65,
        rawCode: result.document.rawCode,
        language: result.document.language,
        domainHints: result.document.domainHints
      });
    }

    return modules;
  } catch (error: any) {
    throw new Error(`Failed to get modules for job ${jobId}: ${error.message}`);
  }
}

export async function ensureIndexExists(): Promise<void> {
  // Simplified index creation - will be handled by Azure portal setup
  // TODO: Set up index manually in Azure portal or use proper SDK types
  console.log('Index creation skipped - please configure manually in Azure portal');
}
