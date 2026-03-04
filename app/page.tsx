'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ jobId: string; totalModules: number; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setRepoUrl('');
    }
  }, []);

  const handleRepoUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setFile(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && !repoUrl) {
      setError('Please select a file or enter a GitHub repository URL');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      if (file) {
        formData.append('file', file);
      } else if (repoUrl) {
        formData.append('repoUrl', repoUrl);
      }

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        router.push(`/dashboard/${result.jobId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsUploading(false);
    }
  }, [file, repoUrl, router]);

  const supportedLanguages = [
    { name: 'COBOL', extension: '.cbl', color: 'bg-blue-600' },
    { name: 'Java', extension: '.java', color: 'bg-green-600' },
    { name: 'Python', extension: '.py', color: 'bg-yellow-600' },
    { name: 'PHP', extension: '.php', color: 'bg-purple-600' },
    { name: 'JavaScript', extension: '.js', color: 'bg-orange-600' },
    { name: 'TypeScript', extension: '.ts', color: 'bg-orange-600' },
    { name: 'C#', extension: '.cs', color: 'bg-red-600' },
    { name: 'VB.NET', extension: '.vb', color: 'bg-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">LegacyLens</h1>
              <p className="ml-4 text-gray-400 text-sm">AI-Powered Legacy Code Modernization</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Transform Your Legacy Code with AI
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Upload your legacy codebase or provide a GitHub repository URL to get started with AI-powered modernization.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload ZIP File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">ZIP files only</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".zip"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {file && (
                  <div className="mt-2 text-sm text-gray-300">
                    Selected: {file.name}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={handleRepoUrlChange}
                  placeholder="https://github.com/username/repository"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUploading}
                />
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || (!file && !repoUrl)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-2 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Start Analysis'
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Supported Languages</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {supportedLanguages.map((lang) => (
                <div key={lang.name} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${lang.color}`}></div>
                  <span className="text-sm text-gray-300">{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
