'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

interface RefactoredModule {
  moduleId: string;
  originalCode: string;
  refactoredCode: string;
  targetLanguage: string;
  testScaffold: string;
  intentUsedAsGuardrail: string;
  guardrailMode: boolean;
}

export default function RefactorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [refactoredModules, setRefactoredModules] = useState<RefactoredModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<RefactoredModule | null>(null);
  const [isRefactoring, setIsRefactoring] = useState(false);

  const moduleId = searchParams.get('module');

  useEffect(() => {
    if (!params.jobId) return;

    const fetchJobData = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setJob(jobData);
          setRefactoredModules(jobData.refactoredModules || []);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch job data');
        }
      } catch (err: any) {
        setError(`Network error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [params.jobId]);

  const handleRefactor = async (moduleId: string, targetLanguage: string) => {
    if (!moduleId || !targetLanguage) return;

    setIsRefactoring(true);
    setError(null);

    try {
      const response = await fetch('/api/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, jobId: params.jobId, targetLanguage }),
      });

      const result = await response.json();

      if (response.ok) {
        const updatedModules = refactoredModules.filter(m => m.moduleId !== moduleId);
        setRefactoredModules([...updatedModules, result]);
        setSelectedModule(result);
      } else {
        throw new Error(result.error || 'Refactoring failed');
      }
    } catch (err: any) {
      setError(`Refactoring error: ${err.message}`);
    } finally {
      setIsRefactoring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-gray-600 text-6xl font-bold mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Refactor View</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-red-600 text-6xl font-bold mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Refactor Error</h1>
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

  const targetLanguage = selectedModule?.targetLanguage || 'python';

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
                onClick={() => router.push(`/dashboard/${params.jobId}`)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Status
              </button>
              <button
                onClick={() => router.push(`/dashboard/${params.jobId}/intent`)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Intent
              </button>
              <button
                onClick={() => router.push(`/dashboard/${params.jobId}/roadmap`)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Roadmap
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
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-6">Code Refactoring</h2>
            
            {moduleId && !selectedModule && (
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Refactor Module: {moduleId}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Language
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => handleRefactor(moduleId, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
                      disabled={isRefactoring}
                    >
                      <option value="">Select Language</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="csharp">C#</option>
                      <option value="php">PHP</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleRefactor(moduleId, targetLanguage)}
                    disabled={!targetLanguage || isRefactoring}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRefactoring ? (
                      <>
                        <svg className="animate-spin -ml-2 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12v8m0-4-4h4m4 0v12M4 4-4h4m4 0z"></path>
                        </svg>
                        Refactoring...
                      </>
                    ) : (
                      'Refactor Module'
                    )}
                  </button>
                </div>
              </div>
            )}

            {refactoredModules.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Refactored Modules</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {refactoredModules.map((module) => (
                    <div
                      key={module.moduleId}
                      onClick={() => setSelectedModule(module)}
                      className={`bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedModule?.moduleId === module.moduleId ? 'border-blue-500' : 'hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-white">
                          {module.moduleId}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-600 rounded text-xs font-medium text-white">
                            {module.targetLanguage.toUpperCase()}
                          </span>
                          {module.guardrailMode && (
                            <span className="text-green-600 text-sm">✓ Guardrail</span>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-300">
                        <p className="line-clamp-2 mb-3">
                          Intent: {module.intentUsedAsGuardrail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-800 p-8">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-white mb-4">Module Details</h3>
            
            {selectedModule ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">
                    {selectedModule.moduleId}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Target Language</h5>
                      <div className="flex items-center space-x-2">
                        <div className="px-2 py-1 bg-green-600 rounded text-xs font-medium text-white">
                          {selectedModule.targetLanguage.toUpperCase()}
                        </div>
                        {selectedModule.guardrailMode && (
                          <span className="text-green-600 text-sm">Intent Guardrail Active</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Business Intent Used</h5>
                      <p className="text-sm text-gray-100">{selectedModule.intentUsedAsGuardrail}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3">Original Code</h5>
                  <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-48">
                    <code>{selectedModule.originalCode}</code>
                  </pre>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3">Refactored Code</h5>
                  <pre className="text-xs text-gray-100 bg-gray-900 p-3 rounded overflow-x-auto max-h-48">
                    <code>{selectedModule.refactoredCode}</code>
                  </pre>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3">Test Scaffold</h5>
                  <pre className="text-xs text-gray-100 bg-gray-900 p-3 rounded overflow-x-auto max-h-48">
                    <code>{selectedModule.testScaffold}</code>
                  </pre>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      const codeData = new Blob([selectedModule.refactoredCode], { type: 'text/plain' });
                      const url = URL.createObjectURL(codeData);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedModule.moduleId}_refactored.${selectedModule.targetLanguage}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Download Refactored Code
                  </button>

                  <button
                    onClick={() => {
                      const testData = new Blob([selectedModule.testScaffold], { type: 'text/plain' });
                      const url = URL.createObjectURL(testData);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedModule.moduleId}_test.py`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Download Test Scaffold
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">⚙️</div>
                <p className="text-lg">Select a refactored module to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
