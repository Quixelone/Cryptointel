import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Percent, TrendingUp } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const stats = [
    {
        name: 'Total Balance',
        value: 12450.00,
        change: 12.5,
        icon: DollarSign,
        trend: 'up',
    },
    {
        name: 'Total Equity',
        value: 12890.50,
        change: 8.2,
        icon: Activity,
        trend: 'up',
    },
    {
        name: 'Win Rate',
        value: 68, // percent
        change: -2.1,
        icon: Percent,
        trend: 'down',
        isPercent: true,
    },
    {
        name: 'Active Trades',
        value: 3,
        change: 0,
        icon: TrendingUp,
        trend: 'neutral',
        isCount: true,
    },
]

export function StatsCards() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.name}
                    className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <stat.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className={cn(
                            "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                            stat.trend === 'up' ? "text-emerald-500 bg-emerald-500/10" :
                                stat.trend === 'down' ? "text-red-500 bg-red-500/10" : "text-muted-foreground bg-muted"
                        )}>
                            {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> :
                                stat.trend === 'down' ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                            {Math.abs(stat.change)}%
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                            {stat.isPercent ? `${stat.value}%` :
                                stat.isCount ? stat.value :
                                    formatCurrency(stat.value)}
                        </h3>
                    </div>
                    {/* Decorative gradient */}
                    <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
                </div>
            ))}
        </div>
    )
}
