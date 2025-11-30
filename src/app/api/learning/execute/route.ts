import { NextResponse } from 'next/server'
import { LearningLogger } from '@/lib/learning/logger'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, tradeId, tradeDetails } = body;

        if (!sessionId || !tradeId || !tradeDetails) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        // 1. Get pair_id
        const { data: pairData } = await supabase
            .from('trading_pairs')
            .select('id')
            .eq('symbol', tradeDetails.symbol)
            .single();

        if (!pairData) {
            console.error('Trading pair not found:', tradeDetails.symbol);
            // Proceed without saving trade to DB if pair not found (fallback)
            // But this will fail FK constraint on analysis_sessions if we try to link it
            // So we might skip linking trade_id if trade creation fails
        }

        if (pairData) {
            // 2. Insert trade
            const { error: tradeError } = await supabase
                .from('trades')
                .insert({
                    id: tradeId,
                    user_id: tradeDetails.user_id,
                    pair_id: pairData.id,
                    direction: tradeDetails.direction,
                    status: 'OPEN',
                    entry_price: tradeDetails.entry_price,
                    stop_loss: tradeDetails.stop_loss,
                    take_profit: tradeDetails.take_profit,
                    quantity: tradeDetails.quantity,
                    position_value: tradeDetails.position_value,
                    fees: tradeDetails.fees,
                    entry_time: tradeDetails.entry_time,
                    ai_confidence: tradeDetails.ai_confidence,
                    signal_strength: tradeDetails.signal_strength
                });

            if (tradeError) {
                console.error('Failed to create trade:', tradeError);
                // If trade creation fails, we can't link it in analysis_sessions
                // Return error or proceed?
                // Let's return error to debug
                return NextResponse.json({ error: 'Failed to create trade record: ' + tradeError.message }, { status: 500 });
            }
        }

        // 3. Mark session as executed
        // Only if trade was created successfully (or if we decide to ignore FK)
        // Since we have FK, we must have created the trade.
        if (pairData) {
            await LearningLogger.markExecuted({ sessionId, tradeId });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking execution:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
