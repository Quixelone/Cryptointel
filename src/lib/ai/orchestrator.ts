import { analyzeWithClaude } from './claude';
import { analyzeWithGPT4 } from './openai';
import { analyzeWithDeepSeek } from './deepseek';
import { AIAnalysis, TradingSignal, SignalStrength, TradeDirection } from '@/types';
import { generateMarketReport, gatherMarketContext } from '@/lib/market';

export async function orchestrateAnalysis(
    symbol: string,
    marketData: any
): Promise<{ signal: TradingSignal; marketContext: any; marketReport: string }> {
    // Step 1: Gather comprehensive market context
    console.log(`🔍 Gathering market context for ${symbol}...`);
    const marketReport = await generateMarketReport(symbol, marketData.price);

    console.log('📊 Market Report Generated:');
    console.log(marketReport);

    // Step 2: Run AI analyses in parallel with enhanced context
    console.log('🚀 Starting parallel AI analysis (Claude, GPT-4, DeepSeek)...');
    const results = await Promise.allSettled([
        analyzeWithClaude(symbol, marketData, marketReport).then(res => { console.log('✅ Claude finished'); return res; }).catch(err => { console.error('❌ Claude failed:', err); throw err; }),
        analyzeWithGPT4(symbol, marketData, marketReport).then(res => { console.log('✅ GPT-4 finished'); return res; }).catch(err => { console.error('❌ GPT-4 failed:', err); throw err; }),
        analyzeWithDeepSeek(symbol, marketData, marketReport).then(res => { console.log('✅ DeepSeek finished'); return res; }).catch(err => { console.error('❌ DeepSeek failed:', err); throw err; })
    ]);

    const analyses: AIAnalysis[] = [];

    results.forEach((result, index) => {
        const modelNames = ['Claude', 'GPT-4', 'DeepSeek'];
        if (result.status === 'fulfilled') {
            analyses.push(result.value);
            console.log(`✅ ${modelNames[index]} analysis complete`);
        } else {
            console.error(`❌ ${modelNames[index]} analysis failed:`, result.reason);
        }
    });

    if (analyses.length === 0) {
        throw new Error('All AI analyses failed');
    }

    console.log(`📈 ${analyses.length} AI models responded successfully`);

    // Step 3: Calculate weighted consensus
    const avgSentiment = analyses.reduce((sum, a) => sum + a.sentiment, 0) / analyses.length;
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    // Step 4: Determine Signal Strength (more conservative thresholds)
    let strength: SignalStrength = 'HOLD';
    let direction: TradeDirection | null = null;

    if (avgSentiment >= 75 && avgConfidence > 0.75) {
        strength = 'STRONG_BUY';
        direction = 'LONG';
    } else if (avgSentiment >= 60 && avgConfidence > 0.65) {
        strength = 'BUY';
        direction = 'LONG';
    } else if (avgSentiment <= 25 && avgConfidence > 0.75) {
        strength = 'STRONG_SELL';
        direction = 'SHORT';
    } else if (avgSentiment <= 40 && avgConfidence > 0.65) {
        strength = 'SELL';
        direction = 'SHORT';
    }

    // Step 5: Calculate dynamic risk levels based on volatility and macro
    const currentPrice = marketData.price;

    // Validate current price
    if (typeof currentPrice !== 'number' || currentPrice <= 0 || !isFinite(currentPrice)) {
        throw new Error(`Invalid current price: ${currentPrice}. Must be a positive finite number.`);
    }

    let stopLoss = 0;
    let takeProfit = 0;

    if (direction === 'LONG') {
        // More conservative stops in high-risk macro environment
        stopLoss = currentPrice * 0.97;  // 3% SL (was 2%)
        takeProfit = currentPrice * 1.05; // 5% TP (was 4%)

        // Validate calculated values
        if (stopLoss <= 0 || takeProfit <= 0 || stopLoss >= takeProfit) {
            throw new Error(`Invalid stopLoss/takeProfit for LONG: SL=${stopLoss}, TP=${takeProfit}`);
        }
    } else if (direction === 'SHORT') {
        stopLoss = currentPrice * 1.03;
        takeProfit = currentPrice * 0.95;

        // Validate calculated values (for SHORT, stopLoss > currentPrice > takeProfit)
        if (stopLoss <= currentPrice || takeProfit >= currentPrice || takeProfit <= 0) {
            throw new Error(`Invalid stopLoss/takeProfit for SHORT: SL=${stopLoss}, TP=${takeProfit}, Price=${currentPrice}`);
        }
    }

    // Step 6: Synthesize comprehensive reasoning
    const modelAgreement = analyses.filter(a =>
        (a.sentiment > 50 && avgSentiment > 50) || (a.sentiment < 50 && avgSentiment < 50)
    ).length;

    const consensusReasoning = `
Multi-factor consensus analysis based on ${analyses.length} AI models with comprehensive market context:

📊 AI Consensus: ${avgSentiment.toFixed(1)}% sentiment, ${(avgConfidence * 100).toFixed(1)}% confidence
   Models in agreement: ${modelAgreement}/${analyses.length}

🔍 Analysis includes:
   • Technical indicators (RSI, MACD, EMAs, Bollinger Bands)
   • Macroeconomic factors (interest rates, USD strength, VIX, global liquidity)
   • News sentiment from multiple sources
   
💡 Key insights from AI models:
${analyses.map(a => `   • ${a.model}: ${a.reasoning.substring(0, 100)}...`).join('\n')}

Signal: ${strength} ${direction || 'NEUTRAL'}
`.trim();

    console.log('🎯 Final Signal:', strength, direction);
    console.log('📝 Reasoning:', consensusReasoning);

    // Gather market context for learning
    const marketContext = await gatherMarketContext(symbol, currentPrice);

    const signal: TradingSignal = {
        symbol,
        strength,
        direction,
        sentiment: avgSentiment,
        confidence: avgConfidence,
        consensus: avgConfidence,
        entryPrice: currentPrice,
        stopLoss,
        takeProfit,
        reasoning: consensusReasoning,
        analyses,
        timestamp: new Date().toISOString()
    };

    return {
        signal,
        marketContext,
        marketReport
    };
}

