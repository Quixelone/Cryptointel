import { NextResponse } from 'next/server'
import { orchestrateAnalysis } from '@/lib/ai/orchestrator'
import { LearningLogger } from '@/lib/learning/logger'

export async function POST(req: Request) {
    console.log('🚀 POST /api/ai/analyze called');
    try {
        const body = await req.json();
        console.log('📦 Request body:', JSON.stringify(body, null, 2));

        // Validate request body
        if (!body || typeof body !== 'object') {
            console.log('❌ Invalid request body');
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { symbol, marketData } = body;

        // Validate symbol
        if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
            return NextResponse.json(
                { error: 'Invalid or missing symbol. Must be a non-empty string.' },
                { status: 400 }
            );
        }

        // Validate marketData
        if (!marketData || typeof marketData !== 'object') {
            return NextResponse.json(
                { error: 'Invalid or missing marketData. Must be an object.' },
                { status: 400 }
            );
        }

        // Validate price in marketData
        if (typeof marketData.price !== 'number' || marketData.price <= 0 || !isFinite(marketData.price)) {
            return NextResponse.json(
                { error: 'Invalid price in marketData. Must be a positive finite number.' },
                { status: 400 }
            );
        }

        console.log('🔍 Starting orchestrateAnalysis for:', symbol.trim());
        const result = await orchestrateAnalysis(symbol.trim(), marketData);
        console.log('✅ orchestrateAnalysis completed');

        // Log analysis for learning system
        let sessionId = '';
        try {
            console.log('📚 Attempting to log analysis to Supabase...');
            // Use userId from body or default to 'user-1' for now (prototype phase)
            const userId = (body.userId as string) || 'user-1';

            sessionId = await LearningLogger.logAnalysis({
                userId,
                symbol: result.signal.symbol,
                price: result.signal.entryPrice,
                marketContext: result.marketContext,
                marketReport: result.marketReport,
                signal: result.signal,
                wasExecuted: false // Initially false, updated if trade is taken
            });
            console.log('✅ Analysis logged with sessionId:', sessionId);
        } catch (logError) {
            console.error('❌ Failed to log analysis:', logError);
            // Don't fail the request if logging fails
        }

        console.log('📤 Returning response');
        return NextResponse.json({
            ...result.signal,
            sessionId // Return session ID so frontend can link execution later
        });
    } catch (error) {
        console.error('Analysis error:', error);

        // Return more specific error messages
        if (error instanceof Error) {
            // Don't expose internal errors in production, but helpful for development
            return NextResponse.json(
                { error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
