import {
    CheckCircle2,
    CircleDashed,
    FilePenLine,
    PackageCheck,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PurchaseRequestStatus } from '@/types';

export const purchaseRequestStatusConfig: Record<
    PurchaseRequestStatus,
    { label: string; icon: LucideIcon; classes: string }
> = {
    draft: {
        label: 'Draft',
        icon: FilePenLine,
        classes:
            'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
    },
    submitted: {
        label: 'Submitted',
        icon: CircleDashed,
        classes:
            'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
    },
    approved: {
        label: 'Approved',
        icon: CheckCircle2,
        classes:
            'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    },
    rejected: {
        label: 'Rejected',
        icon: XCircle,
        classes:
            'bg-red-100 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20',
    },
    converted_to_purchase_order: {
        label: 'Converted to PO',
        icon: PackageCheck,
        classes:
            'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
    },
};

export function PurchaseRequestStatusBadge({
    status,
}: {
    status: PurchaseRequestStatus;
}) {
    const config = purchaseRequestStatusConfig[status];
    const StatusIcon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.classes}`}
        >
            <StatusIcon className="size-3.5" />
            {config.label}
        </span>
    );
}
