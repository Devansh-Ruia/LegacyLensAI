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
    document.title = 'LegacyLens — Legacy Code Modernization';
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
                Drop in a repository and get back a plain-English account of what the business logic actually does —
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
      </main>
    </div>
  );
}
