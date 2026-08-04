import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ClipboardCheck,
    PackageCheck,
    ShieldCheck,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import AppearanceTabs from '@/components/appearance-tabs';
import { dashboard, login, register } from '@/routes';
import type { Auth } from '@/types';

const features = [
    {
        icon: ClipboardCheck,
        title: 'Clear request workflows',
        description:
            'Create, review, and approve purchasing requests without losing track of the details.',
    },
    {
        icon: PackageCheck,
        title: 'Reliable inventory records',
        description:
            'Keep products, categories, and suppliers organized in one dependable workspace.',
    },
    {
        icon: BarChart3,
        title: 'Decisions with context',
        description:
            'Give every role the information they need to move procurement forward confidently.',
    },
];

export default function Welcome() {
    const { auth } = usePage<{ auth: Auth | { user: null } }>().props;

    return (
        <>
            <Head title="Smarter procurement, from request to record" />

            <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <div className="absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_75%_20%,rgba(16,185,129,0.2),transparent_42%),radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.15),transparent_35%)]" />

                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                        aria-label="ProcureFlow home"
                    >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20">
                            <AppLogoIcon className="size-6 fill-current" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight">
                            ProcureFlow
                        </span>
                    </Link>

                    <nav className="flex items-center gap-2 sm:gap-4">
                        <AppearanceTabs className="hidden sm:inline-flex" />
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                                >
                                    Get started
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="relative z-10">
                    <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pt-16 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-24 lg:pb-32">
                        <div className="max-w-3xl">
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
                                <ShieldCheck className="size-4" />
                                Built for accountable purchasing
                            </div>
                            <h1 className="text-5xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
                                Procurement that keeps everyone in the flow.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
                                ProcureFlow brings requests, approvals,
                                suppliers, and inventory together so your team
                                can buy with clarity and control.
                            </p>
                            <div className="mt-9 flex flex-wrap gap-4">
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 shadow-xl shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-300"
                                >
                                    {auth.user
                                        ? 'Open dashboard'
                                        : 'Create an account'}
                                    <ArrowRight className="size-4" />
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={login()}
                                        className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                                    >
                                        Sign in to your workspace
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-xl">
                            <div className="absolute -inset-8 rounded-full bg-emerald-400/10 blur-3xl" />
                            <div className="relative rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-2xl backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-white/[0.06]">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-5 dark:border-white/10">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Purchase request
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            Office equipment refresh
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-medium text-amber-200">
                                        In review
                                    </span>
                                </div>
                                <div className="grid gap-3 py-5 sm:grid-cols-3">
                                    {[
                                        ['Request', 'Submitted'],
                                        ['Approval', 'In progress'],
                                        ['Inventory', 'Pending'],
                                    ].map(([label, status], index) => (
                                        <div
                                            key={label}
                                            className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900/70"
                                        >
                                            <div className="mb-5 flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm font-medium">
                                                {label}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {status}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50 p-4 text-sm text-slate-600 dark:border-emerald-300/15 dark:bg-emerald-300/[0.07] dark:text-slate-300">
                                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                    Every action stays visible to the right
                                    people.
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-slate-200 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                            <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
                                One connected process
                            </p>
                            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                                Less chasing. More confident purchasing.
                            </h2>
                            <div className="mt-10 grid gap-5 md:grid-cols-3">
                                {features.map((feature) => (
                                    <article
                                        key={feature.title}
                                        className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none"
                                    >
                                        <feature.icon className="size-6 text-emerald-600 dark:text-emerald-300" />
                                        <h3 className="mt-5 text-lg font-semibold">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">
                                            {feature.description}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <p>© {new Date().getFullYear()} ProcureFlow</p>
                    <p>
                        Clear requests. Accountable approvals. Better records.
                    </p>
                </footer>
            </div>
        </>
    );
}
