import { AIAnalysis } from '@/types';
import { cn } from '@/lib/utils';
import { Brain, Cpu, Sparkles, Zap } from 'lucide-react';

interface AIAnalysisPanelProps {
    analyses: AIAnalysis[];
    isAnalyzing: boolean;
}

const modelIcons = {
    claude: Brain,
    gpt4: Zap,
    gemini: Sparkles,
    mistral: Cpu
};

export function AIAnalysisPanel({ analyses, isAnalyzing }: AIAnalysisPanelProps) {
    if (isAnalyzing) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 min-h-[200px] flex flex-col items-center justify-center space-y-4">
                <div className="relative flex h-12 w-12">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-12 w-12 bg-primary/20 items-center justify-center">
                        <Brain className="h-6 w-6 text-primary animate-pulse" />
                    </span>
                </div>
                <p className="text-muted-foreground animate-pulse">Orchestrating AI Analysis...</p>
            </div>
        );
    }

    if (analyses.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Select a pair to start AI analysis</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4 text-foreground flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                AI Consensus Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyses.map((analysis) => {
                    const Icon = modelIcons[analysis.model as keyof typeof modelIcons] || Brain;
                    const isBullish = analysis.sentiment > 50;

                    return (
                        <div key={analysis.model} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm text-foreground capitalize">{analysis.model}</span>
                                </div>
                                <div className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                    isBullish ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {isBullish ? 'BULLISH' : 'BEARISH'} ({analysis.sentiment}%)
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {analysis.reasoning}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Conf: {(analysis.confidence * 100).toFixed(0)}%</span>
                                <span>{analysis.responseTimeMs}ms</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
