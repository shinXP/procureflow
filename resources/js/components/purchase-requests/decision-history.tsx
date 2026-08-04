import {
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    History,
    XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type {
    PurchaseRequestDecision,
    PurchaseRequestDecisionType,
} from '@/types';

const decisionConfig: Record<
    PurchaseRequestDecisionType,
    {
        label: string;
        icon: typeof CheckCircle2;
        iconClasses: string;
        cardClasses: string;
    }
> = {
    approved: {
        label: 'Approved',
        icon: CheckCircle2,
        iconClasses: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        cardClasses:
            'border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-400/15',
    },
    rejected: {
        label: 'Rejected',
        icon: XCircle,
        iconClasses: 'bg-red-500/10 text-red-700 dark:text-red-300',
        cardClasses: 'border-red-500/20 bg-red-500/5 dark:border-red-400/15',
    },
};

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function DecisionCard({
    decision,
    latest = false,
}: {
    decision: PurchaseRequestDecision;
    latest?: boolean;
}) {
    const getInitials = useInitials();
    const config = decisionConfig[decision.decision];
    const DecisionIcon = config.icon;

    return (
        <article className={cn('rounded-2xl border p-4', config.cardClasses)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span
                        className={cn(
                            'mt-0.5 rounded-xl p-2',
                            config.iconClasses,
                        )}
                    >
                        <DecisionIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{config.label}</p>
                            {latest && (
                                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                                    Latest decision
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex min-w-0 items-center gap-2">
                            <Avatar className="size-7 border border-background shadow-sm">
                                <AvatarImage
                                    src={decision.reviewer.avatar ?? undefined}
                                    alt=""
                                />
                                <AvatarFallback className="text-[10px] font-semibold">
                                    {getInitials(decision.reviewer.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {decision.reviewer.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {decision.reviewer.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {formatDateTime(decision.decided_at)}
                </p>
            </div>

            {decision.remarks ? (
                <div className="mt-3 rounded-xl border border-black/5 bg-background/70 px-3 py-2.5 dark:border-white/5">
                    <p className="text-xs font-medium text-muted-foreground">
                        Decision remarks
                    </p>
                    <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
                        {decision.remarks}
                    </p>
                </div>
            ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                    No remarks were added.
                </p>
            )}
        </article>
    );
}

export function PurchaseRequestDecisionHistory({
    decisions,
    className,
}: {
    decisions: PurchaseRequestDecision[];
    className?: string;
}) {
    if (decisions.length === 0) {
        return null;
    }

    const [latestDecision, ...earlierDecisions] = decisions;

    return (
        <section
            className={cn('grid gap-3', className)}
            aria-label="Decision history"
        >
            <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                    <History className="size-4 text-muted-foreground" />
                    Decision history
                </p>
                <span className="text-xs text-muted-foreground">
                    {decisions.length}{' '}
                    {decisions.length === 1 ? 'decision' : 'decisions'}
                </span>
            </div>

            <DecisionCard decision={latestDecision} latest />

            {earlierDecisions.length > 0 && (
                <details className="group rounded-2xl border bg-muted/20">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:hidden">
                        Show {earlierDecisions.length} earlier{' '}
                        {earlierDecisions.length === 1
                            ? 'decision'
                            : 'decisions'}
                        <ChevronDown className="size-4 transition group-open:rotate-180" />
                    </summary>
                    <div className="grid gap-3 border-t p-3">
                        {earlierDecisions.map((decision) => (
                            <DecisionCard
                                key={decision.id}
                                decision={decision}
                            />
                        ))}
                    </div>
                </details>
            )}
        </section>
    );
}
