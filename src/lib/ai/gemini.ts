import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysis } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'mock-key');

export async function analyzeWithGemini(
    symbol: string,
    marketData: any,
    marketReport: string
): Promise<AIAnalysis> {
    if (!process.env.GOOGLE_AI_API_KEY) {
        console.warn('Missing GOOGLE_AI_API_KEY, returning mock data');
        return {
            model: 'gemini',
            sentiment: 70,
            confidence: 0.82,
            reasoning: "Mock analysis: Gemini detects bullish divergence on RSI.",
            tokensUsed: 0,
            cost: 0,
            responseTimeMs: 100
        };
    }

    const startTime = Date.now();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are a sophisticated crypto trading AI with expertise in quantitative analysis.

Analyze ${symbol} using this comprehensive market intelligence:

${marketReport}

Task:
1. Evaluate technical setup (trend, support/resistance, momentum)
2. Assess macro risks (carry trade, liquidity, rates)
3. Integrate news sentiment
4. Provide probability-weighted recommendation

JSON response:
{
  "sentiment": <0-100>,
  "confidence": <0-100>,
  "reasoning": "<data-driven analysis>"
}

Be analytical. Cite specific data. Output ONLY valid JSON.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            throw new Error('Gemini returned empty response');
        }

        let parsed;
        try {
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON response:', text);
            throw new Error(`Invalid JSON response from Gemini: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        // Validate response structure
        if (typeof parsed.sentiment !== 'number' || 
            typeof parsed.confidence !== 'number' || 
            typeof parsed.reasoning !== 'string') {
            throw new Error('Gemini response missing required fields (sentiment, confidence, reasoning)');
        }

        // Validate ranges
        if (parsed.sentiment < 0 || parsed.sentiment > 100) {
            throw new Error(`Gemini sentiment out of range: ${parsed.sentiment} (expected 0-100)`);
        }
        if (parsed.confidence < 0 || parsed.confidence > 100) {
            throw new Error(`Gemini confidence out of range: ${parsed.confidence} (expected 0-100)`);
        }

        return {
            model: 'gemini',
            sentiment: parsed.sentiment,
            confidence: parsed.confidence / 100,
            reasoning: parsed.reasoning,
            tokensUsed: 0, // Gemini API doesn't always return token usage in basic response
            cost: 0,
            responseTimeMs: Date.now() - startTime
        };
    } catch (error) {
        console.error('Gemini analysis failed:', error);
        throw error;
    }
}
