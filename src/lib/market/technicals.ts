import { TechnicalIndicators } from '@/types/market';

/**
 * Calculate technical indicators from price data
 * In production, you'd fetch historical OHLCV data from an exchange API
 * For now, we'll simulate realistic values based on current price
 */
export function calculateTechnicalIndicators(
    currentPrice: number,
    symbol: string
): TechnicalIndicators {
    // Simulate realistic technical analysis based on market conditions
    const volatility = Math.random() * 0.3 + 0.7; // 0.7-1.0 multiplier

    // RSI: Relative Strength Index (0-100)
    // 30 = oversold, 70 = overbought
    const rsi = 30 + Math.random() * 40; // 30-70 range

    // MACD (Moving Average Convergence Divergence)
    const macdValue = (Math.random() - 0.5) * currentPrice * 0.02;
    const macdSignal = macdValue * (0.8 + Math.random() * 0.4);

    // EMAs (Exponential Moving Averages)
    const ema50 = currentPrice * (0.95 + Math.random() * 0.1); // ±5%
    const ema200 = currentPrice * (0.90 + Math.random() * 0.2); // ±10%

    // Bollinger Bands
    const bbWidth = currentPrice * 0.04 * volatility; // 4% width adjusted for volatility
    const middle = currentPrice * (0.98 + Math.random() * 0.04);

    return {
        rsi,
        macd: {
            value: macdValue,
            signal: macdSignal,
            histogram: macdValue - macdSignal
        },
        ema: {
            ema50,
            ema200
        },
        bollingerBands: {
            upper: middle + bbWidth,
            middle,
            lower: middle - bbWidth
        }
    };
}

/**
 * Interpret technical indicators into readable signals
 */
export function interpretTechnicals(indicators: TechnicalIndicators): {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number; // 0-100
    signals: string[];
} {
    const signals: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;

    // RSI Analysis
    if (indicators.rsi < 30) {
        signals.push('RSI oversold (potential reversal up)');
        bullishScore += 30;
    } else if (indicators.rsi > 70) {
        signals.push('RSI overbought (potential reversal down)');
        bearishScore += 30;
    } else {
        signals.push(`RSI neutral at ${indicators.rsi.toFixed(1)}`);
    }

    // MACD Analysis
    if (indicators.macd.histogram > 0) {
        signals.push('MACD bullish (histogram positive)');
        bullishScore += 25;
    } else {
        signals.push('MACD bearish (histogram negative)');
        bearishScore += 25;
    }

    // EMA Trend
    if (indicators.ema.ema50 > indicators.ema.ema200) {
        signals.push('Golden cross (EMA50 > EMA200)');
        bullishScore += 25;
    } else {
        signals.push('Death cross (EMA50 < EMA200)');
        bearishScore += 25;
    }

    // Bollinger Bands
    const currentPrice = indicators.bollingerBands.middle; // Approximation
    const bbPosition = (currentPrice - indicators.bollingerBands.lower) /
        (indicators.bollingerBands.upper - indicators.bollingerBands.lower);

    if (bbPosition < 0.2) {
        signals.push('Price near lower BB (oversold)');
        bullishScore += 20;
    } else if (bbPosition > 0.8) {
        signals.push('Price near upper BB (overbought)');
        bearishScore += 20;
    }

    const netScore = bullishScore - bearishScore;
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

    if (netScore > 20) trend = 'BULLISH';
    else if (netScore < -20) trend = 'BEARISH';

    return {
        trend,
        strength: Math.abs(netScore),
        signals
    };
}
