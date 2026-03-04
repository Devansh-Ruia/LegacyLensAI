import { OpenAI } from 'openai';
import { ModuleIntent, RefactoredModule } from '@/types';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function getOpenAIClient(): OpenAI {
  const githubToken = process.env.GITHUB_TOKEN;
  console.log('GITHUB_TOKEN present:', !!githubToken);
  console.log('TOKEN length:', githubToken?.length);

  if (!githubToken) {
    throw new Error('Missing required GITHUB_TOKEN environment variable');
  }

  return new OpenAI({
    baseURL: 'https://models.inference.ai.azure.com',
    apiKey: githubToken
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = BASE_DELAY_MS
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0 || !error.message?.includes('rate limit')) {
      throw error;
    }

    await sleep(delay * (MAX_RETRIES - retries + 1));
    return retryWithBackoff(operation, retries - 1, delay);
  }
}

export async function callGPT4o(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getOpenAIClient();

  return retryWithBackoff(async () => {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response from GitHub Models');
    }

    return response.choices[0].message?.content || '';
  });
}

export async function callGPT4oJSON<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const response = await callGPT4o(
    systemPrompt,
    userPrompt
  );

  try {
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanResponse) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}. Response: ${response}`);
  }
}

export async function checkSemanticDrift(
  originalIntent: string,
  refactoredCode: string
): Promise<{ drifted: boolean; explanation: string }> {
  const systemPrompt = `You are a senior software architect comparing original business intent with refactored code.

Your job is to determine if the refactored code maintains the original business intent.

Respond with a JSON object containing exactly these fields:
{
  "drifted": true or false,
  "explanation": "1-2 sentence explanation of why semantic drift was detected or not detected"
}

Set drifted to true if:
- The refactored code does anything not described in the original intent
- The refactored code omits functionality that the original intent requires
- The business logic meaning has changed in any way

Set drifted to false if the refactored code faithfully implements the original intent.

Output only valid JSON. No preamble, no explanation, no markdown fences.`;

  const userPrompt = `Original Intent:
${originalIntent}

Refactored Code:
${refactoredCode}`;

  return callGPT4oJSON(systemPrompt, userPrompt);
}
