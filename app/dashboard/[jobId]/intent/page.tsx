'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

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
  const [intents, setIntents] = useState<ModuleIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleIntent | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string>('all');
  const [repoName, setRepoName] = useState<string>('');
  const [contextExpanded, setContextExpanded] = useState(false);

  useEffect(() => {
    document.title = 'Business Intent · LegacyLens';
  }, []);

  useEffect(() => {
    if (!params.jobId) return;

    const fetchJobIntents = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setIntents(jobData.intents || []);
          setRepoName(typeof jobData.repoName === 'string' ? jobData.repoName : '');
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
    if (confidence >= 0.8) return 'text-[var(--success)]';
    if (confidence >= 0.65) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
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

  const languages = useMemo(() => {
    const unique = new Set<string>();
    for (const m of intents) unique.add(m.language);
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [intents]);

  const filteredIntents = useMemo(() => {
    if (activeLanguage === 'all') return intents;
    return intents.filter((m) => m.language === activeLanguage);
  }, [activeLanguage, intents]);

  const moduleCountLabel = useMemo(() => {
    const count = intents.length;
    return `${count} module${count === 1 ? '' : 's'}`;
  }, [intents.length]);

  const confidenceBuckets = useMemo(() => {
    const high = intents.filter((i) => i.confidence >= 0.8).length;
    const needsReview = intents.filter((i) => i.confidence >= 0.65 && i.confidence < 0.8).length;
    const low = intents.filter((i) => i.confidence < 0.65).length;
    const total = intents.length;
    return { high, needsReview, low, total };
  }, [intents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="text-[0.9375rem] text-[var(--text-secondary)]">Loading business intent.</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <h1 className="text-[2rem] font-normal">Business Intent</h1>
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

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-6 py-8 lg:sticky lg:top-0 lg:flex lg:flex-col">
          <div className="text-[1rem] font-semibold uppercase tracking-[0.08em]">LegacyLens</div>
          <div className="mt-3 font-mono text-[0.875rem] text-[var(--text-muted)]">{String(params.jobId)}</div>

          <nav className="mt-10 space-y-3 text-[0.9375rem]">
            <a href={`/dashboard/${params.jobId}/intent`} className="block text-[var(--accent)]">
              Intent
            </a>
            <a href={`/dashboard/${params.jobId}/roadmap`} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
              Roadmap
            </a>
            <a href={`/dashboard/${params.jobId}/refactor`} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
              Refactor
            </a>
          </nav>

          <div className="mt-auto pt-10 text-[0.875rem] text-[var(--text-muted)]">
            <div className="truncate">{repoName || 'Repository'}</div>
            <div>{moduleCountLabel}</div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-[1120px]">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="text-[2rem] font-normal">Business Intent</h2>
              <div className="font-mono text-[0.875rem] text-[var(--text-muted)] lg:hidden">{String(params.jobId)}</div>
            </div>

            <div className="mb-6 border border-[var(--border)] p-4">
              <button
                type="button"
                onClick={() => setContextExpanded((e) => !e)}
                className="w-full text-left text-[0.875rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                aria-expanded={contextExpanded ? 'true' : 'false'}
              >
                What is this? {contextExpanded ? '↑' : '↓'}
              </button>
              {contextExpanded ? (
                <p className="mt-3 text-[0.875rem] leading-[1.6] text-[var(--text-secondary)]">
                  The Business Intent Map shows what each module in your codebase
                  actually does, in plain English, not syntax. Each card represents
                  one logical unit of code (a function, class, or COBOL paragraph).
                  <br /><br />
                  Confidence scores reflect how certain the analysis is. Anything below
                  65% or touching financial logic, authentication, or data deletion is
                  flagged for human review, those modules should not be refactored
                  without a developer reading the original first.
                  <br /><br />
                  Click any card to see the full intent description and the raw code
                  side by side.
                </p>
              ) : null}
            </div>

            {confidenceBuckets.total > 0 ? (
              <div className="mb-6">
                <div className="flex h-2 w-full overflow-hidden rounded bg-[var(--border)]" role="img" aria-label="Confidence distribution">
                  <div
                    className="bg-[var(--success)]"
                    style={{ width: `${(confidenceBuckets.high / confidenceBuckets.total) * 100}%` }}
                    title={`High confidence: ${confidenceBuckets.high}`}
                  />
                  <div
                    className="bg-[var(--warning)]"
                    style={{ width: `${(confidenceBuckets.needsReview / confidenceBuckets.total) * 100}%` }}
                    title={`Needs review: ${confidenceBuckets.needsReview}`}
                  />
                  <div
                    className="bg-[var(--danger)]"
                    style={{ width: `${(confidenceBuckets.low / confidenceBuckets.total) * 100}%` }}
                    title={`Low confidence: ${confidenceBuckets.low}`}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[0.8125rem] text-[var(--text-secondary)]">
                  <span>High confidence ({confidenceBuckets.high})</span>
                  <span>Needs review ({confidenceBuckets.needsReview})</span>
                  <span>Low confidence ({confidenceBuckets.low})</span>
                </div>
              </div>
            ) : null}

            <div className="mb-8 flex flex-wrap gap-2">
              {languages.map((lang) => {
                const isActive = activeLanguage === lang;
                const label = lang === 'all' ? 'All' : getLanguageLabel(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLanguage(lang)}
                    className={`border px-3 py-2 text-[0.9375rem] transition-opacity duration-150 hover:opacity-85 ${
                      isActive ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                    }`}
                    aria-label={`Filter by ${label}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
              <section>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredIntents.map((intent) => (
                    <button
                      key={intent.moduleId}
                      type="button"
                      onClick={() => setSelectedModule(intent)}
                      className="w-full border border-[var(--border)] p-6 text-left transition-opacity duration-150 hover:opacity-85"
                      aria-label={`Open ${intent.filePath}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="shrink-0 border border-[var(--border)] px-2 py-1 text-[0.75rem] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                            {getLanguageLabel(intent.language)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-mono text-[0.875rem] text-[var(--text-secondary)]">
                              {intent.filePath}
                            </div>
                          </div>
                        </div>
                        <div className={`shrink-0 text-right font-mono text-[0.875rem] ${getConfidenceColor(intent.confidence)}`}>
                          {(intent.confidence * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="mt-4 text-[0.9375rem] leading-[1.6] text-[var(--text-primary)]">
                        {intent.intent}
                      </div>

                      {intent.requiresHumanReview ? (
                        <div className="mt-4 text-[0.9375rem] text-[var(--warning)]">Human review required</div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>

              <aside className="border border-[var(--border)] bg-[var(--surface)]">
                {selectedModule ? (
                  <div className="h-full">
                    <div className="border-b border-[var(--border)] p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[0.875rem] text-[var(--text-muted)]">
                            {selectedModule.filePath}
                          </div>
                          <div className="mt-2 text-[1.125rem] font-medium">
                            {selectedModule.functionName || selectedModule.moduleId}
                          </div>
                        </div>
                        <div className={`shrink-0 font-mono text-[0.875rem] ${getConfidenceColor(selectedModule.confidence)}`}>
                          {(selectedModule.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      {selectedModule.requiresHumanReview ? (
                        <div className="mt-3 text-[0.9375rem] text-[var(--warning)]">Human review required</div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-0 lg:grid-rows-[1fr_1fr]">
                      <div className="border-b border-[var(--border)] p-6">
                        <div className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          Business intent
                        </div>
                        <div className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--text-primary)]">
                          {selectedModule.intent}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          Raw code
                        </div>
                        <pre className="mt-3 max-h-[360px] overflow-auto bg-[var(--surface)] p-4 font-mono text-[0.875rem] leading-[1.6] text-[var(--text-secondary)] [scrollbar-width:thin]">
                          <code>{selectedModule.rawCode}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                    Select a module to review its intent and raw code.
                  </div>
                )}
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
