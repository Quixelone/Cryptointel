import { NextResponse } from 'next/server'
import { LearningLogger } from '@/lib/learning/logger'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sessionId, outcome, pnl, pnlPercent, closeReason } = body;

        if (!sessionId || !outcome) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        // 1. Get trade_id from analysis_sessions
        const { data: session } = await supabase
            .from('analysis_sessions')
            .select('trade_id')
            .eq('id', sessionId)
            .single();

        if (session?.trade_id) {
            // 2. Update trade to CLOSED
            const { error: tradeError } = await supabase
                .from('trades')
                .update({
                    status: 'CLOSED',
                    pnl: pnl,
                    pnl_percent: pnlPercent,
                    exit_time: new Date().toISOString(),
                    close_reason: closeReason || 'MANUAL'
                })
                .eq('id', session.trade_id);

            if (tradeError) {
                console.error('Failed to close trade:', tradeError);
            }
        }

        await LearningLogger.recordOutcome({ sessionId, outcome, pnl, pnlPercent });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error recording outcome:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
