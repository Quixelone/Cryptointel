'use client'

import { useEffect, useState } from 'react'
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface NewsItem {
    topic: string
    sentiment: 'positive' | 'negative' | 'neutral'
}

export function NewsSentimentCard({ symbol }: { symbol: string }) {
    const [sentiment, setSentiment] = useState(0)
    const [topics, setTopics] = useState<NewsItem[]>([])
    const [sources, setSources] = useState(0)

    useEffect(() => {
        // Mock news sentiment
        setSentiment(35) // 0-100
        setTopics([
            { topic: 'Institutional adoption', sentiment: 'positive' },
            { topic: 'Regulatory concerns', sentiment: 'negative' },
            { topic: 'Market volatility', sentiment: 'neutral' },
            { topic: 'Technical analysis', sentiment: 'positive' }
        ])
        setSources(42)
    }, [symbol])

    const sentimentColor = sentiment > 60 ? 'emerald' : sentiment < 40 ? 'red' : 'yellow'

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center space-x-2 mb-4">
                <Newspaper className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">News Sentiment</h3>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Sentiment</span>
                    <span className={`text-lg font-bold text-${sentimentColor}-500`}>
                        {sentiment > 50 ? '+' : ''}{sentiment - 50}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-${sentimentColor}-500 transition-all`}
                        style={{ width: `${sentiment}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Bearish</span>
                    <span>Bullish</span>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground">Key Topics ({sources} sources)</p>
                {topics.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="text-xs text-foreground">{item.topic}</span>
                        {item.sentiment === 'positive' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                        {item.sentiment === 'negative' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        {item.sentiment === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground italic">
                {sentiment > 60
                    ? 'Positive sentiment driven by institutional adoption and technical setup.'
                    : sentiment < 40
                        ? 'Cautious sentiment due to regulatory concerns and market volatility.'
                        : 'Mixed sentiment. Market awaiting catalysts.'}
            </p>
        </div>
    )
}
