'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const prices = [
    { symbol: 'BTC', price: 78235.50, change: 2.4 },
    { symbol: 'ETH', price: 2625.80, change: 1.1 },
    { symbol: 'SOL', price: 118.60, change: 5.2 },
    { symbol: 'LINK', price: 11.45, change: -0.8 },
    { symbol: 'ARB', price: 0.19, change: -3.2 },
]

export function PricesTicker() {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Market Overview</h3>
            <div className="space-y-4">
                {prices.map((coin) => (
                    <div key={coin.symbol} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                                {coin.symbol[0]}
                            </div>
                            <span className="font-bold text-foreground">{coin.symbol}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-foreground">{formatCurrency(coin.price)}</div>
                            <div className={cn(
                                "flex items-center justify-end text-xs font-medium",
                                coin.change >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                {coin.change >= 0 ? "+" : ""}{coin.change}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
