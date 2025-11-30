import { TradingSignal } from '@/types';

export interface BacktestConfig {
    initialCapital: number;
    positionSize: number; // Fixed EUR amount per trade
    startDate: Date;
    endDate: Date;
    symbols: string[];
}

export interface BacktestTrade {
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entryTime: Date;
    entryPrice: number;
    exitTime: Date;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_REVERSAL';
}

export interface BacktestResults {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalPnLPercent: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    trades: BacktestTrade[];
    equityCurve: Array<{ date: Date; equity: number }>;
}

/**
 * Simple backtest engine
 * In production, this would:
 * 1. Load historical OHLCV data
 * 2. Replay signals chronologically
 * 3. Execute trades based on strategy rules
 * 4. Track performance metrics
 */
export function runBacktest(
    config: BacktestConfig,
    signals: TradingSignal[]
): BacktestResults {
    let capital = config.initialCapital;
    let peakCapital = config.initialCapital;
    let maxDrawdown = 0;

    const trades: BacktestTrade[] = [];
    const equityCurve: Array<{ date: Date; equity: number }> = [];

    let totalWinAmount = 0;
    let totalLossAmount = 0;

    // Sort signals by timestamp
    const sortedSignals = signals.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedSignals.forEach(signal => {
        if (!signal.direction || capital < config.positionSize) {
            return; // Skip if no direction or insufficient capital
        }

        // Simulate trade execution
        const entryPrice = signal.entryPrice;
        const stopLoss = signal.stopLoss;
        const takeProfit = signal.takeProfit;

        // Determine exit (simplified - assume random outcome within SL/TP range)
        const random = Math.random();
        let exitPrice: number;
        let exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_REVERSAL';

        if (random < 0.4) {
            // Hit stop loss
            exitPrice = stopLoss;
            exitReason = 'STOP_LOSS';
        } else {
            // Hit take profit
            exitPrice = takeProfit;
            exitReason = 'TAKE_PROFIT';
        }

        // Calculate P&L
        const priceDiff = signal.direction === 'LONG'
            ? exitPrice - entryPrice
            : entryPrice - exitPrice;

        const pnl = (priceDiff / entryPrice) * config.positionSize;
        const pnlPercent = (priceDiff / entryPrice) * 100;

        capital += pnl;

        if (pnl > 0) {
            totalWinAmount += pnl;
        } else {
            totalLossAmount += Math.abs(pnl);
        }

        // Track drawdown
        if (capital > peakCapital) {
            peakCapital = capital;
        }
        const currentDrawdown = (peakCapital - capital) / peakCapital;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

        // Record trade
        const entryTime = new Date(signal.timestamp);
        const exitTime = new Date(entryTime.getTime() + 3600000); // +1 hour

        trades.push({
            symbol: signal.symbol,
            direction: signal.direction,
            entryTime,
            entryPrice,
            exitTime,
            exitPrice,
            pnl,
            pnlPercent,
            exitReason
        });

        equityCurve.push({
            date: exitTime,
            equity: capital
        });
    });

    // Calculate statistics
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const winRate = trades.length > 0 ? winningTrades / trades.length : 0;

    const totalPnL = capital - config.initialCapital;
    const totalPnLPercent = (totalPnL / config.initialCapital) * 100;

    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;

    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0;

    const largestWin = trades.length > 0
        ? Math.max(...trades.map(t => t.pnl))
        : 0;
    const largestLoss = trades.length > 0
        ? Math.min(...trades.map(t => t.pnl))
        : 0;

    // Simplified Sharpe Ratio (assumes daily returns)
    const returns = trades.map(t => t.pnlPercent / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / Math.max(returns.length, 1);
    const stdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(returns.length, 1)
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    return {
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        winRate,
        totalPnL,
        totalPnLPercent,
        maxDrawdown,
        sharpeRatio,
        profitFactor,
        avgWin,
        avgLoss,
        largestWin,
        largestLoss,
        trades,
        equityCurve
    };
}
