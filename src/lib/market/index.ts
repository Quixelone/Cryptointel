import { MarketContext } from '@/types/market';
import { calculateTechnicalIndicators, interpretTechnicals } from './technicals';
import { getMacroData, analyzeMacroImpact } from './macro';
import { analyzeNewsSentiment } from './news';

/**
 * Aggregate all market context data for comprehensive analysis
 */
export async function gatherMarketContext(
    symbol: string,
    currentPrice: number
): Promise<MarketContext> {
    // Gather all data in parallel for speed
    const [technicals, macro, news] = await Promise.all([
        Promise.resolve(calculateTechnicalIndicators(currentPrice, symbol)),
        getMacroData(),
        analyzeNewsSentiment(symbol)
    ]);

    return {
        technicals,
        macro,
        news
    };
}

/**
 * Generate a comprehensive market report for AI analysis
 */
export async function generateMarketReport(
    symbol: string,
    currentPrice: number
): Promise<string> {
    const context = await gatherMarketContext(symbol, currentPrice);

    const techAnalysis = interpretTechnicals(context.technicals);
    const macroAnalysis = analyzeMacroImpact(context.macro);

    return `
=== COMPREHENSIVE MARKET ANALYSIS FOR ${symbol} ===

📊 TECHNICAL ANALYSIS:
- Current Price: €${currentPrice.toFixed(2)}
- Trend: ${techAnalysis.trend} (Strength: ${techAnalysis.strength}%)
- RSI: ${context.technicals.rsi.toFixed(1)} ${context.technicals.rsi < 30 ? '(Oversold)' : context.technicals.rsi > 70 ? '(Overbought)' : '(Neutral)'}
- MACD: ${context.technicals.macd.histogram > 0 ? 'Bullish' : 'Bearish'} (Histogram: ${context.technicals.macd.histogram.toFixed(4)})
- EMA50: €${context.technicals.ema.ema50.toFixed(2)}
- EMA200: €${context.technicals.ema.ema200.toFixed(2)}
- Price vs EMA50: ${currentPrice > context.technicals.ema.ema50 ? 'Above (Bullish)' : 'Below (Bearish)'}
- Bollinger Bands: Lower €${context.technicals.bollingerBands.lower.toFixed(2)} | Middle €${context.technicals.bollingerBands.middle.toFixed(2)} | Upper €${context.technicals.bollingerBands.upper.toFixed(2)}

Technical Signals:
${techAnalysis.signals.map(s => `  • ${s}`).join('\n')}

🌍 MACROECONOMIC ENVIRONMENT:
- US Interest Rate: ${context.macro.interestRates.us.toFixed(2)}%
- EU Interest Rate: ${context.macro.interestRates.eu.toFixed(2)}%
- Japan Interest Rate: ${context.macro.interestRates.jp.toFixed(2)}% ${context.macro.interestRates.us - context.macro.interestRates.jp > 5 ? '⚠️ HIGH CARRY TRADE RISK' : ''}
- US Dollar Index (DXY): ${context.macro.dxy.toFixed(2)} ${context.macro.dxy > 105 ? '(Strong USD - Bearish for crypto)' : '(Weak USD - Bullish for crypto)'}
- VIX (Fear Index): ${context.macro.vix.toFixed(2)} ${context.macro.vix > 25 ? '(High fear)' : '(Low fear)'}
- Global Liquidity: ${context.macro.globalLiquidity}

Macro Assessment:
- Crypto Friendly: ${macroAnalysis.cryptoFriendly ? '✅ YES' : '❌ NO'}
- Risk Level: ${macroAnalysis.risk}
${macroAnalysis.warnings.length > 0 ? `Warnings:\n${macroAnalysis.warnings.map(w => `  ${w}`).join('\n')}` : ''}

📰 NEWS & SENTIMENT:
- Sentiment Score: ${context.news.score.toFixed(1)}/100 ${context.news.score > 20 ? '(Positive)' : context.news.score < -20 ? '(Negative)' : '(Neutral)'}
- Sources Analyzed: ${context.news.sources}
- Summary: ${context.news.summary}
- Key Topics: ${context.news.keyTopics.join(', ')}

=== END OF REPORT ===
`;
}
