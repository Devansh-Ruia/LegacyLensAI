import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { chunkFile, saveJob } from '@/lib/blob-storage';
import { AnalysisJob, JobStatus } from '@/types';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';

const SUPPORTED_EXTENSIONS = ['.cbl', '.cob', '.php', '.py', '.java', '.js', '.ts', '.cs', '.vb'];

async function extractFromZip(buffer: ArrayBuffer): Promise<{ filePath: string; content: string; language: string }[]> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(buffer);
  const files: { filePath: string; content: string; language: string }[] = [];
  
  for (const [relativePath, file] of Object.entries(zipContent.files)) {
    if (!file.dir && SUPPORTED_EXTENSIONS.some(ext => relativePath.endsWith(ext))) {
      const content = await file.async('string');
      const language = relativePath.split('.').pop() || '';
      
      files.push({
        filePath: relativePath,
        content,
        language
      });
    }
  }
  
  return files;
}

async function fetchGitHubFiles(repoUrl: string): Promise<{ filePath: string; content: string; language: string }[]> {
  const octokit = new Octokit();
  const [owner, repo] = repoUrl.replace('https://github.com/', '').replace('.git', '').split('/');
  
  if (!owner || !repo) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  try {
    // Get repository contents
    const { data: tree } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ''
    });
    
    const files: { filePath: string; content: string; language: string }[] = [];
    
    // Recursively fetch supported files
    async function fetchContents(path: string): Promise<void> {
      const { data: items } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });
      
      for (const item of Array.isArray(items) ? items : [items]) {
        if (item.type === 'dir') {
          await fetchContents(item.path);
        } else if (item.type === 'file' && SUPPORTED_EXTENSIONS.some(ext => item.name.endsWith(ext))) {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path
          });
          
          if ('content' in fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            const language = item.name.split('.').pop() || '';
            
            files.push({
              filePath: item.path,
              content,
              language
            });
          }
        }
      }
    }
    
    await fetchContents('');
    return files;
  } catch (error: any) {
    throw new Error(`Failed to fetch GitHub repository: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const repoUrl = formData.get('repoUrl') as string | null;
    
    if (!file && !repoUrl) {
      return NextResponse.json(
        { error: 'Either file or repoUrl must be provided' },
        { status: 400 }
      );
    }
    
    const jobId = nanoid(10);
    let files: { filePath: string; content: string; language: string }[] = [];
    
    if (file) {
      // Handle file upload (ZIP)
      if (!file.name.endsWith('.zip')) {
        return NextResponse.json(
          { error: 'Uploaded file must be a ZIP archive' },
          { status: 400 }
        );
      }
      
      const buffer = await file.arrayBuffer();
      files = await extractFromZip(buffer);
    } else if (repoUrl) {
      // Handle GitHub repository URL
      files = await fetchGitHubFiles(repoUrl);
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No supported source files found' },
        { status: 400 }
      );
    }
    
    // Chunk all files
    const allChunks: any[] = [];
    for (const fileData of files) {
      const chunks = chunkFile(fileData.filePath, fileData.content, fileData.language);
      allChunks.push(...chunks);
    }
    
    // Create initial job
    const job: AnalysisJob = {
      jobId,
      status: 'ingesting',
      repoName: repoUrl ? new URL(repoUrl).pathname.substring(1) : (file?.name || 'unknown'),
      totalModules: allChunks.length,
      processedModules: 0,
      intents: allChunks,
      roadmap: [],
      refactoredModules: [],
      createdAt: new Date().toISOString()
    };
    
    // Save job to blob storage
    await saveJob(jobId, job);
    
    // Kick off analysis asynchronously
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    }).catch(error => {
      console.error('Failed to trigger analysis:', error);
    });
    
    return NextResponse.json({
      jobId,
      totalModules: allChunks.length,
      status: 'ingesting'
    });
    
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
