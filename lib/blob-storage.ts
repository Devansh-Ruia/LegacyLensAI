import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { AnalysisJob, JobStatus, ModuleIntent } from '@/types';
import { nanoid } from 'nanoid';

function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('Missing required Azure Storage connection string');
  }

  return BlobServiceClient.fromConnectionString(connectionString);
}

function getContainerClient() {
  const blobServiceClient = getBlobServiceClient();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'legacylens-jobs';
  
  return blobServiceClient.getContainerClient(containerName);
}

function getJobBlobClient(jobId: string): BlockBlobClient {
  const blobServiceClient = getBlobServiceClient();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'legacylens-jobs';
  
  const containerClient = blobServiceClient.getContainerClient(containerName);
  return containerClient.getBlockBlobClient(`jobs/${jobId}.json`);
}

export async function saveJob(jobId: string, job: AnalysisJob): Promise<void> {
  const blobClient = getJobBlobClient(jobId);
  
  try {
    const jobJson = JSON.stringify(job, null, 2);
    await blobClient.upload(jobJson, jobJson.length);
  } catch (error: any) {
    throw new Error(`Failed to save job ${jobId}: ${error.message}`);
  }
}

export async function getJob(jobId: string): Promise<AnalysisJob | null> {
  const blobClient = getJobBlobClient(jobId);
  
  try {
    const response = await blobClient.download();
    if (!response.readableStreamBody) {
      return null;
    }
    
    const blobText = await streamToString(response.readableStreamBody);
    return JSON.parse(blobText) as AnalysisJob;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw new Error(`Failed to get job ${jobId}: ${error.message}`);
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    readableStream.on('error', reject);
  });
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  extra?: Partial<AnalysisJob>
): Promise<void> {
  const existingJob = await getJob(jobId);
  if (!existingJob) {
    throw new Error(`Job ${jobId} not found`);
  }

  const updatedJob: AnalysisJob = {
    ...existingJob,
    status,
    ...extra
  };

  await saveJob(jobId, updatedJob);
}

export async function deleteJob(jobId: string): Promise<void> {
  const blobClient = getJobBlobClient(jobId);
  
  try {
    await blobClient.delete();
  } catch (error: any) {
    if (error.statusCode !== 404) {
      throw new Error(`Failed to delete job ${jobId}: ${error.message}`);
    }
  }
}

export async function listJobs(): Promise<string[]> {
  const blobServiceClient = getBlobServiceClient();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'legacylens-jobs';
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  try {
    const jobIds: string[] = [];
    
    for await (const blob of containerClient.listBlobsFlat({ prefix: 'jobs/' })) {
      if (blob.name.endsWith('.json')) {
        const jobId = blob.name.replace('jobs/', '').replace('.json', '');
        jobIds.push(jobId);
      }
    }
    
    return jobIds;
  } catch (error: any) {
    throw new Error(`Failed to list jobs: ${error.message}`);
  }
}

export function chunkFile(
  filePath: string,
  content: string,
  language: string
): ModuleIntent[] {
  const chunks: ModuleIntent[] = [];
  const jobId = nanoid(10);
  
  // Split by function/class boundaries for JS/TS/Python/Java/PHP
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'php'].includes(language)) {
    const functionRegex = /(?:function|class|def|public|private)\s+\w+|^[a-zA-Z_]\w*\s*\(.*\)\s*{|^[a-zA-Z_]\w*\s*:\s*function/gm;
    const matches = [...content.matchAll(functionRegex)];
    
    if (matches.length > 0) {
      let startIndex = 0;
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const endIndex = match.index || 0;
        
        if (i === 0 && endIndex > 0) {
          // Add leading code as first chunk
          chunks.push(createChunk(jobId, filePath, language, content.substring(0, endIndex), chunks.length));
        }
        
        startIndex = endIndex;
        
        // Find the end of this function/class
        let braceCount = 0;
        let chunkEnd = startIndex;
        let inString = false;
        let stringChar = '';
        
        for (let j = startIndex; j < content.length; j++) {
          const char = content[j];
          
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar && content[j - 1] !== '\\') {
            inString = false;
          } else if (!inString) {
            if (char === '{') braceCount++;
            else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                chunkEnd = j + 1;
                break;
              }
            }
          }
        }
        
        const chunkContent = content.substring(startIndex, chunkEnd);
        if (chunkContent.trim().length > 0) {
          chunks.push(createChunk(jobId, filePath, language, chunkContent, chunks.length));
        }
        
        startIndex = chunkEnd;
      }
    }
  }
  
  // Split by COBOL paragraph (lines starting with 6+ spaces followed by a word and a period)
  if (['cbl', 'cob'].includes(language)) {
    const lines = content.split('\n');
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const line of lines) {
      const isParagraphStart = /^[ ]{6,}\w+\./.test(line);
      
      if (isParagraphStart && currentChunk.trim().length > 0) {
        chunks.push(createChunk(jobId, filePath, language, currentChunk, chunkIndex++));
        currentChunk = '';
      }
      
      currentChunk += line + '\n';
      
      // Split if chunk gets too large (150 lines max)
      if (currentChunk.split('\n').length >= 150) {
        chunks.push(createChunk(jobId, filePath, language, currentChunk, chunkIndex++));
        currentChunk = '';
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(createChunk(jobId, filePath, language, currentChunk, chunkIndex));
    }
  }
  
  // Fallback: split by lines if no specific chunking logic applies
  if (chunks.length === 0) {
    const lines = content.split('\n');
    const maxLines = 150;
    
    for (let i = 0; i < lines.length; i += maxLines) {
      const chunkLines = lines.slice(i, i + maxLines);
      const chunkContent = chunkLines.join('\n');
      chunks.push(createChunk(jobId, filePath, language, chunkContent, chunks.length));
    }
  }
  
  return chunks;
}

function createChunk(
  jobId: string,
  filePath: string,
  language: string,
  content: string,
  index: number
): ModuleIntent {
  // Extract function name if possible
  let functionName: string | undefined;
  const functionMatch = content.match(/(?:function|def|class)\s+(\w+)/);
  if (functionMatch) {
    functionName = functionMatch[1];
  }
  
  return {
    moduleId: `${jobId}_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`,
    filePath,
    functionName,
    intent: '', // Will be filled by intent extraction
    confidence: 0,
    requiresHumanReview: false,
    rawCode: content,
    language,
    domainHints: []
  };
}
