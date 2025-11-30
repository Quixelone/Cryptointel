import OpenAI from 'openai';
import { AIAnalysis } from '@/types';

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key',
    baseURL: 'https://api.deepseek.com/v1', // Standard DeepSeek endpoint
});

export async function analyzeWithDeepSeek(
    symbol: string,
    marketData: any,
    marketReport: string
): Promise<AIAnalysis> {
    const startTime = Date.now();

    try {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('DEEPSEEK_API_KEY not configured');
        }

        const completion = await deepseek.chat.completions.create({
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
            model: 'deepseek-chat',
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('Empty response from DeepSeek');

        const result = JSON.parse(content);

        return {
            model: 'deepseek', // We'll need to update the type definition
            sentiment: result.sentiment,
            confidence: result.confidence / 100, // Normalize to 0-1
            reasoning: result.reasoning,
            tokensUsed: completion.usage?.total_tokens,
            responseTimeMs: Date.now() - startTime
        };
    } catch (error) {
        console.error('DeepSeek analysis failed:', error);
        throw error;
    }
}
