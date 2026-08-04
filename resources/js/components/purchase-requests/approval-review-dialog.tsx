import { useForm } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    PackageOpen,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { PurchaseRequestDecisionHistory } from '@/components/purchase-requests/decision-history';
import { PurchaseRequestStatusBadge } from '@/components/purchase-requests/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { approve, reject } from '@/routes/approvals';
import type { PurchaseRequest } from '@/types';

type DecisionKind = 'approved' | 'rejected';

type DecisionFormData = {
    remarks: string;
    return_search: string;
    return_status: string;
    return_page: number;
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

export function ApprovalReviewDialog({
    purchaseRequest,
    filters,
    page,
    onOpenChange,
}: {
    purchaseRequest: PurchaseRequest;
    filters: {
        search: string;
        status: string | null;
    };
    page: number;
    onOpenChange: (open: boolean) => void;
}) {
    const [decisionKind, setDecisionKind] = useState<DecisionKind | null>(null);
    const [clientError, setClientError] = useState<string | null>(null);
    const form = useForm<DecisionFormData>({
        remarks: '',
        return_search: filters.search,
        return_status: filters.status ?? '',
        return_page: page,
    });

    function submitDecision(decision: DecisionKind): void {
        form.clearErrors();
        setClientError(null);

        if (decision === 'rejected' && form.data.remarks.trim() === '') {
            setDecisionKind(decision);
            setClientError(
                'Explain why this request is being rejected so the requester knows what to revise.',
            );

            return;
        }

        const route =
            decision === 'approved'
                ? approve({
                      purchase_request: purchaseRequest.id,
                  })
                : reject({
                      purchase_request: purchaseRequest.id,
                  });

        setDecisionKind(decision);
        form.submit(route.method, route.url, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onFinish: () => setDecisionKind(null),
        });
    }

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!form.processing) {
                    onOpenChange(open);
                }
            }}
        >
            <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
                <DialogHeader className="border-b p-5 pr-12 sm:p-6 sm:pr-14">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {purchaseRequest.reference}
                        </span>
                        <PurchaseRequestStatusBadge
                            status={purchaseRequest.status}
                        />
                    </div>
                    <DialogTitle className="text-xl">
                        Review purchase request
                    </DialogTitle>
                    <DialogDescription>
                        Confirm the requester, business need, and every product
                        before recording a decision.
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto">
                    <div className="grid gap-6 p-5 sm:p-6">
                        <section className="grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Requested by
                                </p>
                                <div className="mt-2 flex items-start gap-2">
                                    <UserRound className="mt-0.5 size-4 text-emerald-700 dark:text-emerald-300" />
                                    <div>
                                        <p className="font-medium">
                                            {purchaseRequest.requester.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {purchaseRequest.requester.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground sm:text-right">
                                {purchaseRequest.submitted_at && (
                                    <p className="flex items-center gap-2 sm:justify-end">
                                        <Clock3 className="size-4" />
                                        Submitted{' '}
                                        {formatDateTime(
                                            purchaseRequest.submitted_at,
                                        )}
                                    </p>
                                )}
                                {purchaseRequest.needed_at && (
                                    <p className="flex items-center gap-2 sm:justify-end">
                                        <CalendarDays className="size-4" />
                                        Needed{' '}
                                        {formatDate(purchaseRequest.needed_at)}
                                    </p>
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Business purpose
                                </p>
                                <p className="mt-2 leading-7">
                                    {purchaseRequest.purpose}
                                </p>
                            </div>
                        </section>

                        <section>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">
                                        Requested products
                                    </h3>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {purchaseRequest.items_count}{' '}
                                        {purchaseRequest.items_count === 1
                                            ? 'line item'
                                            : 'line items'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {purchaseRequest.items.map((item) => (
                                    <article
                                        key={item.id}
                                        className="flex items-start gap-3 rounded-2xl border bg-card p-4"
                                    >
                                        <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300">
                                            <PackageOpen className="size-4" />
                                        </span>
                                        <div className="min-w-0 grow">
                                            <p className="font-medium">
                                                {item.product_name}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                {item.sku}
                                            </p>
                                            {item.notes && (
                                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                    {item.notes}
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
                                    </article>
                                ))}
                            </div>
                        </section>

                        <PurchaseRequestDecisionHistory
                            decisions={purchaseRequest.decisions}
                        />

                        {purchaseRequest.can.decide && (
                            <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="decision-remarks">
                                        Decision remarks
                                    </Label>
                                    <p
                                        id="decision-remarks-help"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Optional when approving. Required when
                                        rejecting so the requester can revise
                                        the request.
                                    </p>
                                </div>
                                <Textarea
                                    id="decision-remarks"
                                    className="mt-3 min-h-28 bg-background/80"
                                    value={form.data.remarks}
                                    onChange={(event) => {
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        );
                                        setClientError(null);
                                        form.clearErrors('remarks');
                                    }}
                                    maxLength={2000}
                                    placeholder="Add context for the requester..."
                                    aria-describedby="decision-remarks-help"
                                    aria-invalid={Boolean(
                                        clientError || form.errors.remarks,
                                    )}
                                    disabled={form.processing}
                                />
                                <div className="mt-1 flex items-start justify-between gap-3">
                                    <div>
                                        <InputError
                                            message={
                                                clientError ??
                                                form.errors.remarks
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    'status' as keyof typeof form.errors
                                                ]
                                            }
                                        />
                                    </div>
                                    <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                        {form.data.remarks.length}/2000
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t bg-muted/20 p-4 sm:p-5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={form.processing}
                    >
                        Close
                    </Button>
                    {purchaseRequest.can.decide && (
                        <>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => submitDecision('rejected')}
                                disabled={form.processing}
                            >
                                <XCircle />
                                {form.processing && decisionKind === 'rejected'
                                    ? 'Rejecting...'
                                    : 'Reject request'}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => submitDecision('approved')}
                                disabled={form.processing}
                            >
                                <CheckCircle2 />
                                {form.processing && decisionKind === 'approved'
                                    ? 'Approving...'
                                    : 'Approve request'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
