# LegacyLens AI

A full-stack Next.js application that ingests legacy codebases, extracts plain-English business intent using Azure OpenAI GPT-4o, generates a risk-ranked modernization roadmap, and produces refactored code with test scaffolds.

## Features

- **Code Ingestion**: Support for ZIP files and GitHub repositories
- **Intelligent Chunking**: Function/class boundary detection for multiple languages
- **Intent Extraction**: GPT-4o powered business logic analysis
- **Risk Assessment**: Automated roadmap generation with phase-based recommendations
- **Semantic Search**: Azure AI Search for dependency analysis
- **Refactoring**: Intent-guarded code modernization with drift detection
- **Test Scaffolding**: Automated test generation for refactored modules

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript (strict mode), Tailwind CSS
- **Runtime**: Node.js (Next.js API routes)
- **LLM**: Azure OpenAI GPT-4o
- **Orchestration**: Azure AI Foundry
- **Search**: Azure AI Search
- **Storage**: Azure Blob Storage
- **GitHub**: Octokit SDK + GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure services (OpenAI, AI Search, Blob Storage) or demo mode
- GitHub repository access (optional)

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Configure Azure services or set `DEMO_MODE=true` for demo mode
3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### 1. Upload Codebase

- **ZIP Upload**: Drag and drop a ZIP file containing legacy code
- **GitHub Import**: Enter a public repository URL to fetch source files
- **Supported Languages**: `.cbl`, `.cob`, `.php`, `.py`, `.java`, `.js`, `.ts`, `.cs`, `.vb`

### 2. Monitor Analysis

- **Real-time Progress**: Watch ingestion → intent extraction → roadmap generation
- **Module Tracking**: See processed modules and confidence scores
- **Error Handling**: Comprehensive error reporting and recovery

### 3. Review Results

- **Intent Map**: Interactive card grid with confidence indicators
- **Roadmap View**: 3-phase Kanban layout with effort estimates
- **Refactoring**: Side-by-side diff with semantic drift warnings
- **Export**: Download comprehensive modernization roadmap

## Demo Mode

For testing without Azure credentials:

```bash
# Set demo mode
echo "DEMO_MODE=true" >> .env.local

# Run with mock responses
npm run dev
```

See [demo/README_DEMO.md](demo/README_DEMO.md) for detailed demo instructions.

## API Endpoints

- `POST /api/ingest` - Upload and process codebase
- `GET /api/status/[jobId]` - Get job status and results
- `POST /api/analyze` - Trigger intent extraction
- `POST /api/roadmap` - Generate modernization roadmap
- `POST /api/refactor` - Refactor individual modules

## Architecture

```
┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│   Frontend    │    │   Next.js API   │    │  Azure Services │
│               │    │                 │    │                 │
│   Upload UI   │────│   Ingestion     │────│   Intent       │
│   Dashboard   │    │   Pipeline       │    │   Extraction   │
│   Roadmap     │    │                 │    │                 │
│   Refactor     │    └────────────────────┘    │   Risk Ranking │
│               │                        │    │                 │
└─────────────────┘                        └────────────────────┘    │   Search &     │
                                              │   Storage       │
                                              └─────────────────┘
```

## Development

### Project Structure

```
legacylens/
├── app/
│   ├── page.tsx                    # Upload interface
│   ├── dashboard/[jobId]/
│   │   ├── page.tsx              # Job status
│   │   ├── intent/page.tsx        # Intent map
│   │   ├── roadmap/page.tsx       # Kanban view
│   │   └── refactor/page.tsx      # Code diff
│   └── api/
│       ├── ingest/route.ts         # File upload
│       ├── status/[jobId]/route.ts  # Status check
│       ├── analyze/route.ts          # Intent extraction
│       ├── roadmap/route.ts          # Risk ranking
│       └── refactor/route.ts         # Code refactoring
├── lib/
│   ├── azure-openai.ts             # GPT-4o client
│   ├── azure-search.ts             # Semantic search
│   ├── blob-storage.ts             # Job persistence
│   ├── azure-foundry.ts            # Pipeline orchestration
│   ├── intent-extractor.ts         # Business logic analysis
│   ├── risk-ranker.ts             # Roadmap generation
│   └── test-scaffolder.ts         # Test generation
├── types/index.ts                 # TypeScript definitions
└── demo/                         # Sample data & mocks
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.
