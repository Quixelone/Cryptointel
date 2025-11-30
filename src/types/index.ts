export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED';
export type SignalStrength = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface AIAnalysis {
    model: 'claude' | 'gpt4' | 'gemini' | 'mistral' | 'deepseek' | 'grok';
    sentiment: number;      // 0-100
    confidence: number;     // 0-100
    reasoning: string;
    tokensUsed?: number;
    cost?: number;
    responseTimeMs?: number;
}

export interface TradingSignal {
    id?: string;
    symbol: string;
    strength: SignalStrength;
    direction: TradeDirection | null;
    sentiment: number;
    confidence: number;
    consensus: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    reasoning: string;
    analyses: AIAnalysis[];
    timestamp: string;
    sessionId?: string;
}

export interface Trade {
    id: string;
    user_id: string;
    pair_id?: string;
    symbol: string; // Joined from pairs
    direction: TradeDirection;
    status: TradeStatus;
    entry_price: number;
    exit_price?: number;
    current_price?: number;
    stop_loss: number;
    take_profit: number;
    quantity: number;
    position_value: number;
    pnl: number;
    pnl_percent: number;
    fees: number;
    entry_time: string;
    exit_time?: string;
    ai_confidence?: number;
    signal_strength?: string;
    sessionId?: string;
}

export interface Portfolio {
    balance: number;
    equity: number;
    realized_pnl: number;
    unrealized_pnl: number;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    max_drawdown: number;
}

export interface MarketPrice {
    symbol: string;
    price: number;
    change24h: number;
    volume: number;
    marketCap: number;
    lastUpdated: string;
}
