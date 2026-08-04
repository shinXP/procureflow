import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CircleCheckBig,
    ShieldCheck,
    Sparkles,
    Workflow,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { index as approvalsIndex } from '@/routes/approvals';
import { index as catalogIndex } from '@/routes/catalog';
import { index as productsIndex } from '@/routes/products';
import { index as purchaseRequestsIndex } from '@/routes/purchase-requests';
import type { UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    requester: 'Requester',
    approver: 'Approver',
    inventory_officer: 'Inventory Officer',
};

const roleDescriptions: Record<UserRole, string> = {
    admin: 'Manage users, system access, and master records.',
    requester: 'Create purchase requests and monitor their status.',
    approver: 'Review submitted requests and record decisions.',
    inventory_officer:
        'Maintain categories, products, suppliers, and catalog images.',
};

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth.user;
    const canReviewPurchaseRequests = ['admin', 'approver'].includes(user.role);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-8">
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl md:p-9 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-2xl">
                    <div className="absolute top-0 right-0 size-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
                            <Sparkles className="size-4" />
                            ProcureFlow workspace
                        </div>
                        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                            Welcome back, {user.name}
                        </h1>
                        <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                            Keep purchasing moving with clear access, organized
                            records, and one connected workspace.
                        </p>
                        {user.role === 'requester' ? (
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href={catalogIndex()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
                                >
                                    Browse product catalog
                                    <ArrowUpRight className="size-4" />
                                </Link>
                                <Link
                                    href={purchaseRequestsIndex()}
                                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                                >
                                    Track my requests
                                </Link>
                            </div>
                        ) : canReviewPurchaseRequests ? (
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href={approvalsIndex()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
                                >
                                    Review submitted requests
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>
                        ) : user.role === 'inventory_officer' ? (
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href={productsIndex()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
                                >
                                    Manage product records
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                Everything is ready for your next action
                                <ArrowUpRight className="size-4" />
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/60 dark:shadow-xl">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Your role
                            </p>
                            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <ShieldCheck className="size-5" />
                            </span>
                        </div>
                        <p className="mt-3 text-xl font-semibold">
                            {roleLabels[user.role]}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {roleDescriptions[user.role]}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/60 dark:shadow-xl">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Access control
                            </p>
                            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <CircleCheckBig className="size-5" />
                            </span>
                        </div>
                        <p className="mt-3 text-xl font-semibold">Active</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Protected pages now check the authenticated user's
                            role.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/60 dark:shadow-xl">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Current milestone
                            </p>
                            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <Workflow className="size-5" />
                            </span>
                        </div>
                        <p className="mt-3 text-xl font-semibold">
                            {user.role === 'requester'
                                ? 'Requests are ready'
                                : user.role === 'approver'
                                  ? 'Approval workflow ready'
                                  : user.role === 'admin'
                                    ? 'Approval queue ready'
                                    : 'Product records ready'}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {user.role === 'requester'
                                ? 'Browse the product catalog, submit multi-item requests, and track their status.'
                                : user.role === 'approver'
                                  ? 'Review submitted requests, approve or reject once, and leave clear decision remarks.'
                                  : user.role === 'admin'
                                    ? 'Oversee master data and requester activity, then record decisions from the approval queue.'
                                    : 'Maintain categories, products, suppliers, availability, and catalog images.'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
