import OpenAI from 'openai';
import { AIAnalysis } from '@/types';

const grok = new OpenAI({
    apiKey: process.env.GROK_API_KEY || 'dummy-key',
    baseURL: 'https://api.x.ai/v1', // Standard Grok endpoint
});

export async function analyzeWithGrok(
    symbol: string,
    marketData: any,
    marketReport: string
): Promise<AIAnalysis> {
    const startTime = Date.now();

    try {
        if (!process.env.GROK_API_KEY) {
            throw new Error('GROK_API_KEY not configured');
        }

        const completion = await grok.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert crypto trading analyst. Analyze the provided market data and report for ${symbol}.
                    Return a JSON object with:
                    - sentiment (0-100 score, >50 bullish)
                    - confidence (0-100 score)
                    - reasoning (concise explanation)`
                },
                {
                    role: 'user',
                    content: `Market Report: ${marketReport}\n\nTechnical Data: ${JSON.stringify(marketData)}`
                }
            ],
            model: 'grok-beta', // Or current Grok model name
            // Grok might not support response_format: { type: 'json_object' } yet, so we prompt for JSON
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('Empty response from Grok');

        // Basic JSON extraction if strict mode isn't supported
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        let result;
        try {
            result = JSON.parse(jsonStr);
        } catch (e) {
            // Fallback if parsing fails
            result = { sentiment: 50, confidence: 50, reasoning: content.substring(0, 200) };
        }

        return {
            model: 'grok', // We'll need to update the type definition
            sentiment: result.sentiment,
            confidence: result.confidence / 100, // Normalize to 0-1
            reasoning: result.reasoning,
            tokensUsed: completion.usage?.total_tokens,
            responseTimeMs: Date.now() - startTime
        };
    } catch (error) {
        console.error('Grok analysis failed:', error);
        throw error;
    }
}
