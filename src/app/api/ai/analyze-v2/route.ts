import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    console.log('========================================');
    console.log('ANALYZE V2 ENDPOINT CALLED');
    console.log('========================================');

    try {
        const body = await req.json();
        console.log('Body received:', body);

        // Return a mock signal for now to test if the endpoint works
        return NextResponse.json({
            symbol: body.symbol || 'BTC/EUR',
            strength: 'BUY',
            direction: 'LONG',
            sentiment: 65,
            confidence: 0.75,
            consensus: 0.75,
            entryPrice: body.marketData?.price || 50000,
            stopLoss: (body.marketData?.price || 50000) * 0.97,
            takeProfit: (body.marketData?.price || 50000) * 1.05,
            reasoning: 'Test signal - endpoint is working!',
            analyses: [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('ERROR in analyze-v2:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
