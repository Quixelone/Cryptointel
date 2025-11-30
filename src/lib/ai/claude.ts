import Anthropic from '@anthropic-ai/sdk';
import { AIAnalysis } from '@/types';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key',
});

export async function analyzeWithClaude(
    symbol: string,
    marketData: any,
    marketReport: string
): Promise<AIAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('Missing ANTHROPIC_API_KEY, returning mock data');
        return {
            model: 'claude',
            sentiment: 65,
            confidence: 0.80,
            reasoning: "Mock analysis: Claude identifies potential support level.",
            tokensUsed: 0,
            cost: 0,
            responseTimeMs: 100
        };
    }

    const startTime = Date.now();

    const prompt = `
You are an expert crypto trading analyst specializing in multi-factor analysis.

Analyze ${symbol} using the comprehensive market intelligence below:

${marketReport}

Your analysis should:
1. Weight technical, macro, and sentiment factors appropriately
2. Identify the most critical risks (e.g., carry trade unwinding, regulatory, technical breakdowns)
3. Provide actionable insight

Respond in JSON:
{
  "sentiment": <0-100, bearish to bullish>,
  "confidence": <0-100, your conviction level>,
  "reasoning": "<clear explanation with specific data citations>"
}

Be rigorous. Consider risk-reward. Output ONLY valid JSON.
  `;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });

        const contentBlock = response.content[0];
        const text = contentBlock.type === 'text' ? contentBlock.text : '';

        if (!text || text.trim().length === 0) {
            throw new Error('Claude returned empty response');
        }

        let result;
        try {
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            result = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse Claude JSON response:', text);
            throw new Error(`Invalid JSON response from Claude: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        // Validate response structure
        if (typeof result.sentiment !== 'number' ||
            typeof result.confidence !== 'number' ||
            typeof result.reasoning !== 'string') {
            throw new Error('Claude response missing required fields (sentiment, confidence, reasoning)');
        }

        // Validate ranges
        if (result.sentiment < 0 || result.sentiment > 100) {
            throw new Error(`Claude sentiment out of range: ${result.sentiment} (expected 0-100)`);
        }
        if (result.confidence < 0 || result.confidence > 100) {
            throw new Error(`Claude confidence out of range: ${result.confidence} (expected 0-100)`);
        }

        return {
            model: 'claude',
            sentiment: result.sentiment,
            confidence: result.confidence / 100,
            reasoning: result.reasoning,
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
            cost: 0,
            responseTimeMs: Date.now() - startTime
        };
    } catch (error) {
        console.error('Claude analysis failed:', error);
        throw error;
    }
}
