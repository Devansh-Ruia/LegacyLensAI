'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

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
  const [job, setJob] = useState<any>(null);
  const [refactoredModules, setRefactoredModules] = useState<RefactoredModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<RefactoredModule | null>(null);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [repoName, setRepoName] = useState<string>('');

  const moduleId = searchParams.get('module');

  useEffect(() => {
    document.title = 'Code Refactoring · LegacyLens';
  }, []);

  useEffect(() => {
    if (!params.jobId) return;

    const fetchJobData = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setJob(jobData);
          setRefactoredModules(jobData.refactoredModules || []);
          setRepoName(typeof jobData.repoName === 'string' ? jobData.repoName : '');
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

  useEffect(() => {
    if (!moduleId) return;
    const match = refactoredModules.find((m) => m.moduleId === moduleId);
    if (match) setSelectedModule(match);
  }, [moduleId, refactoredModules]);

  const sourceLanguageLabel = useMemo(() => {
    const currentSelected = selectedModule || (refactoredModules.length > 0 ? refactoredModules[0] : null);
    const intents = Array.isArray(job?.intents) ? job.intents : [];
    const match = intents.find((i: any) => i?.moduleId === currentSelected?.moduleId);
    const lang = typeof match?.language === 'string' ? match.language : '';
    const labels: Record<string, string> = {
      cbl: 'COBOL',
      cob: 'COBOL',
      java: 'Java',
      py: 'Python',
      php: 'PHP',
      js: 'JavaScript',
      ts: 'TypeScript',
      cs: 'C#',
      vb: 'VB.NET',
    };
    return labels[lang] || (lang ? lang.toUpperCase() : 'Legacy');
  }, [selectedModule, refactoredModules, job?.intents]);

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
        const updatedModules = refactoredModules.filter((m) => m.moduleId !== moduleId);
        const newModule = result.refactoredModule || result;
        setRefactoredModules([...updatedModules, newModule]);
        setSelectedModule(newModule);
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
      <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="text-[0.9375rem] text-[var(--text-secondary)]">Loading refactor view.</div>
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
            <h1 className="text-[2rem] font-normal">Code Refactoring</h1>
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

  const selected = selectedModule || (refactoredModules.length > 0 ? refactoredModules[0] : null);

  const cleanedTestScaffold = selected
    ? selected.testScaffold.replace(/```[\w]*\n?/g, '').trim()
    : '';

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-6 py-8 lg:sticky lg:top-0 lg:flex lg:flex-col">
          <div className="text-[1rem] font-semibold uppercase tracking-[0.08em]">LegacyLens</div>
          <div className="mt-3 font-mono text-[0.875rem] text-[var(--text-muted)]">{String(params.jobId)}</div>

          <nav className="mt-10 space-y-3 text-[0.9375rem]">
            <a href={`/dashboard/${params.jobId}/intent`} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
              Intent
            </a>
            <a href={`/dashboard/${params.jobId}/roadmap`} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
              Roadmap
            </a>
            <a href={`/dashboard/${params.jobId}/refactor`} className="block text-[var(--accent)]">
              Refactor
            </a>
          </nav>

          <div className="mt-auto pt-10 text-[0.875rem] text-[var(--text-muted)]">
            <div className="truncate">{repoName || 'Repository'}</div>
            <div>{Array.isArray(job?.intents) ? job.intents.length : 0} modules</div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="text-[2rem] font-normal">Code Refactoring</h2>
              <div className="font-mono text-[0.875rem] text-[var(--text-muted)] lg:hidden">{String(params.jobId)}</div>
            </div>

            {moduleId ? (
              <div className="mb-8 border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-mono text-[0.9375rem] text-[var(--text-secondary)]">{moduleId}</div>
                  <div className="text-[0.875rem] text-[var(--text-muted)]">
                    {isRefactoring ? 'Refactoring…' : 'Ready'}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <label className="block text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Target language
                    </label>
                    <select
                      defaultValue="python"
                      onChange={(e) => handleRefactor(moduleId, e.target.value)}
                      className="mt-2 w-full border border-[var(--border)] bg-transparent px-3 py-3 text-[0.9375rem] text-[var(--text-primary)] focus:outline-none"
                      disabled={isRefactoring}
                      aria-label="Target programming language"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="csharp">C#</option>
                      <option value="php">PHP</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRefactor(moduleId, selected?.targetLanguage || 'python')}
                    disabled={isRefactoring}
                    className="h-12 w-full bg-[var(--accent)] px-6 text-[0.9375rem] font-medium text-[#0e0e0e] transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    aria-label="Start refactoring"
                  >
                    Start
                  </button>
                </div>
              </div>
            ) : null}

            {refactoredModules.length > 0 ? (
              <div className="mb-8">
                <div className="mb-4 text-[0.9375rem] text-[var(--text-secondary)]">Refactored modules</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {refactoredModules
                    .slice()
                    .sort((a, b) => a.moduleId.localeCompare(b.moduleId))
                    .map((m) => (
                      <button
                        key={m.moduleId}
                        type="button"
                        onClick={() => {
                          setSelectedModule(m);
                          setShowTests(false);
                        }}
                        className={`border p-6 text-left transition-opacity duration-150 hover:opacity-85 ${
                          selected?.moduleId === m.moduleId ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                        }`}
                        aria-label={`Select ${m.moduleId}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="font-mono text-[0.875rem] text-[var(--text-secondary)]">{m.moduleId}</div>
                          <div className="text-right text-[0.875rem] text-[var(--text-muted)]">
                            {m.targetLanguage.toUpperCase()}
                            {m.guardrailMode ? (
                              <span className="ml-3 text-[var(--success)]">✓ Guardrail Active</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-3 line-clamp-2 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)] italic">
                          {m.intentUsedAsGuardrail}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="border border-[var(--border)] bg-[var(--surface)] p-6 text-[0.9375rem] text-[var(--text-secondary)]">
                <p className="mb-1">No refactored modules yet.</p>
                <p className="text-[0.875rem] text-[var(--text-muted)]">
                  Go to the Roadmap and click Refactor → on a Phase 1 or Phase 2 module to get started.
                </p>
              </div>
            )}

            {selected ? (
              <section>
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <div className="font-mono text-[0.9375rem] text-[var(--text-primary)]">{selected.moduleId}</div>
                    <div className="text-[0.9375rem] text-[var(--text-secondary)]">
                      {sourceLanguageLabel} → {selected.targetLanguage.charAt(0).toUpperCase() + selected.targetLanguage.slice(1)}
                    </div>
                    {selected.guardrailMode ? (
                      <div className="text-[0.9375rem] text-[var(--success)]">✓ Guardrail Active</div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2 text-[0.9375rem] text-[var(--text-secondary)] italic">
                  {selected.intentUsedAsGuardrail}
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-0">
                  <div className="order-2 border border-[var(--border)] bg-[var(--surface)] lg:order-1 lg:border-r-0">
                    <div className="border-b border-[var(--border)] px-6 py-4 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Original code
                    </div>
                    <pre className="max-h-[560px] overflow-auto p-6 font-mono text-[0.875rem] leading-[1.6] text-[var(--text-secondary)] [scrollbar-width:thin]">
                      <code>{selected.originalCode}</code>
                    </pre>
                  </div>

                  <div className="order-1 border border-[var(--border)] bg-[var(--surface)] lg:order-2">
                    <div className="border-b border-[var(--border)] px-6 py-4 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Refactored code
                    </div>
                    <pre className="max-h-[560px] overflow-auto p-6 font-mono text-[0.875rem] leading-[1.6] text-[var(--text-secondary)] [scrollbar-width:thin]">
                      <code>{selected.refactoredCode}</code>
                    </pre>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-4 text-[0.9375rem]">
                  <button
                    type="button"
                    onClick={() => downloadText(`${selected.moduleId}_refactored.txt`, selected.refactoredCode)}
                    className="text-[var(--accent)] underline-offset-4 hover:underline transition-colors duration-150"
                    aria-label="Download refactored code"
                  >
                    Download refactored code
                  </button>
                  <span className="text-[var(--text-muted)]">·</span>
                  <button
                    type="button"
                    onClick={() => downloadText(`${selected.moduleId}_test.txt`, cleanedTestScaffold)}
                    className="text-[var(--accent)] underline-offset-4 hover:underline transition-colors duration-150"
                    aria-label="Download test scaffold"
                  >
                    Download test scaffold
                  </button>
                </div>

                <div className="mt-10">
                  <button
                    type="button"
                    onClick={() => setShowTests((v) => !v)}
                    className="text-[0.9375rem] text-[var(--accent)] underline-offset-4 hover:underline transition-colors duration-150"
                    aria-label={showTests ? 'Hide test scaffold' : 'Show test scaffold'}
                  >
                    {showTests ? 'Hide test scaffold ↑' : 'Show test scaffold ↓'}
                  </button>

                  {showTests ? (
                    <div className="mt-4 border border-[var(--border)] bg-[var(--surface)]">
                      <div className="border-b border-[var(--border)] px-6 py-4 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Test scaffold
                      </div>
                      <pre className="max-h-[420px] overflow-auto p-6 font-mono text-[0.875rem] leading-[1.6] text-[var(--text-secondary)] [scrollbar-width:thin]">
                        <code>{cleanedTestScaffold}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
