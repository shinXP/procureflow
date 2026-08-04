import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Eye,
    History,
    Inbox,
    PackageOpen,
    Search,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/master-data/pagination';
import { ApprovalReviewDialog } from '@/components/purchase-requests/approval-review-dialog';
import { PurchaseRequestDecisionHistory } from '@/components/purchase-requests/decision-history';
import {
    PurchaseRequestStatusBadge,
    purchaseRequestStatusConfig,
} from '@/components/purchase-requests/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { index } from '@/routes/approvals';
import type {
    ApprovalStatus,
    Paginated,
    PurchaseRequest,
    PurchaseRequestApprovalCounts,
} from '@/types';

const approvalStatuses: ApprovalStatus[] = [
    'submitted',
    'approved',
    'rejected',
    'converted_to_purchase_order',
];

const emptyCounts: PurchaseRequestApprovalCounts = {
    submitted: 0,
    approved: 0,
    rejected: 0,
    converted_to_purchase_order: 0,
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function ApprovalIndex({
    purchaseRequests,
    filters = { search: '', status: null },
    counts = emptyCounts,
}: {
    purchaseRequests: Paginated<PurchaseRequest>;
    filters?: {
        search: string;
        status: ApprovalStatus | null;
    };
    counts?: PurchaseRequestApprovalCounts;
}) {
    const [selectedRequest, setSelectedRequest] =
        useState<PurchaseRequest | null>(null);
    const hasFilters = Boolean(filters.search || filters.status);

    return (
        <>
            <Head title="Approval queue" />

            <div className="space-y-6 p-4 md:p-8">
                <section className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-xl backdrop-blur-xl md:p-8">
                    <div className="absolute top-0 right-0 size-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 size-32 translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                                <ShieldCheck className="size-4" />
                                Controlled review workspace
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                                Approval queue
                            </h1>
                            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                                Review submitted purchase requests, record a
                                clear decision, and keep an auditable history
                                for every requester.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 shadow-sm">
                            <span className="rounded-xl bg-sky-500/10 p-2.5 text-sky-700 dark:text-sky-300">
                                <Inbox className="size-5" />
                            </span>
                            <div>
                                <p className="text-2xl font-semibold tabular-nums">
                                    {counts.submitted}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Awaiting a decision
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    aria-label="Approval status summary"
                >
                    {approvalStatuses.map((status) => {
                        const config = purchaseRequestStatusConfig[status];
                        const StatusIcon = config.icon;
                        const isSelected = filters.status === status;

                        return (
                            <Link
                                key={status}
                                href={index({
                                    query: {
                                        search: filters.search || undefined,
                                        status: isSelected ? undefined : status,
                                    },
                                })}
                                preserveScroll
                                preserveState
                                aria-current={isSelected ? 'page' : undefined}
                                className={`group rounded-2xl border bg-card/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                    isSelected
                                        ? 'border-emerald-500/50 ring-2 ring-emerald-500/10'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span
                                        className={`rounded-xl p-2.5 ${config.classes}`}
                                    >
                                        <StatusIcon className="size-4" />
                                    </span>
                                    <span className="text-2xl font-semibold tabular-nums">
                                        {counts[status] ?? 0}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm font-medium">
                                    {config.label}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {status === 'submitted'
                                        ? 'Ready for review'
                                        : status === 'approved'
                                          ? 'Available for purchasing'
                                          : status === 'rejected'
                                            ? 'Returned for revision'
                                            : 'Moved into fulfillment'}
                                </p>
                            </Link>
                        );
                    })}
                </section>

                <section className="overflow-hidden rounded-2xl border bg-card/80 shadow-lg backdrop-blur-xl">
                    <div className="flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                Requests and decision history
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Submitted requests are shown alongside completed
                                decisions for quick follow-up.
                            </p>
                        </div>
                        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:mt-0">
                            <History className="size-3.5" />
                            {purchaseRequests.total}{' '}
                            {purchaseRequests.total === 1
                                ? 'request'
                                : 'requests'}
                        </span>
                    </div>

                    <Form
                        {...index.form()}
                        className="grid gap-3 border-b bg-muted/10 p-4 sm:grid-cols-[minmax(0,1fr)_230px_auto_auto]"
                    >
                        <div className="relative">
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search number, requester, or purpose"
                                className="pl-9"
                            />
                        </div>
                        <NativeSelect
                            name="status"
                            defaultValue={filters.status ?? ''}
                            aria-label="Filter approval requests by status"
                        >
                            <option value="">All review statuses</option>
                            {approvalStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {purchaseRequestStatusConfig[status].label}
                                </option>
                            ))}
                        </NativeSelect>
                        <Button variant="outline">Apply filters</Button>
                        {hasFilters && (
                            <Button variant="ghost" asChild>
                                <Link href={index()}>Reset</Link>
                            </Button>
                        )}
                    </Form>

                    <div className="grid gap-4 p-4 sm:p-5">
                        {purchaseRequests.data.map((purchaseRequest) => {
                            const previewItems = purchaseRequest.items.slice(
                                0,
                                3,
                            );
                            const remainingItems =
                                purchaseRequest.items.length -
                                previewItems.length;

                            return (
                                <article
                                    key={purchaseRequest.id}
                                    className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm transition hover:border-emerald-500/25 hover:shadow-md"
                                >
                                    {purchaseRequest.status === 'submitted' && (
                                        <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />
                                    )}
                                    <div className="grid gap-5 p-5 sm:p-6">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                        {
                                                            purchaseRequest.reference
                                                        }
                                                    </h3>
                                                    <PurchaseRequestStatusBadge
                                                        status={
                                                            purchaseRequest.status
                                                        }
                                                    />
                                                    {purchaseRequest.can
                                                        .decide && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300">
                                                            <Clock3 className="size-3.5" />
                                                            Action needed
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <UserRound className="size-4" />
                                                        <strong className="font-medium text-foreground">
                                                            {
                                                                purchaseRequest
                                                                    .requester
                                                                    .name
                                                            }
                                                        </strong>
                                                    </span>
                                                    <span className="hidden sm:inline">
                                                        {
                                                            purchaseRequest
                                                                .requester.email
                                                        }
                                                    </span>
                                                </div>

                                                <p className="mt-3 max-w-3xl leading-7">
                                                    {purchaseRequest.purpose}
                                                </p>
                                            </div>

                                            <div className="grid shrink-0 gap-1.5 text-sm text-muted-foreground xl:text-right">
                                                {purchaseRequest.submitted_at && (
                                                    <p className="flex items-center gap-1.5 xl:justify-end">
                                                        <Clock3 className="size-4" />
                                                        Submitted{' '}
                                                        {formatDateTime(
                                                            purchaseRequest.submitted_at,
                                                        )}
                                                    </p>
                                                )}
                                                {purchaseRequest.needed_at && (
                                                    <p className="flex items-center gap-1.5 xl:justify-end">
                                                        <CalendarDays className="size-4" />
                                                        Needed{' '}
                                                        {formatDate(
                                                            purchaseRequest.needed_at,
                                                        )}
                                                    </p>
                                                )}
                                                <p>
                                                    {
                                                        purchaseRequest.items_count
                                                    }{' '}
                                                    {purchaseRequest.items_count ===
                                                    1
                                                        ? 'product'
                                                        : 'products'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                            {previewItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"
                                                >
                                                    <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                                                        <PackageOpen className="size-4" />
                                                    </span>
                                                    <div className="min-w-0 grow">
                                                        <p className="truncate text-sm font-medium">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                                                            {item.sku}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-xs font-semibold tabular-nums">
                                                        {Number(
                                                            item.quantity,
                                                        ).toLocaleString()}{' '}
                                                        <span className="font-normal text-muted-foreground">
                                                            {item.unit}
                                                        </span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {remainingItems > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                + {remainingItems} more{' '}
                                                {remainingItems === 1
                                                    ? 'product'
                                                    : 'products'}{' '}
                                                available in the full review
                                            </p>
                                        )}

                                        <PurchaseRequestDecisionHistory
                                            decisions={
                                                purchaseRequest.decisions
                                            }
                                        />

                                        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                {purchaseRequest.can.decide ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <ClipboardCheck className="size-4 text-sky-600 dark:text-sky-300" />
                                                        Open the full request to
                                                        approve or reject it.
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-300" />
                                                        This request already has
                                                        a recorded outcome.
                                                    </span>
                                                )}
                                            </p>
                                            <Button
                                                type="button"
                                                variant={
                                                    purchaseRequest.can.decide
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    setSelectedRequest(
                                                        purchaseRequest,
                                                    )
                                                }
                                            >
                                                <Eye />
                                                {purchaseRequest.can.decide
                                                    ? 'Review and decide'
                                                    : 'View full details'}
                                                <ArrowRight />
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {purchaseRequests.data.length === 0 && (
                            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                                <span className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
                                    {hasFilters ? (
                                        <Search className="size-8" />
                                    ) : (
                                        <ShieldCheck className="size-8" />
                                    )}
                                </span>
                                <div>
                                    <h2 className="font-semibold">
                                        {hasFilters
                                            ? 'No requests match these filters'
                                            : 'The approval queue is clear'}
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                                        {hasFilters
                                            ? 'Try another request number, requester, purpose, or review status.'
                                            : 'Newly submitted purchase requests will appear here for review.'}
                                    </p>
                                </div>
                                {hasFilters && (
                                    <Button variant="outline" asChild>
                                        <Link href={index()}>
                                            Clear filters
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    <Pagination
                        links={purchaseRequests.links}
                        from={purchaseRequests.from}
                        to={purchaseRequests.to}
                        total={purchaseRequests.total}
                    />
                </section>
            </div>

            {selectedRequest && (
                <ApprovalReviewDialog
                    key={selectedRequest.id}
                    purchaseRequest={selectedRequest}
                    filters={filters}
                    page={purchaseRequests.current_page}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedRequest(null);
                        }
                    }}
                />
            )}
        </>
    );
}

ApprovalIndex.layout = {
    breadcrumbs: [{ title: 'Approvals', href: index() }],
};
