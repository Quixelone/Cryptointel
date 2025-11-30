import { NextResponse } from 'next/server'
import { fetchRealTimePrices } from '@/lib/api/coingecko'

export async function GET() {
    try {
        const symbols = ['BTC', 'ETH', 'SOL', 'LINK', 'ARB'];
        const prices = await fetchRealTimePrices(symbols);

        return NextResponse.json(prices);
    } catch (error) {
        console.error('Price API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prices' },
            { status: 500 }
        );
    }
}
