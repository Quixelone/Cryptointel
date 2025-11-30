'use client'

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const data = [
    { date: 'Nov 01', equity: 10000 },
    { date: 'Nov 05', equity: 10500 },
    { date: 'Nov 10', equity: 10200 },
    { date: 'Nov 15', equity: 11000 },
    { date: 'Nov 20', equity: 11500 },
    { date: 'Nov 25', equity: 12400 },
    { date: 'Nov 28', equity: 12890 },
]

export function EquityChart() {
    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Equity Curve</h3>
                    <p className="text-sm text-muted-foreground">Performance over last 30 days</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="flex items-center text-sm text-emerald-500 font-medium">
                        +28.9%
                    </span>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                            itemStyle={{ color: '#00d4ff' }}
                            formatter={(value: number) => [formatCurrency(value), 'Equity']}
                        />
                        <Area
                            type="monotone"
                            dataKey="equity"
                            stroke="#00d4ff"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorEquity)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
