/**
 * CoinGecko API Integration
 * Free tier: 10-50 calls/minute
 * Docs: https://www.coingecko.com/en/api/documentation
 */

interface CoinGeckoPrice {
    [key: string]: {
        eur: number;
        eur_24h_change: number;
        eur_24h_vol: number;
        eur_market_cap: number;
        last_updated_at: number;
    };
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const SYMBOL_MAP: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'LINK': 'chainlink',
    'ARB': 'arbitrum'
};

export async function fetchRealTimePrices(symbols: string[]): Promise<Record<string, any>> {
    const coinIds = symbols.map(s => SYMBOL_MAP[s] || s.toLowerCase()).join(',');

    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const response = await fetch(
                `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=eur&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
                {
                    headers: {
                        'Accept': 'application/json'
                    },
                    signal: controller.signal,
                    next: { revalidate: 60 } // Cache for 60 seconds
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }

            const data: CoinGeckoPrice = await response.json();

        // Transform to our format
        const prices: Record<string, any> = {};
        symbols.forEach(symbol => {
            const coinId = SYMBOL_MAP[symbol] || symbol.toLowerCase();
            const coinData = data[coinId];

            if (coinData) {
                prices[`${symbol}/EUR`] = {
                    price: coinData.eur,
                    change24h: coinData.eur_24h_change,
                    volume: coinData.eur_24h_vol,
                    marketCap: coinData.eur_market_cap,
                    lastUpdated: new Date(coinData.last_updated_at * 1000).toISOString()
                };
            }
        });

            return prices;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('CoinGecko API request timeout');
                throw new Error('Request to CoinGecko API timed out');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('Failed to fetch CoinGecko prices:', error);
        // Return mock data as fallback
        return getFallbackPrices(symbols);
    }
}

export async function fetchHistoricalData(
    symbol: string,
    days: number = 30
): Promise<Array<{ timestamp: number; price: number }>> {
    const coinId = SYMBOL_MAP[symbol] || symbol.toLowerCase();

    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for historical data

        try {
            const response = await fetch(
                `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=eur&days=${days}&interval=daily`,
                {
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }

            const data = await response.json();

            return data.prices.map(([timestamp, price]: [number, number]) => ({
                timestamp,
                price
            }));
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                console.error('CoinGecko historical data request timeout');
                throw new Error('Request to CoinGecko API timed out');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('Failed to fetch historical data:', error);
        return [];
    }
}

function getFallbackPrices(symbols: string[]): Record<string, any> {
    const fallbackPrices: Record<string, number> = {
        'BTC': 78235.50,
        'ETH': 2625.80,
        'SOL': 118.60,
        'LINK': 11.45,
        'ARB': 0.19
    };

    const prices: Record<string, any> = {};
    symbols.forEach(symbol => {
        prices[`${symbol}/EUR`] = {
            price: fallbackPrices[symbol] || 100,
            change24h: (Math.random() - 0.5) * 10,
            volume: 1000000 + Math.random() * 5000000,
            marketCap: 100000000,
            lastUpdated: new Date().toISOString()
        };
    });

    return prices;
}
