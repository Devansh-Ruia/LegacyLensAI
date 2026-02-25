import { NextRequest, NextResponse } from 'next/server';
import { callGPT4o } from '@/lib/azure-openai';

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, temperature, maxTokens } = await request.json();
    
    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'systemPrompt and userPrompt are required' },
        { status: 400 }
      );
    }
    
    console.log('Calling Azure OpenAI via proxy');
    
    try {
      const response = await callGPT4o(systemPrompt, userPrompt);
      
      return NextResponse.json({
        refactoredCode: response
      });
      
    } catch (error: any) {
      console.error('Azure OpenAI proxy error:', error);
      return NextResponse.json(
        { error: error.message || 'OpenAI call failed' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Azure OpenAI proxy API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
