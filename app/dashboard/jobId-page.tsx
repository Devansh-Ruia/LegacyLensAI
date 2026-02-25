'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface JobStatus {
  jobId: string;
  status: string;
  totalModules: number;
  processedModules: number;
  createdAt: string;
  errorMessage?: string;
}

export default function JobStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.jobId) return;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setJob(jobData);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch job status');
          setJob(null);
        }
      } catch (err: any) {
        setError(`Network error: ${err.message}`);
        setJob(null);
      }
    };

    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [params.jobId]);

  useEffect(() => {
    if (job?.status === 'complete' && job.processedModules > 0) {
      router.push(`/dashboard/${params.jobId}/intent`);
    }
  }, [job, params.jobId, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'ingesting': return 'text-blue-600';
      case 'analyzing': return 'text-purple-600';
      case 'roadmapping': return 'text-orange-600';
      case 'complete': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'ingesting': return 'Ingesting';
      case 'analyzing': return 'Extracting Intent';
      case 'roadmapping': return 'Building Roadmap';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return status;
    }
  };

  const getProgressPercentage = () => {
    if (!job || job.totalModules === 0) return 0;
    return Math.round((job.processedModules / job.totalModules) * 100);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-red-600 text-6xl font-bold mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Status Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-gray-600 text-6xl font-bold mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Job Status</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">LegacyLens</h1>
              <p className="ml-4 text-gray-400 text-sm">AI-Powered Legacy Code Modernization</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Upload
              </button>
              <div className="text-gray-300">
                <span className="font-medium">Job ID:</span> {params.jobId}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        <div className="flex-1 bg-gray-900 p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-white mb-6">Job Status</h2>
            
            <div className="mb-8">
              <div className={`text-center p-6 rounded-lg border-2 ${getStatusColor(job?.status || 'pending')}`}>
                <div className={`text-4xl font-bold mb-2 ${getStatusColor(job?.status || 'pending')}`}>
                  {job?.status === 'complete' ? '✓' : '⏳'}
                </div>
                <div className={`text-lg font-medium mb-2 ${getStatusColor(job?.status || 'pending')}`}>
                  {getStatusText(job?.status || 'pending')}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Progress</span>
                <span>{job?.processedModules || 0} / {job?.totalModules || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {job && (
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Total Modules:</span>
                  <span className="font-medium">{job.totalModules}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processed:</span>
                  <span className="font-medium">{job.processedModules}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium">{new Date(job.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}

            {job?.status === 'complete' && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push(`/dashboard/${params.jobId}/intent`)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
                >
                  View Intent Map →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-gray-800 p-8">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-white mb-4">What's Happening</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                {job?.status === 'ingesting' && 'Your code is being processed and chunked for analysis...'}
                {job?.status === 'analyzing' && 'GPT-4o is extracting business intent from each module...'}
                {job?.status === 'roadmapping' && 'Generating risk-based modernization roadmap...'}
                {job?.status === 'complete' && 'Analysis complete! Redirecting to intent map...'}
              </p>
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Next Steps</h4>
                <ul className="space-y-2 text-gray-300">
                  {job?.status === 'complete' && (
                    <>
                      <li>Review extracted intents and confidence scores</li>
                      <li>Explore 3-phase roadmap</li>
                      <li>Refactor individual modules as needed</li>
                      <li>Export complete modernization plan</li>
                    </>
                  )}
                  {job?.status === 'analyzing' && (
                    <>
                      <li>Processing modules in batches of 5</li>
                      <li>Indexing into Azure AI Search</li>
                      <li>Building dependency relationships</li>
                    </>
                  )}
                  {job?.status === 'roadmapping' && (
                    <>
                      <li>Analyzing business logic and interdependencies</li>
                      <li>Assigning risk levels and effort estimates</li>
                      <li>Generating phased modernization roadmap</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
