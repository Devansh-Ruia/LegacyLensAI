'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface RoadmapItem {
  moduleId: string;
  phase: 1 | 2 | 3;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  effortDays: number;
  reasoning: string;
  dependencies: string[];
  recommendation: 'refactor' | 'rewrite' | 'isolate' | 'defer';
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<1 | 2 | 3 | 'all'>('all');

  useEffect(() => {
    if (!params.jobId) return;

    const fetchRoadmap = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setRoadmap(jobData.roadmap || []);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch roadmap');
        }
      } catch (err: any) {
        setError(`Network error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [params.jobId]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'high': return 'bg-orange-600';
      case 'critical': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1: return 'text-blue-600';
      case 2: return 'text-purple-600';
      case 3: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPhaseBgColor = (phase: number) => {
    switch (phase) {
      case 1: return 'bg-blue-600';
      case 2: return 'bg-purple-600';
      case 3: return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'refactor': return 'text-green-600';
      case 'rewrite': return 'text-orange-600';
      case 'isolate': return 'text-yellow-600';
      case 'defer': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const filteredRoadmap = selectedPhase === 'all' 
    ? roadmap 
    : roadmap.filter(item => item.phase === selectedPhase);

  const totalEffort = roadmap.reduce((sum, item) => sum + item.effortDays, 0);
  const phaseStats = {
    1: roadmap.filter(item => item.phase === 1),
    2: roadmap.filter(item => item.phase === 2),
    3: roadmap.filter(item => item.phase === 3)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-gray-600 text-6xl font-bold mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Roadmap</h1>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Roadmap Error</h1>
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
                onClick={() => router.push(`/dashboard/${params.jobId}/intent`)}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Intent
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
            <h2 className="text-xl font-semibold text-white mb-6">Modernization Roadmap</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
                <span>Showing {filteredRoadmap.length} modules</span>
                <div className="text-sm text-gray-400">
                  Total Effort: <span className="font-medium text-white">{totalEffort}</span> days
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPhase('all')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    selectedPhase === 'all' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All ({roadmap.length})
                </button>
                <button
                  onClick={() => setSelectedPhase(1)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${getPhaseColor(1)} ${
                    selectedPhase === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-blue-600'
                  }`}
                >
                  Phase 1 ({phaseStats[1].length})
                </button>
                <button
                  onClick={() => setSelectedPhase(2)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${getPhaseColor(2)} ${
                    selectedPhase === 2 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600'
                  }`}
                >
                  Phase 2 ({phaseStats[2].length})
                </button>
                <button
                  onClick={() => setSelectedPhase(3)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${getPhaseColor(3)} ${
                    selectedPhase === 3 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-700 hover:bg-red-600'
                  }`}
                >
                  Phase 3 ({phaseStats[3].length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredRoadmap.map((item) => (
                <div
                  key={item.moduleId}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getPhaseBgColor(item.phase)}`}>
                        Phase {item.phase}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getRiskBgColor(item.riskLevel)}`}>
                        {item.riskLevel.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Effort:</span>
                      <span className="text-sm font-medium text-white">{item.effortDays} days</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-3">
                    {item.moduleId}
                  </h3>

                  <div className="text-sm text-gray-300 mb-4">
                    <p className="line-clamp-4">{item.reasoning}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Recommendation:</span>
                      <span className={`text-xs font-medium ${getRecommendationColor(item.recommendation)}`}>
                        {item.recommendation.toUpperCase()}
                      </span>
                    </div>

                    {item.dependencies.length > 0 && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Dependencies:</span>
                        <span className="text-xs font-mono">
                          {item.dependencies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => router.push(`/dashboard/${params.jobId}/refactor?module=${item.moduleId}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Refactor →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-800 p-8">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-white mb-4">Roadmap Summary</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Phase Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Phase 1:</span>
                    <span className="text-blue-600 font-medium">{phaseStats[1].length} modules</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Phase 2:</span>
                    <span className="text-purple-600 font-medium">{phaseStats[2].length} modules</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Phase 3:</span>
                    <span className="text-red-600 font-medium">{phaseStats[3].length} modules</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Risk Assessment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Low Risk:</span>
                    <span className="text-green-600 font-medium">
                      {roadmap.filter(item => item.riskLevel === 'low').length} modules
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Medium Risk:</span>
                    <span className="text-yellow-600 font-medium">
                      {roadmap.filter(item => item.riskLevel === 'medium').length} modules
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">High Risk:</span>
                    <span className="text-orange-600 font-medium">
                      {roadmap.filter(item => item.riskLevel === 'high').length} modules
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Critical Risk:</span>
                    <span className="text-red-600 font-medium">
                      {roadmap.filter(item => item.riskLevel === 'critical').length} modules
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Recommendations</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Refactor:</span>
                    <span className="text-green-600 font-medium">
                      {roadmap.filter(item => item.recommendation === 'refactor').length} modules
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Rewrite:</span>
                    <span className="text-orange-600 font-medium">
                      {roadmap.filter(item => item.recommendation === 'rewrite').length} modules
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Isolate:</span>
                    <span className="text-yellow-600 font-medium">
                      {roadmap.filter(item => item.recommendation === 'isolate').length} modules
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Defer:</span>
                    <span className="text-gray-600 font-medium">
                      {roadmap.filter(item => item.recommendation === 'defer').length} modules
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Total Effort</h4>
                <div className="text-lg text-white font-medium">
                  {totalEffort} days
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  Estimated timeline for complete modernization
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  const roadmapData = new Blob([JSON.stringify(roadmap, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(roadmapData);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'MODERNIZATION_ROADMAP.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
              >
                Export Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
