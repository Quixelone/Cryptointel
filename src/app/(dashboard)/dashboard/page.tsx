import { StatsCards } from '@/components/dashboard/StatsCards'
import { EquityChart } from '@/components/dashboard/EquityChart'
import { PricesTicker } from '@/components/dashboard/PricesTicker'
import { ActivityLog } from '@/components/dashboard/ActivityLog'

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
            </div>

            <StatsCards />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <EquityChart />
                </div>
                <div>
                    <PricesTicker />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ActivityLog />
                <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center text-muted-foreground min-h-[300px]">
                    Open Positions (Coming Soon)
                </div>
            </div>
        </div>
    )
}
