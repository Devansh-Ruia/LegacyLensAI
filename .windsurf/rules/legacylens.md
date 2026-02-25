---
trigger: always_on
---


Framework: Next.js 14 App Router with TypeScript strict mode
Styling: Tailwind CSS utility classes only. No component libraries.
No React Compiler. No experimental Next.js features.
Use Biome for linting if adding new tooling. Do not modify the default eslint-config-next.


All Azure clients must be initialized lazily inside functions, never at module top level.
Every Azure API call must have try/catch with a structured error response: { error: string, status: number }.
Use environment variables for all credentials. Reference .env.local.example for the full list.
When DEMO_MODE=true, all Azure calls must return data from demo/mock-responses/ instead of hitting live APIs.


All shared types live in types/index.ts. Do not define types inline in component or API files.
API routes live in app/api/. Each route handles exactly one responsibility.
Lib files in lib/ are pure logic with no Next.js dependencies.
No console.log in any file. Use lib/logger.ts.


Do not skip ahead. Complete and confirm each phase before starting the next.
After completing a phase, list every file created or modified, note any assumptions made, and wait for explicit approval before proceeding.


Dark mode only. Base background is bg-gray-950.
Every async interaction must have a loading state and an error state.
Mobile-responsive layout on all views.


Do not create or modify .github/workflows/ files without explicit instruction.
Do not touch demo/ assets unless specifically asked.