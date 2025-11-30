'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

interface TechnicalIndicator {
    name: string
    value: string
    status: 'bullish' | 'bearish' | 'neutral'
    description: string
}

export function TechnicalIndicatorsCard({ symbol }: { symbol: string }) {
    const [indicators, setIndicators] = useState<TechnicalIndicator[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock technical indicators
        // In production, fetch from API
        setIndicators([
            { name: 'RSI(14)', value: '52.3', status: 'neutral', description: 'Neutral zone' },
            { name: 'MACD', value: '+0.45', status: 'bullish', description: 'Positive momentum' },
            { name: 'EMA 50/200', value: 'Golden', status: 'bullish', description: 'EMA50 > EMA200' },
            { name: 'BB Position', value: '65%', status: 'neutral', description: 'Mid-range' }
        ])
        setLoading(false)
    }, [symbol])

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="h-6 bg-muted rounded mb-4 w-1/3"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-muted rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Technical Indicators</h3>
            </div>
            <div className="space-y-3">
                {indicators.map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-foreground">{indicator.name}</span>
                                {indicator.status === 'bullish' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                                {indicator.status === 'bearish' && <TrendingDown className="h-4 w-4 text-red-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{indicator.description}</p>
                        </div>
                        <div className={`text-lg font-bold font-mono ${indicator.status === 'bullish' ? 'text-emerald-500' :
                                indicator.status === 'bearish' ? 'text-red-500' :
                                    'text-muted-foreground'
                            }`}>
                            {indicator.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
