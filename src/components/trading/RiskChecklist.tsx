import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskCheck {
    name: string;
    pass: boolean;
    detail: string;
}

interface RiskChecklistProps {
    checks: RiskCheck[];
    canTrade: boolean;
}

export function RiskChecklist({ checks, canTrade }: RiskChecklistProps) {
    if (checks.length === 0) return null;

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold mb-4 text-foreground flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5 text-emerald-500" />
                Risk Management
            </h3>
            <div className="space-y-3">
                {checks.map((check, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                        {check.pass ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-foreground">{check.name}</p>
                            <p className="text-xs text-muted-foreground">{check.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className={cn(
                "mt-4 p-3 rounded-lg text-center font-bold text-sm",
                canTrade ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
            )}>
                {canTrade ? 'TRADE APPROVED' : 'TRADE BLOCKED'}
            </div>
        </div>
    );
}
