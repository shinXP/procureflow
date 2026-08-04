import { Form, Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    FilePlus2,
    PackageOpen,
    Pencil,
    Search,
    Send,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Pagination } from '@/components/master-data/pagination';
import { PurchaseRequestDecisionHistory } from '@/components/purchase-requests/decision-history';
import { PurchaseRequestFormDialog } from '@/components/purchase-requests/purchase-request-form-dialog';
import {
    PurchaseRequestStatusBadge,
    purchaseRequestStatusConfig,
} from '@/components/purchase-requests/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { index as catalogIndex } from '@/routes/catalog';
import { destroy, index, submit } from '@/routes/purchase-requests';
import type {
    Paginated,
    Product,
    PurchaseRequest,
    PurchaseRequestCounts,
    PurchaseRequestStatus,
} from '@/types';

type PendingAction = {
    kind: 'delete' | 'submit';
    purchaseRequest: PurchaseRequest;
};

type ActionFormData = {
    return_search: string;
    return_status: string;
    return_page: number;
    items?: string;
    needed_at?: string;
};

const statuses = Object.keys(
    purchaseRequestStatusConfig,
) as PurchaseRequestStatus[];

const emptyCounts: PurchaseRequestCounts = {
    draft: 0,
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

export default function PurchaseRequestIndex({
    purchaseRequests,
    products = [],
    filters = { search: '', status: null },
    counts = emptyCounts,
    isAdministrator = false,
}: {
    purchaseRequests: Paginated<PurchaseRequest>;
    products?: Product[];
    filters?: {
        search: string;
        status: PurchaseRequestStatus | null;
    };
    counts?: PurchaseRequestCounts;
    isAdministrator?: boolean;
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingRequest, setEditingRequest] =
        useState<PurchaseRequest | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(
        null,
    );
    const [expandedRequestIds, setExpandedRequestIds] = useState<number[]>([]);
    const actionForm = useForm<ActionFormData>({
        return_search: filters.search,
        return_status: filters.status ?? '',
        return_page: purchaseRequests.current_page,
    });
    const hasFilters = Boolean(filters.search || filters.status);

    function toggleItems(purchaseRequestId: number): void {
        setExpandedRequestIds(
            expandedRequestIds.includes(purchaseRequestId)
                ? expandedRequestIds.filter(
                      (requestId) => requestId !== purchaseRequestId,
                  )
                : [...expandedRequestIds, purchaseRequestId],
        );
    }

    function queueAction(
        kind: PendingAction['kind'],
        purchaseRequest: PurchaseRequest,
    ): void {
        actionForm.setData({
            return_search: filters.search,
            return_status: filters.status ?? '',
            return_page: purchaseRequests.current_page,
        });
        actionForm.clearErrors();
        setPendingAction({ kind, purchaseRequest });
    }

    function confirmAction(): void {
        if (!pendingAction) {
            return;
        }

        const route =
            pendingAction.kind === 'delete'
                ? destroy({
                      purchase_request: pendingAction.purchaseRequest.id,
                  })
                : submit({
                      purchase_request: pendingAction.purchaseRequest.id,
                  });

        actionForm.submit(route.method, route.url, {
            preserveScroll: true,
            onSuccess: () => setPendingAction(null),
        });
    }

    return (
        <>
            <Head
                title={
                    isAdministrator
                        ? 'Purchase requests'
                        : 'My purchase requests'
                }
            />

            <div className="space-y-6 p-4 md:p-8">
                <section className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-xl backdrop-blur-xl md:p-8">
                    <div className="absolute top-0 right-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
                                {isAdministrator
                                    ? 'Procurement overview'
                                    : 'Request tracking'}
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                {isAdministrator
                                    ? 'Purchase requests'
                                    : 'My purchase requests'}
                            </h1>
                            <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                                {isAdministrator
                                    ? 'Review every request and follow its progress from draft to purchase order.'
                                    : 'Create drafts, submit them when ready, and follow every decision in one place.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline" asChild>
                                <Link href={catalogIndex()}>
                                    Browse catalog <ArrowRight />
                                </Link>
                            </Button>
                            <Button onClick={() => setCreateOpen(true)}>
                                <FilePlus2 /> New request
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {statuses.map((status) => {
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
                                className={`group rounded-2xl border bg-card/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                    isSelected
                                        ? 'border-emerald-500/50 ring-2 ring-emerald-500/10'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span
                                        className={`rounded-xl p-2 ${config.classes}`}
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
                            </Link>
                        );
                    })}
                </section>

                <div className="overflow-hidden rounded-2xl border bg-card/80 shadow-lg backdrop-blur-xl">
                    <Form
                        {...index.form()}
                        className="grid gap-3 border-b p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto_auto]"
                    >
                        <div className="relative">
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder={
                                    isAdministrator
                                        ? 'Search number, requester, or purpose'
                                        : 'Search request number or purpose'
                                }
                                className="pl-9"
                            />
                        </div>
                        <NativeSelect
                            name="status"
                            defaultValue={filters.status ?? ''}
                            aria-label="Filter by request status"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {purchaseRequestStatusConfig[status].label}
                                </option>
                            ))}
                        </NativeSelect>
                        <Button variant="outline">Filter</Button>
                        {hasFilters && (
                            <Button variant="ghost" asChild>
                                <Link href={index()}>Reset</Link>
                            </Button>
                        )}
                    </Form>

                    <div className="divide-y">
                        {purchaseRequests.data.map((purchaseRequest) => {
                            const itemsExpanded = expandedRequestIds.includes(
                                purchaseRequest.id,
                            );
                            const recordedDate =
                                purchaseRequest.submitted_at ??
                                purchaseRequest.created_at;

                            return (
                                <article
                                    key={purchaseRequest.id}
                                    className="p-5 transition hover:bg-muted/20 sm:p-6"
                                >
                                    <div className="flex flex-col gap-5">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h2 className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                        {
                                                            purchaseRequest.reference
                                                        }
                                                    </h2>
                                                    <PurchaseRequestStatusBadge
                                                        status={
                                                            purchaseRequest.status
                                                        }
                                                    />
                                                </div>

                                                {isAdministrator && (
                                                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                                        <UserRound className="size-4" />
                                                        <span className="font-medium text-foreground">
                                                            {
                                                                purchaseRequest
                                                                    .requester
                                                                    .name
                                                            }
                                                        </span>
                                                        <span className="hidden sm:inline">
                                                            {
                                                                purchaseRequest
                                                                    .requester
                                                                    .email
                                                            }
                                                        </span>
                                                    </p>
                                                )}

                                                <p className="mt-3 max-w-3xl leading-7">
                                                    {purchaseRequest.purpose}
                                                </p>
                                            </div>

                                            <div className="grid shrink-0 gap-1 text-sm text-muted-foreground lg:text-right">
                                                <p>
                                                    {purchaseRequest.submitted_at
                                                        ? 'Submitted'
                                                        : 'Saved'}{' '}
                                                    {formatDate(recordedDate)}
                                                </p>
                                                {purchaseRequest.needed_at && (
                                                    <p className="flex items-center gap-1.5 lg:justify-end">
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

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    toggleItems(
                                                        purchaseRequest.id,
                                                    )
                                                }
                                            >
                                                {itemsExpanded ? (
                                                    <ChevronUp />
                                                ) : (
                                                    <ChevronDown />
                                                )}
                                                {itemsExpanded
                                                    ? 'Hide items'
                                                    : 'View items'}
                                            </Button>
                                            <div className="grow" />
                                            {purchaseRequest.can.update && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setEditingRequest(
                                                            purchaseRequest,
                                                        )
                                                    }
                                                >
                                                    <Pencil /> Edit
                                                </Button>
                                            )}
                                            {purchaseRequest.can.delete && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        queueAction(
                                                            'delete',
                                                            purchaseRequest,
                                                        )
                                                    }
                                                >
                                                    <Trash2 /> Delete
                                                </Button>
                                            )}
                                            {purchaseRequest.can.submit && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        queueAction(
                                                            'submit',
                                                            purchaseRequest,
                                                        )
                                                    }
                                                >
                                                    <Send /> Submit request
                                                </Button>
                                            )}
                                        </div>

                                        {itemsExpanded && (
                                            <div className="grid gap-3 rounded-2xl border bg-background/60 p-3 md:grid-cols-2 xl:grid-cols-3">
                                                {purchaseRequest.items.map(
                                                    (item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-start gap-3 rounded-xl bg-muted/40 p-3"
                                                        >
                                                            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                                                                <PackageOpen className="size-4" />
                                                            </span>
                                                            <div className="min-w-0 grow">
                                                                <p className="truncate font-medium">
                                                                    {
                                                                        item.product_name
                                                                    }
                                                                </p>
                                                                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                                    {item.sku}
                                                                </p>
                                                                {item.notes && (
                                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                                        {
                                                                            item.notes
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <p className="shrink-0 text-sm font-semibold tabular-nums">
                                                                {Number(
                                                                    item.quantity,
                                                                ).toLocaleString()}{' '}
                                                                <span className="font-normal text-muted-foreground">
                                                                    {item.unit}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        <PurchaseRequestDecisionHistory
                                            decisions={
                                                purchaseRequest.decisions
                                            }
                                        />
                                    </div>
                                </article>
                            );
                        })}

                        {purchaseRequests.data.length === 0 && (
                            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                                <span className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
                                    <ClipboardList className="size-8" />
                                </span>
                                <div>
                                    <h2 className="font-semibold">
                                        {hasFilters
                                            ? 'No requests match these filters'
                                            : 'No purchase requests yet'}
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                        {hasFilters
                                            ? 'Try a different search or clear the selected status.'
                                            : isAdministrator
                                              ? 'Create a request or wait for a requester to add one.'
                                              : 'Create a request here or select products from the catalog.'}
                                    </p>
                                </div>
                                {hasFilters ? (
                                    <Button variant="outline" asChild>
                                        <Link href={index()}>
                                            Clear filters
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button onClick={() => setCreateOpen(true)}>
                                        <FilePlus2 /> Create first request
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
                </div>
            </div>

            {createOpen && (
                <PurchaseRequestFormDialog
                    open
                    onOpenChange={setCreateOpen}
                    products={products}
                    returnTo={{
                        search: filters.search,
                        status: filters.status ?? '',
                        page: purchaseRequests.current_page,
                    }}
                />
            )}

            {editingRequest && (
                <PurchaseRequestFormDialog
                    key={editingRequest.id}
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingRequest(null);
                        }
                    }}
                    products={products}
                    purchaseRequest={editingRequest}
                    returnTo={{
                        search: filters.search,
                        status: filters.status ?? '',
                        page: purchaseRequests.current_page,
                    }}
                />
            )}

            <Dialog
                open={pendingAction !== null}
                onOpenChange={(open) => {
                    if (!open && !actionForm.processing) {
                        setPendingAction(null);
                        actionForm.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pendingAction?.kind === 'delete'
                                ? 'Delete draft request?'
                                : 'Submit this request?'}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingAction?.kind === 'delete'
                                ? `${pendingAction.purchaseRequest.reference} and all of its items will be permanently removed.`
                                : `${pendingAction?.purchaseRequest.reference} can no longer be edited after submission unless it is rejected.`}
                        </DialogDescription>
                    </DialogHeader>
                    <InputError message={actionForm.errors.items} />
                    <InputError message={actionForm.errors.needed_at} />
                    <InputError
                        message={
                            actionForm.errors[
                                'status' as keyof typeof actionForm.errors
                            ]
                        }
                    />
                    <InputError message={actionForm.errors.return_page} />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPendingAction(null)}
                            disabled={actionForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={
                                pendingAction?.kind === 'delete'
                                    ? 'destructive'
                                    : 'default'
                            }
                            onClick={confirmAction}
                            disabled={actionForm.processing}
                        >
                            {actionForm.processing
                                ? 'Working...'
                                : pendingAction?.kind === 'delete'
                                  ? 'Delete draft'
                                  : 'Submit request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PurchaseRequestIndex.layout = {
    breadcrumbs: [{ title: 'Purchase requests', href: index() }],
};
