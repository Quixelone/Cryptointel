'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, Download } from 'lucide-react'
import { LearningLogger } from '@/lib/learning/logger'

export default function LearningPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            setLoading(true)
            try {
                // Get learning statistics from Supabase
                const learningStats = await LearningLogger.getStats('user-1')
                setStats(learningStats)
            } catch (error) {
                console.error('Failed to load stats:', error)
            } finally {
                setLoading(false)
            }
        }

        loadStats()
    }, [])

    const handleExportData = async () => {
        try {
            const trainingData = await LearningLogger.exportTrainingData('user-1')
            const blob = new Blob([JSON.stringify(trainingData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `training-data-${new Date().toISOString()}.json`
            a.click()
        } catch (error) {
            console.error('Failed to export data:', error)
            alert('Failed to export training data. Check console for details.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading learning data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Learning Insights</h1>
                <p className="text-muted-foreground mt-2">
                    AI model performance tracking and continuous improvement
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Analyses</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.totalAnalyses}</div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm text-muted-foreground">Win Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-500">
                        {(stats.winRate * 100).toFixed(1)}%
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="text-sm text-muted-foreground mb-2">Executed Trades</div>
                    <div className="text-3xl font-bold text-foreground">{stats.executed}</div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="text-sm text-muted-foreground mb-2">Best Model</div>
                    <div className="text-lg font-bold text-primary">{stats.bestPerformingModel}</div>
                </div>
            </div>

            {/* Confidence Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Confidence Calibration</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Avg Confidence When Win</span>
                                <span className="font-mono text-emerald-500">
                                    {(stats.avgConfidenceWhenWin * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${stats.avgConfidenceWhenWin * 100}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Avg Confidence When Loss</span>
                                <span className="font-mono text-red-500">
                                    {(stats.avgConfidenceWhenLoss * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500"
                                    style={{ width: `${stats.avgConfidenceWhenLoss * 100}%` }}
                                />
                            </div>
                        </div>

                        {stats.avgConfidenceWhenLoss > stats.avgConfidenceWhenWin && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-4">
                                <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-yellow-200 font-medium">Overconfidence Detected</p>
                                        <p className="text-xs text-yellow-300/70 mt-1">
                                            AI models show higher confidence on losing trades. Consider adjusting thresholds.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Training Data</h3>
                        <button
                            onClick={handleExportData}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                            <div className="text-sm text-muted-foreground mb-1">Data Points</div>
                            <div className="text-2xl font-bold text-foreground">{stats.executed}</div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Complete analysis sessions with verified outcomes
                            </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <p className="mb-2">Training data includes:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Market context (technicals, macro, news)</li>
                                <li>AI predictions and confidence</li>
                                <li>Actual trade outcomes</li>
                                <li>Timestamps for temporal analysis</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights Section */}
            <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">📚 Knowledge Base</h3>
                <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                            <div>
                                <p className="text-sm font-medium text-emerald-200">Learning Active</p>
                                <p className="text-xs text-emerald-300/70 mt-1">
                                    System is collecting data from every analysis and trade outcome. After 30+ completed trades,
                                    position sizing will switch to Kelly Criterion for optimal results.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                            <div>
                                <p className="text-sm font-medium text-blue-200">Pattern Recognition</p>
                                <p className="text-xs text-blue-300/70 mt-1">
                                    System automatically identifies market conditions that lead to wins/losses and
                                    adjusts risk parameters accordingly.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground italic p-4 bg-muted/20 rounded-lg">
                        💡 <strong>Next Steps:</strong> Connect to Supabase to persist learning data across sessions.
                        Export training data can be used to fine-tune AI models with your specific trading context.
                    </div>
                </div>
            </div>
        </div>
    )
}
