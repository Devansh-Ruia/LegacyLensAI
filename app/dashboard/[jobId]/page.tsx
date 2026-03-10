'use client';

import { useEffect, useMemo, useState } from 'react';
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
    document.title = 'Analyzing · LegacyLens';
  }, []);

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

    // Initial fetch
    fetchJobStatus();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchJobStatus, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [params.jobId]);

  // Auto-redirect to intent page when complete
  useEffect(() => {
    if (job?.status === 'complete' && job.processedModules > 0) {
      router.push(`/dashboard/${params.jobId}/intent`);
    }
  }, [job, params.jobId, router]);

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

  const pipeline = useMemo(() => ([
    { key: 'ingesting', label: 'Ingesting' },
    { key: 'analyzing', label: 'Extracting Intent' },
    { key: 'roadmapping', label: 'Building Roadmap' },
    { key: 'complete', label: 'Complete' },
  ] as const), []);

  const currentIndex = useMemo(() => {
    if (!job) return 0;
    const status = job.status;
    if (status === 'pending') return 0;
    const idx = pipeline.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  }, [job, pipeline]);

  const elapsedLabel = useMemo(() => {
    if (!job?.createdAt) return '';
    const createdMs = new Date(job.createdAt).getTime();
    if (Number.isNaN(createdMs)) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m elapsed`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s elapsed`;
    return `${seconds}s elapsed`;
  }, [job?.createdAt]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="text-[1rem] font-semibold uppercase tracking-[0.08em]">LegacyLens</div>
            <h1 className="mt-6 text-[2rem] font-normal">Status unavailable</h1>
            <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 h-12 w-full bg-[var(--accent)] px-6 text-[0.9375rem] font-medium text-[#0e0e0e] transition-opacity duration-150 hover:opacity-85"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="text-[1rem] font-semibold uppercase tracking-[0.08em]">LegacyLens</div>
            <div className="mt-6 text-[0.9375rem] text-[var(--text-secondary)]">Loading job status.</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col justify-center py-12">
        <div className="mb-10 flex items-center justify-between">
          <div className="text-[1rem] font-semibold uppercase tracking-[0.08em]">LegacyLens</div>
          <div className="font-mono text-[0.875rem] text-[var(--text-muted)]">{String(params.jobId)}</div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="space-y-6">
            {pipeline.map((step, idx) => {
              const isComplete = idx < currentIndex || job.status === 'complete';
              const isCurrent = idx === currentIndex && job.status !== 'complete';
              const isOn = isComplete || isCurrent;

              return (
                <div key={step.key} className="relative">
                  <div className="flex items-center justify-between">
                    <div className="text-[0.9375rem] text-[var(--text-primary)]">{step.label}</div>
                    <div
                      className={`h-2 w-2 border border-[var(--border)] ${
                        isOn ? 'bg-[var(--accent)]' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  {idx < pipeline.length - 1 ? (
                    <div className="mt-4 h-px w-full bg-[var(--border)]" aria-hidden="true" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[2rem] leading-none text-[var(--text-primary)]">
                {job.processedModules} / {job.totalModules}
              </div>
              <div className="mt-2 text-[0.875rem] text-[var(--text-muted)]">modules</div>
            </div>
            <div className="sm:text-right">
              <div className="text-[0.875rem] text-[var(--text-muted)]">
                {elapsedLabel || new Date(job.createdAt).toLocaleString()}
              </div>
              <div className="mt-2 text-[0.875rem] text-[var(--text-secondary)]">{getStatusText(job.status)}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
