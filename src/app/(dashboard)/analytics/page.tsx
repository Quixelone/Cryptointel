'use client'

import { TechnicalIndicatorsCard } from '@/components/analytics/TechnicalIndicatorsCard'
import { MacroEnvironmentCard } from '@/components/analytics/MacroEnvironmentCard'
import { NewsSentimentCard } from '@/components/analytics/NewsSentimentCard'
import { useState } from 'react'

const PAIRS = ['BTC/EUR', 'ETH/EUR', 'SOL/EUR', 'LINK/EUR', 'ARB/EUR']

export default function AnalyticsPage() {
    const [selectedPair, setSelectedPair] = useState('BTC/EUR')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Market Analytics</h1>
                <p className="text-muted-foreground mt-2">
                    Comprehensive market analysis with technical indicators, macroeconomics, and news sentiment
                </p>
            </div>

            {/* Pair Selector */}
            <div className="flex space-x-2">
                {PAIRS.map(pair => (
                    <button
                        key={pair}
                        onClick={() => setSelectedPair(pair)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPair === pair
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {pair}
                    </button>
                ))}
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TechnicalIndicatorsCard symbol={selectedPair} />
                <NewsSentimentCard symbol={selectedPair} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <MacroEnvironmentCard />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
                    <div className="text-2xl font-bold text-foreground">€4.2B</div>
                    <div className="text-xs text-emerald-500 mt-1">+12.5%</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
                    <div className="text-2xl font-bold text-foreground">€1.5T</div>
                    <div className="text-xs text-red-500 mt-1">-2.1%</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="text-sm text-muted-foreground mb-1">Dominance</div>
                    <div className="text-2xl font-bold text-foreground">52.3%</div>
                    <div className="text-xs text-muted-foreground mt-1">BTC</div>
                </div>
            </div>
        </div>
    )
}
