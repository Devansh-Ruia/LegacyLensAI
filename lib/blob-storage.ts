import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { AnalysisJob, JobStatus } from '@/types';

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
