import { TradingSignal } from '@/types';
import { MarketContext } from '@/types/market';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export interface AnalysisSession {
    id?: string;
    user_id: string;
    symbol: string;
    timestamp: string;

    // Market snapshot
    price: number;
    volume?: number;
    market_cap?: number;

    // Context snapshots
    technical_data: any;
    macro_data: any;
    news_data: any;
    market_report: string;

    // AI analyses
    ai_analyses: any[];

    // Signal
    signal_strength?: string;
    signal_direction?: string;
    consensus_sentiment: number;
    consensus_confidence: number;

    // Execution
    was_executed: boolean;
    trade_id?: string;

    // Learning outcome (filled later)
    actual_outcome?: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'NOT_TRADED';
    actual_pnl?: number;
    actual_pnl_percent?: number;
}

/**
 * Learning Logger - Saves all analysis sessions for continuous learning with Supabase
 */
export class LearningLogger {
    /**
     * Log a complete analysis session to Supabase
     */
    static async logAnalysis(params: {
        userId: string;
        symbol: string;
        price: number;
        marketContext: MarketContext;
        marketReport: string;
        signal: TradingSignal;
        wasExecuted: boolean;
        tradeId?: string;
    }): Promise<string> {
        const session: AnalysisSession = {
            user_id: params.userId,
            symbol: params.symbol,
            timestamp: new Date().toISOString(),

            price: params.price,

            technical_data: params.marketContext.technicals,
            macro_data: params.marketContext.macro,
            news_data: params.marketContext.news,
            market_report: params.marketReport,

            ai_analyses: params.signal.analyses,

            signal_strength: params.signal.strength,
            signal_direction: params.signal.direction || undefined,
            consensus_sentiment: params.signal.sentiment,
            consensus_confidence: params.signal.confidence,

            was_executed: params.wasExecuted,
            trade_id: params.tradeId
        };

        try {
            const supabase = createServerSupabaseClient();
            const { data, error } = await supabase
                .from('analysis_sessions')
                .insert(session)
                .select()
                .single();

            if (error) {
                console.error('Failed to save analysis session:', error);
                return 'fallback-' + Date.now();
            }

            console.log(`📚 Learning Session Saved to DB: ${params.symbol} - ${params.signal.strength} ${params.signal.direction || 'HOLD'}`);

            return data.id;
        } catch (error) {
            console.error('Supabase error:', error);
            return 'error-' + Date.now();
        }
    }

    /**
     * Mark a session as executed (trade opened)
     */
    static async markExecuted(params: {
        sessionId: string;
        tradeId: string;
    }): Promise<void> {
        try {
            const supabase = createServerSupabaseClient();
            const { error } = await supabase
                .from('analysis_sessions')
                .update({
                    was_executed: true,
                    trade_id: params.tradeId
                })
                .eq('id', params.sessionId);

            if (error) {
                console.error('Failed to mark execution:', error);
            }
        } catch (error) {
            console.error('Supabase error:', error);
        }
    }

    /**
     * Record trade outcome for learning
     */
    static async recordOutcome(params: {
        sessionId: string;
        outcome: 'WIN' | 'LOSS' | 'BREAK_EVEN';
        pnl: number;
        pnlPercent: number;
    }): Promise<void> {
        try {
            const supabase = createServerSupabaseClient();
            const { error } = await supabase
                .from('analysis_sessions')
                .update({
                    actual_outcome: params.outcome,
                    actual_pnl: params.pnl,
                    actual_pnl_percent: params.pnlPercent,
                    outcome_recorded_at: new Date().toISOString()
                })
                .eq('id', params.sessionId);

            if (error) {
                console.error('Failed to record outcome:', error);
                return;
            }

            console.log(`🎓 Outcome Recorded: ${params.outcome} (${params.pnlPercent.toFixed(2)}%)`);

            // Trigger will automatically update model learning stats
        } catch (error) {
            console.error('Supabase error:', error);
        }
    }

    /**
     * Get learning statistics from Supabase
     */
    static async getStats(userId: string): Promise<{
        totalAnalyses: number;
        executed: number;
        winRate: number;
        avgConfidenceWhenWin: number;
        avgConfidenceWhenLoss: number;
        bestPerformingModel: string;
    }> {
        try {
            const supabase = createServerSupabaseClient();

            // Get all sessions
            const { data: sessions, error } = await supabase
                .from('analysis_sessions')
                .select('*')
                .eq('user_id', userId);

            if (error || !sessions) {
                console.error('Failed to fetch stats:', error);
                return {
                    totalAnalyses: 0,
                    executed: 0,
                    winRate: 0,
                    avgConfidenceWhenWin: 0,
                    avgConfidenceWhenLoss: 0,
                    bestPerformingModel: 'N/A'
                };
            }

            const completedTrades = sessions.filter(s => s.actual_outcome);
            const wins = completedTrades.filter(s => s.actual_outcome === 'WIN').length;
            const executed = sessions.filter(s => s.was_executed).length;
            const winRate = completedTrades.length > 0 ? wins / completedTrades.length : 0;

            const winSessions = completedTrades.filter(s => s.actual_outcome === 'WIN');
            const lossSessions = completedTrades.filter(s => s.actual_outcome === 'LOSS');

            const avgConfidenceWhenWin = winSessions.length > 0
                ? winSessions.reduce((sum, s) => sum + s.consensus_confidence, 0) / winSessions.length
                : 0;

            const avgConfidenceWhenLoss = lossSessions.length > 0
                ? lossSessions.reduce((sum, s) => sum + s.consensus_confidence, 0) / lossSessions.length
                : 0;

            // Get best performing model from ai_model_learning table
            const { data: modelStats } = await supabase
                .from('ai_model_learning')
                .select('model_name, accuracy')
                .eq('user_id', userId)
                .order('accuracy', { ascending: false })
                .limit(1)
                .single();

            const bestPerformingModel = modelStats
                ? `${modelStats.model_name} (${(modelStats.accuracy * 100).toFixed(1)}%)`
                : 'N/A';

            return {
                totalAnalyses: sessions.length,
                executed,
                winRate,
                avgConfidenceWhenWin,
                avgConfidenceWhenLoss,
                bestPerformingModel
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalAnalyses: 0,
                executed: 0,
                winRate: 0,
                avgConfidenceWhenWin: 0,
                avgConfidenceWhenLoss: 0,
                bestPerformingModel: 'N/A'
            };
        }
    }

    /**
     * Export training data for ML/AI fine-tuning
     */
    static async exportTrainingData(userId: string): Promise<any[]> {
        try {
            const supabase = createServerSupabaseClient();

            const { data: sessions, error } = await supabase
                .from('analysis_sessions')
                .select('*')
                .eq('user_id', userId)
                .not('actual_outcome', 'is', null);

            if (error || !sessions) {
                console.error('Failed to export data:', error);
                return [];
            }

            return sessions.map(session => ({
                input: {
                    symbol: session.symbol,
                    price: session.price,
                    technicals: session.technical_data,
                    macro: session.macro_data,
                    news: session.news_data,
                    marketReport: session.market_report
                },
                prediction: {
                    sentiment: session.consensus_sentiment,
                    confidence: session.consensus_confidence,
                    direction: session.signal_direction
                },
                actual: {
                    outcome: session.actual_outcome,
                    pnl: session.actual_pnl,
                    pnlPercent: session.actual_pnl_percent
                },
                timestamp: session.timestamp
            }));
        } catch (error) {
            console.error('Error exporting data:', error);
            return [];
        }
    }
}
