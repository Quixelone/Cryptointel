'use client'

import { useState, useEffect } from 'react'
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel'
import { RiskChecklist } from '@/components/trading/RiskChecklist'
import { TradingSignal, Trade } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { XCircle } from 'lucide-react'
import { checkPositions } from '@/lib/trading/positions'
import { calculateOptimalSize } from '@/lib/trading/positionSizing'
import { TechnicalIndicatorsCard } from '@/components/analytics/TechnicalIndicatorsCard'
import { MacroEnvironmentCard } from '@/components/analytics/MacroEnvironmentCard'
import { NewsSentimentCard } from '@/components/analytics/NewsSentimentCard'

const PAIRS = ['BTC/EUR', 'ETH/EUR', 'SOL/EUR', 'LINK/EUR', 'ARB/EUR']

export default function TradingPage() {
    const [selectedPair, setSelectedPair] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [signal, setSignal] = useState<TradingSignal | null>(null)
    const [riskChecks, setRiskChecks] = useState<any[]>([])
    const [canTrade, setCanTrade] = useState(false)
    const [isAutoTrading, setIsAutoTrading] = useState(false)

    // Paper Trading State
    const [balance, setBalance] = useState(12450.00)
    const [positions, setPositions] = useState<Trade[]>([])
    const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
    const [tradingStats, setTradingStats] = useState({ wins: 0, losses: 0, totalTrades: 0 })

    // Real-time price updater
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch('/api/prices')
                const data = await response.json()

                const priceMap: Record<string, number> = {}
                Object.entries(data).forEach(([symbol, info]: [string, any]) => {
                    priceMap[symbol] = info.price
                })
                setCurrentPrices(priceMap)
            } catch (error) {
                console.error('Failed to fetch prices:', error)
            }
        }

        fetchPrices()
        const interval = setInterval(fetchPrices, 5000) // Update every 5s
        return () => clearInterval(interval)
    }, [])

    // Position monitoring and auto-close
    useEffect(() => {
        if (positions.length === 0 || Object.keys(currentPrices).length === 0) return

        const updates = checkPositions(positions, currentPrices)

        updates.forEach(update => {
            if (update.shouldClose) {
                const position = positions.find(p => p.id === update.id)
                if (position) {
                    console.log(`🔔 Auto-closing ${position.symbol} ${position.direction} - ${update.closeReason}: ${update.pnlPercent.toFixed(2)}%`)

                    const returnAmount = position.position_value + update.pnl
                    setBalance(prev => prev + returnAmount)
                    setPositions(prev => prev.filter(p => p.id !== update.id))

                    // Update stats
                    setTradingStats(prev => ({
                        totalTrades: prev.totalTrades + 1,
                        wins: update.pnl > 0 ? prev.wins + 1 : prev.wins,
                        losses: update.pnl < 0 ? prev.losses + 1 : prev.losses
                    }))

                    // Notify learning system of outcome
                    if (position.sessionId) {
                        const outcome = update.pnl > 0 ? 'WIN' : update.pnl < 0 ? 'LOSS' : 'BREAK_EVEN'
                        fetch('/api/learning/outcome', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                sessionId: position.sessionId,
                                outcome,
                                pnl: update.pnl,
                                pnlPercent: update.pnlPercent,
                                closeReason: update.closeReason
                            })
                        }).catch(err => console.error('Failed to log outcome:', err))
                    }
                }
            }
        })
    }, [currentPrices, positions])

    const getMarketData = (symbol: string) => {
        const price = currentPrices[symbol] || 0
        return {
            price,
            change24h: 2.5,
            volume: 1500000
        }
    }

    const handleAnalyze = async (pair: string) => {
        setSelectedPair(pair)
        setIsAnalyzing(true)
        setSignal(null)
        setRiskChecks([])

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500))

            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: pair,
                    marketData: getMarketData(pair),
                    userId: 'user-1' // Pass user ID for learning system
                })
            })

            const data = await response.json()
            setSignal(data)

            // Mock Risk Check
            const checks = [
                { name: 'AI Confidence', pass: data.confidence > 0.7, detail: `Score: ${(data.confidence * 100).toFixed(0)}%` },
                { name: 'Market Trend', pass: true, detail: 'Aligned with 4h trend' },
                { name: 'Daily Loss Limit', pass: true, detail: 'Below 5% max loss' }
            ]
            setRiskChecks(checks)
            setCanTrade(checks.every(c => c.pass))

        } catch (error) {
            console.error('Analysis failed', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleExecuteTrade = () => {
        if (!signal || !selectedPair) return

        // Risk Management Checks
        if (positions.length >= 3) {
            if (!isAutoTrading) alert('Max positions reached (3)')
            setSignal(null)
            return
        }

        if (positions.some(p => p.symbol === selectedPair)) {
            if (!isAutoTrading) alert('Position already open for this pair')
            setSignal(null)
            return
        }

        // Dynamic position sizing
        const historicalStats = tradingStats.totalTrades >= 5 ? {
            winRate: tradingStats.wins / tradingStats.totalTrades,
            avgWin: 3.5,
            avgLoss: 2.0,
            totalTrades: tradingStats.totalTrades
        } : undefined

        const sizing = calculateOptimalSize(balance, signal.confidence, historicalStats)
        const tradeSize = Math.min(sizing.size, 2000) // Cap at 2000 EUR

        console.log(`📊 Position Sizing: €${tradeSize.toFixed(2)} using ${sizing.method} - ${sizing.reasoning}`)

        if (balance < tradeSize) {
            if (isAutoTrading) setIsAutoTrading(false)
            alert('Insufficient balance')
            return
        }

        const newTrade: Trade = {
            id: crypto.randomUUID(),
            user_id: 'user-1',
            symbol: selectedPair,
            direction: signal.direction || 'LONG',
            status: 'OPEN',
            entry_price: signal.entryPrice,
            stop_loss: signal.stopLoss,
            take_profit: signal.takeProfit,
            quantity: tradeSize / signal.entryPrice,
            position_value: tradeSize,
            pnl: 0,
            pnl_percent: 0,
            fees: tradeSize * 0.001,
            entry_time: new Date().toISOString(),
            ai_confidence: signal.confidence,
            signal_strength: signal.strength,
            sessionId: signal.sessionId // Link trade to analysis session
        }

        // Notify learning system of execution
        if (signal.sessionId) {
            fetch('/api/learning/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: signal.sessionId,
                    tradeId: newTrade.id,
                    tradeDetails: newTrade
                })
            }).catch(err => console.error('Failed to log execution:', err))
        }

        setBalance(prev => prev - tradeSize)
        setPositions(prev => [newTrade, ...prev])
        setSignal(null)
        setCanTrade(false)
    }

    // Auto-Trading Logic: Scanning
    useEffect(() => {
        if (isAutoTrading && !isAnalyzing && !signal) {
            // Don't scan if max positions reached
            if (positions.length >= 3) return

            const timer = setTimeout(() => {
                const currentIndex = PAIRS.indexOf(selectedPair || '')
                const nextIndex = (currentIndex + 1) % PAIRS.length
                handleAnalyze(PAIRS[nextIndex])
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isAutoTrading, isAnalyzing, signal, selectedPair, positions.length])

    // Auto-Trading Logic: Execution
    useEffect(() => {
        if (isAutoTrading && canTrade && signal && !isAnalyzing) {
            const timer = setTimeout(() => {
                handleExecuteTrade()
            }, 2000)
            return () => clearTimeout(timer)
        } else if (isAutoTrading && signal && !canTrade && !isAnalyzing) {
            const timer = setTimeout(() => {
                setSignal(null)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [isAutoTrading, canTrade, signal, isAnalyzing])

    const handleClosePosition = (tradeId: string) => {
        const trade = positions.find(p => p.id === tradeId)
        if (!trade) return

        const randomPnLPercent = (Math.random() * 0.15) - 0.05
        const pnl = trade.position_value * randomPnLPercent
        const returnAmount = trade.position_value + pnl

        setBalance(prev => prev + returnAmount)
        setPositions(prev => prev.filter(p => p.id !== tradeId))

        // Notify learning system of outcome
        if (trade.sessionId) {
            const outcome = pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BREAK_EVEN'
            fetch('/api/learning/outcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: trade.sessionId,
                    outcome,
                    pnl,
                    pnlPercent: randomPnLPercent * 100,
                    closeReason: 'MANUAL'
                })
            }).catch(err => console.error('Failed to log outcome:', err))
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 h-[calc(100vh-8rem)]">
            {/* Left Column: Market & Config */}
            <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Market Selector</h3>
                        <button
                            onClick={() => setIsAutoTrading(!isAutoTrading)}
                            className={`text-xs px-2 py-1 rounded-full border transition-all ${isAutoTrading
                                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50 animate-pulse'
                                : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                                }`}
                        >
                            {isAutoTrading ? '● AUTO ON' : '○ AUTO OFF'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {PAIRS.map(pair => (
                            <button
                                key={pair}
                                onClick={() => handleAnalyze(pair)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedPair === pair
                                    ? 'bg-primary/20 text-primary border border-primary/50'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {pair}
                            </button>
                        ))}
                    </div>
                </div>

                {signal && (
                    <RiskChecklist checks={riskChecks} canTrade={canTrade} />
                )}
            </div>

            {/* Center Column: Chart & AI Analysis */}
            <div className="lg:col-span-6 space-y-6 overflow-y-auto px-2">
                <div className="rounded-xl border border-border bg-card p-6 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 z-10" />
                    {/* Placeholder for Chart */}
                    <div className="text-center z-20">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {selectedPair || 'Select a Pair'}
                        </h3>
                        <p className="text-muted-foreground">Live Chart Integration Coming Soon</p>
                    </div>
                </div>

                <AIAnalysisPanel
                    analyses={signal?.analyses || []}
                    isAnalyzing={isAnalyzing}
                />
            </div>

            {/* Right Column: Execution & Positions */}
            <div className="lg:col-span-3 space-y-6 overflow-y-auto pl-2">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-4 text-foreground">Execute Trade</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Balance</span>
                            <span className="text-foreground font-mono">{formatCurrency(balance)}</span>
                        </div>

                        {signal && (
                            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span>Entry</span>
                                    <span className="font-mono">{formatCurrency(signal.entryPrice)}</span>
                                </div>
                                <div className="flex justify-between text-red-400">
                                    <span>Stop Loss</span>
                                    <span className="font-mono">{formatCurrency(signal.stopLoss)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-400">
                                    <span>Take Profit</span>
                                    <span className="font-mono">{formatCurrency(signal.takeProfit)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleExecuteTrade}
                            disabled={!canTrade || !signal}
                            className={`w-full font-bold py-3 rounded-lg transition-all shadow-lg ${canTrade && signal?.direction === 'LONG'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                : canTrade && signal?.direction === 'SHORT'
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                        >
                            {signal?.direction ? `${signal.direction} ${selectedPair}` : 'WAITING FOR SIGNAL'}
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold mb-4 text-foreground">Open Positions</h3>
                    <div className="space-y-3">
                        {positions.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                No open positions
                            </div>
                        ) : (
                            positions.map(position => (
                                <div key={position.id} className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${position.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                                                }`}>
                                                {position.direction}
                                            </span>
                                            <span className="text-sm font-medium">{position.symbol}</span>
                                        </div>
                                        <button
                                            onClick={() => handleClosePosition(position.id)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Entry: {formatCurrency(position.entry_price)}</span>
                                        <span>Value: {formatCurrency(position.position_value)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
