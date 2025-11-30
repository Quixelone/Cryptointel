import { MacroData } from '@/types/market';

/**
 * Fetch or simulate macroeconomic data
 * In production, integrate with:
 * - FRED API (Federal Reserve Economic Data)
 * - Yahoo Finance API
 * - TradingView economic calendar
 */
export async function getMacroData(): Promise<MacroData> {
    // For MVP, we'll use realistic simulated data
    // In production, fetch real-time data from APIs

    return {
        interestRates: {
            us: 5.25 + Math.random() * 0.5,   // US Fed Funds Rate ~5.25-5.75%
            eu: 4.0 + Math.random() * 0.5,    // ECB Rate ~4.0-4.5%
            jp: 0.1 + Math.random() * 0.2     // BOJ Rate ~0.1-0.3% (carry trade risk!)
        },
        dxy: 103 + Math.random() * 3,         // US Dollar Index ~103-106
        vix: 15 + Math.random() * 10,         // Volatility Index ~15-25
        globalLiquidity: determineGlobalLiquidity()
    };
}

function determineGlobalLiquidity(): 'EXPANDING' | 'CONTRACTING' | 'NEUTRAL' {
    const random = Math.random();
    if (random < 0.3) return 'CONTRACTING';
    if (random < 0.7) return 'NEUTRAL';
    return 'EXPANDING';
}

/**
 * Analyze macro conditions for crypto market impact
 */
export function analyzeMacroImpact(macro: MacroData): {
    cryptoFriendly: boolean;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    warnings: string[];
} {
    const warnings: string[] = [];
    let riskScore = 0;

    // Interest Rate Risk
    const usRateDiff = macro.interestRates.us - macro.interestRates.jp;
    if (usRateDiff > 5) {
        warnings.push('⚠️ High US-JP rate differential: Carry trade unwinding risk');
        riskScore += 30;
    }

    if (macro.interestRates.us > 5.5) {
        warnings.push('High US rates: Risk-off environment for crypto');
        riskScore += 20;
    }

    // Dollar Strength
    if (macro.dxy > 105) {
        warnings.push('Strong USD: Typically bearish for crypto');
        riskScore += 20;
    } else if (macro.dxy < 100) {
        warnings.push('Weak USD: Bullish for crypto');
        riskScore -= 20;
    }

    // Volatility
    if (macro.vix > 25) {
        warnings.push('High VIX: Market fear, risk assets under pressure');
        riskScore += 30;
    } else if (macro.vix < 15) {
        warnings.push('Low VIX: Calm markets, supportive for risk assets');
        riskScore -= 10;
    }

    // Global Liquidity
    if (macro.globalLiquidity === 'CONTRACTING') {
        warnings.push('💧 Global liquidity contracting: Headwind for crypto');
        riskScore += 25;
    } else if (macro.globalLiquidity === 'EXPANDING') {
        warnings.push('💰 Global liquidity expanding: Tailwind for crypto');
        riskScore -= 25;
    }

    const cryptoFriendly = riskScore < 20;
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    if (riskScore < 20) risk = 'LOW';
    else if (riskScore > 50) risk = 'HIGH';

    return { cryptoFriendly, risk, warnings };
}
