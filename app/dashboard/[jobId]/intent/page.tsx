'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ModuleIntent {
  moduleId: string;
  filePath: string;
  functionName?: string;
  intent: string;
  confidence: number;
  requiresHumanReview: boolean;
  rawCode: string;
  language: string;
  domainHints: string[];
}

export default function IntentMapPage() {
  const params = useParams();
  const router = useRouter();
  const [intents, setIntents] = useState<ModuleIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleIntent | null>(null);

  useEffect(() => {
    if (!params.jobId) return;

    const fetchJobIntents = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setIntents(jobData.intents || []);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch job intents');
        }
      } catch (err: any) {
        setError(`Network error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchJobIntents();
  }, [params.jobId]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'cbl': 'bg-blue-600',
      'cob': 'bg-blue-600',
      'java': 'bg-green-600',
      'py': 'bg-yellow-600',
      'php': 'bg-purple-600',
      'js': 'bg-orange-600',
      'ts': 'bg-orange-600',
      'cs': 'bg-red-600',
      'vb': 'bg-indigo-600'
    };
    return colors[language] || 'bg-gray-600';
  };

  const getLanguageLabel = (language: string) => {
    const labels: { [key: string]: string } = {
      'cbl': 'COBOL',
      'cob': 'COBOL',
      'java': 'Java',
      'py': 'Python',
      'php': 'PHP',
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'cs': 'C#',
      'vb': 'VB.NET'
    };
    return labels[language] || language.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-gray-600 text-6xl font-bold mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Intent Map</h1>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Intent Map Error</h1>
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
                onClick={() => router.push(`/dashboard/${params.jobId}/roadmap`)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Roadmap
              </button>
              <button
                onClick={() => router.push(`/dashboard/${params.jobId}/refactor`)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Refactor
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
            <h2 className="text-xl font-semibold text-white mb-6">Business Intent Map</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
                <span>Showing {intents.length} modules</span>
                <div className="flex items-center space-x-4">
                  <span>Confidence:</span>
                  <span className="text-green-600">High (≥0.8)</span>
                  <span className="text-yellow-600">Medium (0.6-0.79)</span>
                  <span className="text-red-600">Low (&lt;0.6)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {intents.map((intent) => (
                <div
                  key={intent.moduleId}
                  onClick={() => setSelectedModule(intent)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getLanguageColor(intent.language)}`}>
                        {getLanguageLabel(intent.language)}
                      </div>
                      {intent.requiresHumanReview && (
                        <span className="text-yellow-600 text-sm font-medium">⚠️ Review</span>
                      )}
                    </div>
                    <div className={`text-sm font-medium ${getConfidenceColor(intent.confidence)}`}>
                      {getConfidenceLabel(intent.confidence)}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-3">
                    {intent.functionName || intent.moduleId}
                  </h3>

                  <div className="text-sm text-gray-300 mb-4">
                    <p className="line-clamp-3">{intent.intent}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>File:</span>
                      <span className="font-mono">{intent.filePath}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Confidence:</span>
                      <span className={`font-medium ${getConfidenceColor(intent.confidence)}`}>
                        {(intent.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {intent.domainHints.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {intent.domainHints.map((hint, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
                        >
                          {hint}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
                    {selectedModule.functionName || selectedModule.moduleId}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Business Intent</h5>
                      <p className="text-sm text-gray-100">{selectedModule.intent}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Confidence</h5>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getConfidenceColor(selectedModule.confidence)}`}></div>
                          <span className={`text-sm font-medium ${getConfidenceColor(selectedModule.confidence)}`}>
                            {(selectedModule.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-sm text-gray-400">
                            ({getConfidenceLabel(selectedModule.confidence)})
                          </span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Language</h5>
                        <div className={`px-3 py-1 rounded text-sm font-medium text-white ${getLanguageColor(selectedModule.language)}`}>
                          {getLanguageLabel(selectedModule.language)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">File Path</h5>
                      <p className="text-sm text-gray-100 font-mono">{selectedModule.filePath}</p>
                    </div>

                    {selectedModule.domainHints.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Domain Hints</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedModule.domainHints.map((hint, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-600 text-xs text-gray-200 rounded"
                            >
                              {hint}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedModule.requiresHumanReview && (
                      <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                        <h5 className="text-yellow-100 font-medium mb-2">⚠️ Human Review Required</h5>
                        <p className="text-yellow-200 text-sm">
                          This module has been flagged for human review due to low confidence or complex business logic.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push(`/dashboard/${params.jobId}/refactor?module=${selectedModule.moduleId}`)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
                  >
                    Refactor Module →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">Select a module to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
