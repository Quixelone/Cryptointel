import OpenAI from 'openai';
import { AIAnalysis } from '@/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export async function analyzeWithGPT4(
    symbol: string,
    marketData: any,
    marketReport: string
): Promise<AIAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('Missing OPENAI_API_KEY, returning mock data');
        return {
            model: 'gpt4',
            sentiment: 60,
            confidence: 0.75,
            reasoning: "Mock analysis: GPT-4 sees consolidation pattern.",
            tokensUsed: 0,
            cost: 0,
            responseTimeMs: 100
        };
    }

    const startTime = Date.now();

    const prompt = `
You are an expert crypto trading analyst with deep knowledge of technical analysis, macroeconomics, and market psychology.

Analyze ${symbol} for a potential trading opportunity using the comprehensive market data below:

${marketReport}

Your task:
1. Synthesize ALL information (technicals, macro, news)
2. Identify key risks and opportunities
3. Provide a clear, data-driven trading recommendation

Respond in JSON format:
{
  "sentiment": <0-100, where 0=extremely bearish, 100=extremely bullish>,
  "confidence": <0-100, your confidence in this analysis>,
  "reasoning": "<concise explanation citing specific data points from the report>"
}

Be objective. Consider ALL factors. Output ONLY valid JSON.
  `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: 'You are an expert crypto trading analyst.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0].message.content || '{}';

        if (!text || text.trim().length === 0) {
            throw new Error('GPT-4 returned empty response');
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse GPT-4 JSON response:', text);
            throw new Error(`Invalid JSON response from GPT-4: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        // Validate response structure
        if (typeof result.sentiment !== 'number' || 
            typeof result.confidence !== 'number' || 
            typeof result.reasoning !== 'string') {
            throw new Error('GPT-4 response missing required fields (sentiment, confidence, reasoning)');
        }

        // Validate ranges
        if (result.sentiment < 0 || result.sentiment > 100) {
            throw new Error(`GPT-4 sentiment out of range: ${result.sentiment} (expected 0-100)`);
        }
        if (result.confidence < 0 || result.confidence > 100) {
            throw new Error(`GPT-4 confidence out of range: ${result.confidence} (expected 0-100)`);
        }

        return {
            model: 'gpt4',
            sentiment: result.sentiment,
            confidence: result.confidence / 100,
            reasoning: result.reasoning,
            tokensUsed: response.usage?.total_tokens || 0,
            cost: 0, // Implement cost calc
            responseTimeMs: Date.now() - startTime
        };
    } catch (error) {
        console.error('GPT-4 analysis failed:', error);
        throw error;
    }
}
