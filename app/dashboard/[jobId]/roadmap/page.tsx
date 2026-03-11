'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

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
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string>('');
  const [contextExpanded, setContextExpanded] = useState(false);

  useEffect(() => {
    document.title = 'Modernization Roadmap · LegacyLens';
  }, []);

  useEffect(() => {
    if (!params.jobId) return;

    const fetchRoadmap = async () => {
      try {
        const response = await fetch(`/api/status/${params.jobId}`);
        if (response.ok) {
          const jobData = await response.json();
          setRoadmap(jobData.roadmap || []);
          setRepoName(typeof jobData.repoName === 'string' ? jobData.repoName : '');
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
      case 'low': return 'text-[var(--success)]';
      case 'medium': return 'text-[var(--warning)]';
      case 'high': return 'text-[var(--danger)]';
      case 'critical': return 'text-[var(--danger)]';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const getPhaseBarColor = (phase: number) => {
    switch (phase) {
      case 1: return 'bg-[var(--phase-1)]';
      case 2: return 'bg-[var(--phase-2)]';
      case 3: return 'bg-[var(--phase-3)]';
      default: return 'bg-[var(--border)]';
    }
  };

  const phaseItems = useMemo(() => {
    return {
      1: roadmap.filter((i) => i.phase === 1),
      2: roadmap.filter((i) => i.phase === 2),
      3: roadmap.filter((i) => i.phase === 3),
    } as const;
  }, [roadmap]);

  const totalEffort = useMemo(() => roadmap.reduce((sum, item) => sum + item.effortDays, 0), [roadmap]);

  const refactorableNow = useMemo(
    () => roadmap.filter((i) => i.recommendation === 'refactor').length,
    [roadmap]
  );

  const effortByPhase = useMemo(() => {
    const p1 = phaseItems[1].reduce((s, i) => s + i.effortDays, 0);
    const p2 = phaseItems[2].reduce((s, i) => s + i.effortDays, 0);
    const p3 = phaseItems[3].reduce((s, i) => s + i.effortDays, 0);
    return { 1: p1, 2: p2, 3: p3 } as const;
  }, [phaseItems]);

  const riskBreakdown = useMemo(() => {
    const low = roadmap.filter((i) => i.riskLevel === 'low');
    const medium = roadmap.filter((i) => i.riskLevel === 'medium');
    const high = roadmap.filter((i) => i.riskLevel === 'high' || i.riskLevel === 'critical');
    return [
      { label: 'Low risk', modules: low.length, days: low.reduce((s, i) => s + i.effortDays, 0) },
      { label: 'Medium risk', modules: medium.length, days: medium.reduce((s, i) => s + i.effortDays, 0) },
      { label: 'High risk', modules: high.length, days: high.reduce((s, i) => s + i.effortDays, 0) },
    ];
  }, [roadmap]);

  const exportRoadmapMarkdown = () => {
    const lines: string[] = [];
    lines.push('# Modernization Roadmap');
    lines.push('');
    lines.push(`Job ID: ${String(params.jobId)}`);
    if (repoName) lines.push(`Repository: ${repoName}`);
    lines.push('');
    lines.push(`Total effort: ${totalEffort} days`);
    lines.push(`Phase distribution: ${phaseItems[1].length} / ${phaseItems[2].length} / ${phaseItems[3].length}`);
    lines.push(`Refactorable now: ${refactorableNow}`);
    lines.push('');

    for (const phase of [1, 2, 3] as const) {
      lines.push(`## Phase ${phase}`);
      lines.push('');
      for (const item of phaseItems[phase]) {
        lines.push(`### ${item.moduleId}`);
        lines.push(`- Recommendation: ${item.recommendation.toUpperCase()}`);
        lines.push(`- Risk: ${item.riskLevel.toUpperCase()}`);
        lines.push(`- Effort: ${item.effortDays} days`);
        if (item.dependencies.length > 0) lines.push(`- Dependencies: ${item.dependencies.join(', ')}`);
        lines.push('');
        lines.push(item.reasoning);
        lines.push('');
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MODERNIZATION_ROADMAP.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-6 text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col justify-center">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="text-[0.9375rem] text-[var(--text-secondary)]">Loading modernization roadmap.</div>
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
            <h1 className="text-[2rem] font-normal">Modernization Roadmap</h1>
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
            <a href={`/dashboard/${params.jobId}/intent`} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
              Intent
            </a>
            <a href={`/dashboard/${params.jobId}/roadmap`} className="block text-[var(--accent)]">
              Roadmap
            </a>
            <a href={`/dashboard/${params.jobId}/refactor`} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150">
              Refactor
            </a>
          </nav>

          <div className="mt-auto pt-10 text-[0.875rem] text-[var(--text-muted)]">
            <div className="truncate">{repoName || 'Repository'}</div>
            <div>{roadmap.length} modules</div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="text-[2rem] font-normal">Modernization Roadmap</h2>
              <button
                type="button"
                onClick={exportRoadmapMarkdown}
                className="text-[0.9375rem] text-[var(--accent)] underline-offset-4 hover:underline transition-colors duration-150"
                aria-label="Export roadmap as markdown"
              >
                Export Roadmap
              </button>
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
                  The Modernization Roadmap is a phased migration plan ranked by risk
                  and effort. Every recommendation includes a written reason — not just
                  a score.
                  <br /><br />
                  Phase 1 modules are safe to refactor now. They have low risk, no
                  compliance flags, and minimal dependencies on other modules.
                  <br /><br />
                  Phase 2 modules should be refactored after Phase 1 is validated. They
                  have moderate complexity or dependencies on Phase 1 modules.
                  <br /><br />
                  Phase 3 modules require human architectural review before anyone
                  touches them. They may involve financial calculations, authentication,
                  data deletion, or compliance logic.
                  <br /><br />
                  Click Refactor → on any Phase 1 or Phase 2 module to generate
                  modernized code with a test scaffold.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <section>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {([1, 2, 3] as const).map((phase) => (
                    <div key={phase} className="border border-[var(--border)] bg-[var(--surface)]">
                      <div className="relative border-b border-[var(--border)] p-6 pl-5">
                        <div className={`absolute left-0 top-0 h-full w-[3px] ${getPhaseBarColor(phase)}`} aria-hidden="true" />
                        <div className="text-[1.125rem] font-medium">Phase {phase}</div>
                      </div>

                      <div className="space-y-4 p-6">
                        {phaseItems[phase].map((item) => (
                          <div key={item.moduleId} className="border border-[var(--border)] p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                {item.recommendation.toUpperCase()}
                              </div>
                              <div className="font-mono text-[0.875rem] text-[var(--text-secondary)]">
                                {item.effortDays} days
                              </div>
                            </div>

                            <div className="mt-3 font-mono text-[0.875rem] text-[var(--text-secondary)]">
                              {item.moduleId}
                            </div>

                            <div className="mt-4 h-px w-full bg-[var(--border)]" aria-hidden="true" />

                            <div className="mt-4 text-[0.9375rem] leading-[1.6] text-[var(--text-primary)]">
                              {item.reasoning}
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <div className={`text-[0.875rem] font-mono ${getRiskColor(item.riskLevel)}`}>
                                {item.riskLevel.toUpperCase()}
                              </div>
                              <a
                                href={`/dashboard/${params.jobId}/refactor?module=${encodeURIComponent(item.moduleId)}`}
                                className="text-[0.9375rem] text-[var(--accent)] underline-offset-4 hover:underline transition-colors duration-150"
                                aria-label={`Refactor ${item.moduleId}`}
                              >
                                Refactor →
                              </a>
                            </div>
                          </div>
                        ))}
                        {phaseItems[phase].length === 0 ? (
                          <div className="text-[0.9375rem] text-[var(--text-muted)]">No items.</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="space-y-6">
                  <div>
                    <div className="font-mono text-[2rem] leading-none text-[var(--text-primary)]">{totalEffort} days</div>
                    <div className="mt-2 text-[0.875rem] text-[var(--text-muted)]">total effort</div>
                  </div>

                  <div>
                    <div className="font-mono text-[2rem] leading-none text-[var(--text-primary)]">
                      {phaseItems[1].length} / {phaseItems[2].length} / {phaseItems[3].length}
                    </div>
                    <div className="mt-2 text-[0.875rem] text-[var(--text-muted)]">Phase 1 / 2 / 3</div>
                  </div>

                  <div>
                    <div className="font-mono text-[2rem] leading-none text-[var(--text-primary)]">{refactorableNow}</div>
                    <div className="mt-2 text-[0.875rem] text-[var(--text-muted)]">refactorable now</div>
                  </div>

                  {totalEffort > 0 ? (
                    <>
                      <div className="space-y-3">
                        <p className="text-[0.75rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">Effort by phase</p>
                        {([1, 2, 3] as const).map((phase) => (
                          <div key={phase}>
                            <div className="mb-1 flex justify-between gap-2 text-[0.8125rem] text-[var(--text-secondary)]">
                              <span>Phase {phase}</span>
                              <span className="font-mono">{effortByPhase[phase]} days</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded bg-[var(--border)]">
                              <div
                                className={`h-full ${phase === 1 ? 'bg-[var(--phase-1)]' : phase === 2 ? 'bg-[var(--phase-2)]' : 'bg-[var(--phase-3)]'}`}
                                style={{ width: `${totalEffort ? (effortByPhase[phase] / totalEffort) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[var(--border)] pt-4">
                        <p className="mb-2 text-[0.75rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">Risk breakdown</p>
                        <table className="w-full font-mono text-[0.8125rem] text-[var(--text-secondary)]">
                          <tbody>
                            {riskBreakdown.map((row) => (
                              <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
                                <td className="py-1">{row.label}</td>
                                <td className="py-1 text-right">{row.modules} module{row.modules !== 1 ? 's' : ''}</td>
                                <td className="py-1 text-right">{row.days} days</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
