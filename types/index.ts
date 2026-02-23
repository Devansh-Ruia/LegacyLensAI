export type ModuleIntent = {
  moduleId: string;
  filePath: string;
  functionName?: string;
  intent: string;
  confidence: number;           // 0–1
  requiresHumanReview: boolean;
  rawCode: string;
  language: string;
  domainHints: string[];
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RoadmapItem = {
  moduleId: string;
  phase: 1 | 2 | 3;
  riskLevel: RiskLevel;
  effortDays: number;
  reasoning: string;
  dependencies: string[];
  recommendation: 'refactor' | 'rewrite' | 'isolate' | 'defer';
};

export type RefactoredModule = {
  moduleId: string;
  originalCode: string;
  refactoredCode: string;
  targetLanguage: string;
  testScaffold: string;
  intentUsedAsGuardrail: string;
  guardrailMode: boolean;
};

export type JobStatus =
  | 'pending'
  | 'ingesting'
  | 'analyzing'
  | 'roadmapping'
  | 'complete'
  | 'error';

export type AnalysisJob = {
  jobId: string;
  status: JobStatus;
  repoName: string;
  totalModules: number;
  processedModules: number;
  intents: ModuleIntent[];
  roadmap: RoadmapItem[];
  refactoredModules: RefactoredModule[];
  createdAt: string;
  errorMessage?: string;
};
