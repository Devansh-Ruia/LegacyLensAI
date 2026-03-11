'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ jobId: string; totalModules: number; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    document.title = 'LegacyLens: Legacy Code Modernization';
  }, []);

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

  const supportedLanguagesLine = useMemo(
    () => 'COBOL · PHP · Python · Java · JavaScript · TypeScript · C# · VB.NET',
    []
  );

  const canSubmit = Boolean(file || repoUrl) && !isUploading;

  const onDropZoneDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setRepoUrl('');
      setError(null);
    }
  }, []);

  const onDropZoneDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <main className="min-h-screen">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
          <section className="px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
            <div className="mx-auto flex h-full w-full max-w-[560px] flex-col justify-center">
              <div className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">
                LegacyLens
              </div>

              <h1 className="mt-10 text-[2.75rem] font-light leading-[1.02] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[3.25rem] lg:text-[4rem]">
                <span className="block">Your legacy code</span>
                <span className="block">has a story to tell.</span>
              </h1>

              <p className="mt-6 max-w-[40ch] text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                Drop in a repository and get back a plain-English account of what the business logic actually does,
                plus a risk-ranked plan for what to modernize first.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                <div>
                  <label
                    className="block cursor-pointer border border-dashed border-[var(--border)] px-6 py-8 text-[0.9375rem] text-[var(--text-secondary)] transition-opacity duration-150 hover:opacity-85"
                    onDrop={onDropZoneDrop}
                    onDragOver={onDropZoneDragOver}
                    aria-label="Upload ZIP file"
                  >
                    <div className="flex flex-col gap-2">
                      <div>Drop a ZIP or paste a GitHub URL</div>
                      {file ? (
                        <div className="font-medium text-[var(--accent)]">{file.name}</div>
                      ) : null}
                    </div>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".zip"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <div>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={handleRepoUrlChange}
                    placeholder="https://github.com/org/repo"
                    className="w-full border-b border-[var(--border)] bg-transparent px-0 py-3 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    disabled={isUploading}
                    aria-label="GitHub repository URL"
                  />
                </div>

                {error ? (
                  <div className="border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-[0.9375rem] text-[var(--danger)]">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-12 w-full bg-[var(--accent)] px-6 text-[0.9375rem] font-medium text-[#0e0e0e] transition-opacity duration-150 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? 'Analyzing…' : 'Start Analysis'}
                </button>

                <div className="text-[0.875rem] text-[var(--text-muted)]">{supportedLanguagesLine}</div>

                <a
                  href="#how-it-works"
                  className="mt-4 block text-[0.875rem] text-[var(--text-muted)] underline-offset-4 hover:underline"
                >
                  ↓ How it works
                </a>
              </form>
            </div>
          </section>

          <aside className="relative hidden min-h-screen lg:block">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80"
                alt=""
                loading="eager"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] to-transparent" aria-hidden="true" />
            </div>
          </aside>
        </div>

        <section id="how-it-works" className="bg-[#0e0e0e] pb-20 pt-[96px]" aria-labelledby="how-it-works-heading">
          <div className="mx-auto max-w-[720px] px-6 text-center sm:px-10">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              THE PROBLEM
            </p>
            <h2 id="how-it-works-heading" className="mt-4 text-[2.5rem] font-light leading-tight text-[var(--text-primary)]">
              Engineers spend 70% of their time just understanding old code.
            </h2>
            <p className="mt-6 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
              Before a single line gets rewritten, someone has to figure out what the old
              system actually does. Documentation is missing. The people who wrote it are
              gone. The business logic is buried in functions called ProcessData2_FINAL.
              <br /><br />
              LegacyLens reads the code and writes that documentation for you, then tells
              you what&apos;s safe to change first.
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-[1120px] grid-cols-1 border-y border-[var(--border)] px-6 py-12 sm:grid-cols-3 sm:px-10">
            <div className="border-b border-[var(--border)] px-6 py-8 sm:border-b-0 sm:border-r sm:py-0">
              <div className="font-mono text-[4rem] font-extralight leading-none text-[var(--text-muted)]">01</div>
              <p className="mt-2 text-[1.125rem] font-medium text-[var(--text-primary)]">Understand</p>
              <p className="mt-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">What does this code actually do?</p>
              <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                LegacyLens reads every function, paragraph, and class and writes a plain-English description of the business logic, not the syntax. Each description gets a confidence score. Anything touching financial calculations, authentication, or compliance gets flagged for human review before anyone touches it.
              </p>
            </div>
            <div className="border-b border-[var(--border)] px-6 py-8 sm:border-b-0 sm:border-r sm:py-0">
              <div className="font-mono text-[4rem] font-extralight leading-none text-[var(--text-muted)]">02</div>
              <p className="mt-2 text-[1.125rem] font-medium text-[var(--text-primary)]">Plan</p>
              <p className="mt-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">What should we change first?</p>
              <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                From the intent map, LegacyLens builds a phased migration roadmap ranked by risk and effort. Every recommendation includes a written reason, the kind of artifact you can put in front of leadership, not just another scan report.
              </p>
            </div>
            <div className="px-6 py-8 sm:py-0">
              <div className="font-mono text-[4rem] font-extralight leading-none text-[var(--text-muted)]">03</div>
              <p className="mt-2 text-[1.125rem] font-medium text-[var(--text-primary)]">Refactor</p>
              <p className="mt-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">Rewrite it without breaking it.</p>
              <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                For low-risk modules, LegacyLens generates modernized code using the original intent description as a guardrail. The refactored output can&apos;t drift from what the business logic was supposed to do. Test stubs come with every module.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-20 max-w-[1120px] px-6 sm:px-10">
            <p className="text-center text-[0.75rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              WORKS WITH
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { name: 'COBOL', desc: 'Batch processing, mainframe business logic' },
                { name: 'PHP', desc: 'Legacy web applications and CMS backends' },
                { name: 'Python 2', desc: 'Scripts and services before the 2020 EOL' },
                { name: 'Java', desc: 'Enterprise monoliths and Spring applications' },
                { name: 'JavaScript', desc: 'Pre-ES6 codebases and jQuery-era frontends' },
                { name: 'TypeScript', desc: 'Typed JS with outdated patterns or frameworks' },
                { name: 'C#', desc: '.NET Framework applications pre-.NET 5' },
                { name: 'VB.NET', desc: 'Visual Basic enterprise and desktop applications' },
              ].map((lang) => (
                <div
                  key={lang.name}
                  className="border border-[var(--border)] p-4 font-mono text-[var(--text-primary)]"
                >
                  <div>{lang.name}</div>
                  <div className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">{lang.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-[1120px] grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:px-10">
            <div>
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                GET STARTED
              </p>
              <h3 className="mt-4 text-[1.5rem] font-medium leading-snug text-[var(--text-primary)]">
                Upload a repo. Get a roadmap in minutes.
              </h3>
              <p className="mt-4 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                You don&apos;t need to configure anything. Drop in a ZIP of your codebase or paste a GitHub URL. LegacyLens handles the rest: chunking the files, extracting intent, building the dependency graph, and generating the roadmap.
              </p>
              <div className="mt-6 space-y-2 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                <p>Upload a ZIP file or paste a public GitHub repo URL.</p>
                <p>Wait for the analysis pipeline to complete (typically 2–5 minutes).</p>
                <p>Review the intent map, roadmap, and refactored modules.</p>
              </div>
            </div>
            <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-6 font-mono text-[0.875rem] text-[var(--text-primary)]">
              <pre className="whitespace-pre-wrap">
{`$ legacylens analyze ./legacy-payroll-system

  Ingesting 47 source files...         `}<span className="text-[var(--success)]">✓</span>
{`  Extracting business intent...        `}<span className="text-[var(--success)]">✓</span>
{`  Building dependency graph...         `}<span className="text-[var(--success)]">✓</span>
{`  Ranking migration risk...            `}<span className="text-[var(--success)]">✓</span>
{`  Generating modernization roadmap...  `}<span className="text-[var(--success)]">✓</span>
{`

  47 modules analyzed
  12 ready to refactor now
  31 days estimated total effort

  `}<span className="text-[var(--accent)]">→ Open dashboard</span>
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
