/**
 * Advanced Position Sizing Engine
 */

export interface PositionSizeParams {
    balance: number;
    winRate: number; // Historical win rate (0-1)
    avgWinPercent: number; // Average winning trade %
    avgLossPercent: number; // Average losing trade %
    riskPerTrade: number; // Max % of balance to risk (default 0.02 = 2%)
    confidence: number; // AI confidence (0-1)
}

/**
 * Kelly Criterion for optimal position sizing
 * Formula: f = (bp - q) / b
 * Where:
 * - f = fraction of capital to wager
 * - b = odds received on the wager (payoff ratio)
 * - p = probability of winning
 * - q = probability of losing (1-p)
 */
export function kellyPositionSize(params: PositionSizeParams): number {
    const { winRate, avgWinPercent, avgLossPercent, balance, confidence } = params;

    // Validate inputs
    if (balance <= 0 || !isFinite(balance)) {
        throw new Error(`Invalid balance: ${balance}. Must be a positive finite number.`);
    }
    if (avgLossPercent === 0 || !isFinite(avgLossPercent)) {
        throw new Error(`Invalid avgLossPercent: ${avgLossPercent}. Cannot be zero or infinite.`);
    }
    if (!isFinite(avgWinPercent)) {
        throw new Error(`Invalid avgWinPercent: ${avgWinPercent}. Must be a finite number.`);
    }
    if (winRate < 0 || winRate > 1 || !isFinite(winRate)) {
        throw new Error(`Invalid winRate: ${winRate}. Must be between 0 and 1.`);
    }
    if (confidence < 0 || confidence > 1 || !isFinite(confidence)) {
        throw new Error(`Invalid confidence: ${confidence}. Must be between 0 and 1.`);
    }

    // Payoff ratio: avg win / avg loss
    const payoffRatio = Math.abs(avgWinPercent / avgLossPercent);

    // Kelly fraction
    const kellyFraction = (payoffRatio * winRate - (1 - winRate)) / payoffRatio;

    // Use fractional Kelly (50%) to be more conservative
    const fractionalKelly = Math.max(0, kellyFraction * 0.5);

    // Apply confidence adjustment
    const confidenceAdjusted = fractionalKelly * confidence;

    // Cap at max risk per trade
    const cappedFraction = Math.min(confidenceAdjusted, params.riskPerTrade * 2);

    return balance * cappedFraction;
}

/**
 * Fixed fractional position sizing (simpler, more conservative)
 */
export function fixedFractionalSize(
    balance: number,
    riskPercent: number = 0.02, // 2% of balance
    confidence: number = 1.0
): number {
    if (balance <= 0 || !isFinite(balance)) {
        throw new Error(`Invalid balance: ${balance}. Must be a positive finite number.`);
    }
    if (riskPercent < 0 || riskPercent > 1 || !isFinite(riskPercent)) {
        throw new Error(`Invalid riskPercent: ${riskPercent}. Must be between 0 and 1.`);
    }
    if (confidence < 0 || confidence > 1 || !isFinite(confidence)) {
        throw new Error(`Invalid confidence: ${confidence}. Must be between 0 and 1.`);
    }
    return balance * riskPercent * confidence;
}

/**
 * Volatility-adjusted position sizing
 */
export function volatilityAdjustedSize(
    balance: number,
    baseRisk: number,
    volatility: number // e.g., from ATR or standard deviation
): number {
    if (balance <= 0 || !isFinite(balance)) {
        throw new Error(`Invalid balance: ${balance}. Must be a positive finite number.`);
    }
    if (baseRisk < 0 || baseRisk > 1 || !isFinite(baseRisk)) {
        throw new Error(`Invalid baseRisk: ${baseRisk}. Must be between 0 and 1.`);
    }
    if (volatility < 0 || !isFinite(volatility)) {
        throw new Error(`Invalid volatility: ${volatility}. Must be a non-negative finite number.`);
    }
    // Lower position size in high volatility
    const volatilityFactor = 1 / (1 + volatility);
    return balance * baseRisk * volatilityFactor;
}

/**
 * Smart position sizer that chooses best method
 */
export function calculateOptimalSize(
    balance: number,
    confidence: number,
    historicalStats?: {
        winRate: number;
        avgWin: number;
        avgLoss: number;
        totalTrades: number;
    }
): {
    size: number;
    method: string;
    reasoning: string;
} {
    // Validate balance and confidence
    if (balance <= 0 || !isFinite(balance)) {
        throw new Error(`Invalid balance: ${balance}. Must be a positive finite number.`);
    }
    if (confidence < 0 || confidence > 1 || !isFinite(confidence)) {
        throw new Error(`Invalid confidence: ${confidence}. Must be between 0 and 1.`);
    }

    // If we have enough historical data, use Kelly
    if (historicalStats && historicalStats.totalTrades >= 30) {
        // Validate historical stats
        if (historicalStats.avgLoss === 0 || !isFinite(historicalStats.avgLoss)) {
            // Fall back to fixed fractional if avgLoss is invalid
            const size = fixedFractionalSize(balance, 0.02, confidence);
            return {
                size: Math.min(size, balance * 0.05),
                method: 'Fixed Fractional',
                reasoning: 'Falling back to fixed fractional due to invalid historical loss data'
            };
        }

        const kellySize = kellyPositionSize({
            balance,
            winRate: historicalStats.winRate,
            avgWinPercent: historicalStats.avgWin,
            avgLossPercent: historicalStats.avgLoss,
            riskPerTrade: 0.02,
            confidence
        });

        return {
            size: Math.min(kellySize, balance * 0.1), // Cap at 10% of balance
            method: 'Kelly Criterion',
            reasoning: `Optimal size based on ${historicalStats.totalTrades} historical trades`
        };
    }

    // Default to fixed fractional with confidence adjustment
    const size = fixedFractionalSize(balance, 0.02, confidence);

    return {
        size: Math.min(size, balance * 0.05), // Cap at 5% for safety
        method: 'Fixed Fractional',
        reasoning: 'Conservative sizing due to limited historical data'
    };
}
