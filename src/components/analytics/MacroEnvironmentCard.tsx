'use client'

import { useEffect, useState } from 'react'
import { Globe, AlertTriangle, TrendingUp } from 'lucide-react'

interface MacroIndicator {
    label: string
    value: string
    impact: 'positive' | 'negative' | 'neutral'
    icon?: React.ReactNode
}

export function MacroEnvironmentCard() {
    const [macro, setMacro] = useState<MacroIndicator[]>([])
    const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')

    useEffect(() => {
        // Mock macro data
        setMacro([
            { label: 'US Interest Rate', value: '5.50%', impact: 'negative' },
            { label: 'EUR Interest Rate', value: '4.25%', impact: 'neutral' },
            { label: 'Japan Rate', value: '0.15%', impact: 'negative' },
            { label: 'USD Index (DXY)', value: '104.2', impact: 'negative' },
            { label: 'VIX (Fear)', value: '18.5', impact: 'neutral' },
            { label: 'Global Liquidity', value: 'Neutral', impact: 'neutral' }
        ])
        setRiskLevel('MEDIUM')
    }, [])

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Macro Environment</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${riskLevel === 'LOW' ? 'bg-emerald-500/20 text-emerald-500' :
                        riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                    }`}>
                    {riskLevel} RISK
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {macro.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            {item.impact === 'negative' && <AlertTriangle className="h-3 w-3 text-red-400" />}
                            {item.impact === 'positive' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                        </div>
                        <div className="text-sm font-mono font-bold text-foreground">{item.value}</div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                        <p className="text-xs text-yellow-200 font-medium">Carry Trade Risk</p>
                        <p className="text-xs text-yellow-300/70 mt-1">US-Japan rate differential at 5.35% - Monitor for unwinding</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
