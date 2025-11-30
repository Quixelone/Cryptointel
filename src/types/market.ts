export interface TechnicalIndicators {
    rsi: number;
    macd: {
        value: number;
        signal: number;
        histogram: number;
    };
    ema: {
        ema50: number;
        ema200: number;
    };
    bollingerBands: {
        upper: number;
        middle: number;
        lower: number;
    };
}

export interface MacroData {
    interestRates: {
        us: number;
        eu: number;
        jp: number;
    };
    dxy: number; // US Dollar Index
    vix: number; // Volatility Index
    globalLiquidity: 'EXPANDING' | 'CONTRACTING' | 'NEUTRAL';
}

export interface NewsSentiment {
    score: number; // -100 to 100
    summary: string;
    keyTopics: string[];
    sources: number;
}

export interface MarketContext {
    technicals: TechnicalIndicators;
    macro: MacroData;
    news: NewsSentiment;
    onChain?: {
        activeAddresses: number;
        exchangeFlow: number; // Net flow
    };
}
