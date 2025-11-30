import { TradingSignal, Portfolio, Trade } from '@/types';

interface RiskCheck {
    name: string;
    pass: boolean;
    detail: string;
}

interface RiskDecision {
    canTrade: boolean;
    checks: RiskCheck[];
    positionSize: number;
    reasoning: string;
}

export class TradingEngine {
    private settings = {
        maxPositionPct: 0.10, // 10% max per trade
        maxDrawdownPct: 0.15, // 15% max portfolio drawdown
        minConfidence: 0.70,  // 70% min AI confidence
    };

    checkRisk(signal: TradingSignal, portfolio: Portfolio): RiskDecision {
        const checks: RiskCheck[] = [];

        // 1. Confidence Check
        const confidencePass = signal.confidence >= this.settings.minConfidence;
        checks.push({
            name: 'AI Confidence',
            pass: confidencePass,
            detail: `Confidence ${signal.confidence.toFixed(2)} ${confidencePass ? '>=' : '<'} ${this.settings.minConfidence}`
        });

        // 2. Drawdown Check
        const drawdownPass = portfolio.max_drawdown < this.settings.maxDrawdownPct;
        checks.push({
            name: 'Max Drawdown',
            pass: drawdownPass,
            detail: `Drawdown ${(portfolio.max_drawdown * 100).toFixed(2)}% ${drawdownPass ? '<' : '>='} ${(this.settings.maxDrawdownPct * 100).toFixed(2)}%`
        });

        // 3. Signal Strength Check
        const strengthPass = signal.strength !== 'HOLD';
        checks.push({
            name: 'Signal Strength',
            pass: strengthPass,
            detail: `Signal is ${signal.strength}`
        });

        const canTrade = checks.every(c => c.pass);

        // Calculate Position Size (Kelly Criterion simplified or Fixed Fractional)
        let positionSize = 0;
        if (canTrade) {
            // Use Fixed Fractional for safety in MVP
            positionSize = portfolio.equity * this.settings.maxPositionPct;
        }

        return {
            canTrade,
            checks,
            positionSize,
            reasoning: canTrade ? 'All risk checks passed.' : 'Risk checks failed.'
        };
    }

    calculatePositionSize(balance: number, confidence: number): number {
        // Simple sizing: Base * Confidence
        const baseSize = balance * this.settings.maxPositionPct;
        return baseSize * confidence;
    }
}
