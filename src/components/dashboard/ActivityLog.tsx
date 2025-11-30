'use client'

import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const logs = [
    { id: 1, type: 'TRADE', message: 'Opened LONG BTC/EUR @ 38,450', time: '2 mins ago', status: 'success' },
    { id: 2, type: 'AI', message: 'Claude analysis completed for ETH', time: '5 mins ago', status: 'info' },
    { id: 3, type: 'SIGNAL', message: 'New STRONG BUY signal for SOL', time: '12 mins ago', status: 'success' },
    { id: 4, type: 'SYSTEM', message: 'Risk check failed for LINK trade', time: '1 hour ago', status: 'error' },
]

export function ActivityLog() {
    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Activity Log</h3>
            <div className="space-y-6">
                {logs.map((log) => (
                    <div key={log.id} className="flex space-x-3">
                        <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-8 ring-card",
                            log.status === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                                log.status === 'error' ? "bg-red-500/10 text-red-500" :
                                    "bg-blue-500/10 text-blue-500"
                        )}>
                            {log.status === 'success' ? <CheckCircle className="h-4 w-4" /> :
                                log.status === 'error' ? <XCircle className="h-4 w-4" /> :
                                    <Activity className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">{log.type}</p>
                                <p className="text-xs text-muted-foreground">{log.time}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
