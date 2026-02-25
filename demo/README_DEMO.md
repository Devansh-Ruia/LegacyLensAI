# LegacyLens AI Demo Guide

## Overview

This demo showcases the LegacyLens AI pipeline for analyzing legacy codebases and generating modernization roadmaps.

## Demo Mode Setup

To run the demo with mock responses (no Azure credentials required):

1. Copy `.env.local.example` to `.env.local`
2. Set `DEMO_MODE=true` in `.env.local`
3. Run the development server: `npm run dev`

## Sample Data

### COBOL Sample (`demo/sample.cbl`)
- **File**: `sample.cbl` - 300-line COBOL loan calculation program
- **Features**: Variable-rate loans, grace periods, late fees
- **Legacy patterns**: Cryptic variable names, no comments, paragraph-based structure

### Mock Intent Extraction (`demo/mock-responses/intent-extraction.json`)
- **6 modules** extracted from the sample COBOL file
- **Confidence scores**: Range from 0.68 to 0.92
- **Human review flags**: 2 modules marked for human review
- **Domain hints**: Financial, loan-processing, mathematics, etc.

### Mock Roadmap (`demo/mock-responses/roadmap.json`)
- **5 roadmap items** distributed across 3 phases
- **Phase 1** (2 items): Low-risk calculations, safe to refactor immediately
- **Phase 2** (2 items): Medium-risk business logic, moderate dependencies  
- **Phase 3** (2 items): High-risk orchestration and UI modules

## 90-Second Demo Script

1. **Upload Sample** (30 seconds)
   - Navigate to http://localhost:3000
   - Upload `demo/sample.cbl` or drag-and-drop
   - Click "Analyze Codebase"

2. **Monitor Progress** (30 seconds)
   - Observe status progression: Ingesting → Extracting Intent → Building Roadmap → Complete
   - Watch module count: 6 modules processed

3. **Review Intent Map** (15 seconds)
   - Navigate to Intent view
   - Examine confidence scores and domain classifications
   - Note modules requiring human review

4. **Explore Roadmap** (10 seconds)
   - Navigate to Roadmap view
   - Review 3-phase Kanban layout
   - Examine risk levels and effort estimates

5. **Export Results** (5 seconds)
   - Click "Export Roadmap"
   - Download generated `MODERNIZATION_ROADMAP.md`

## Expected Outcomes

- **Total Processing Time**: ~90 seconds for 6 COBOL modules
- **Intent Extraction**: Business logic correctly identified for all modules
- **Risk Assessment**: Appropriate phase distribution with clear reasoning
- **Export Quality**: Professional markdown roadmap with detailed recommendations

## Live Mode Setup

To run with live Azure services:

1. Configure all environment variables in `.env.local`:
   - `AZURE_OPENAI_ENDPOINT`
   - `AZURE_OPENAI_API_KEY` 
   - `AZURE_OPENAI_DEPLOYMENT_NAME`
   - `AZURE_SEARCH_ENDPOINT`
   - `AZURE_SEARCH_API_KEY`
   - `AZURE_STORAGE_CONNECTION_STRING`

2. Set `DEMO_MODE=false` in `.env.local`

3. Ensure Azure resources are provisioned and accessible

## Troubleshooting

- **Missing modules**: Check file extensions (`.cbl`, `.cob`, `.php`, `.py`, `.java`, `.js`, `.ts`, `.cs`, `.vb`)
- **Slow processing**: Verify Azure service quotas and network connectivity
- **Intent extraction errors**: Review Azure OpenAI deployment and API key permissions
- **Search indexing failures**: Check Azure AI Search index configuration and permissions

## Architecture Notes

- **Chunking**: Intelligent splitting by function/class boundaries or COBOL paragraphs
- **Batch Processing**: 5 modules processed in parallel with rate limiting
- **Dependency Analysis**: Semantic search to identify related modules
- **Risk Scoring**: GPT-4o analyzes business intent and interdependencies
- **Phase Assignment**: Automated based on risk level and compliance flags
