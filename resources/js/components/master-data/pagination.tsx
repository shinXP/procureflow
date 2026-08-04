import { Link } from '@inertiajs/react';
import type { PaginationLink } from '@/types';

function cleanLabel(label: string): string {
    return label.replace('&laquo;', '«').replace('&raquo;', '»');
}

export function Pagination({
    links,
    from,
    to,
    total,
}: {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}) {
    if (total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {from}–{to} of {total}
            </p>
            <div className="flex flex-wrap gap-1">
                {links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            }`}
                        >
                            {cleanLabel(link.label)}
                        </Link>
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground opacity-50"
                        >
                            {cleanLabel(link.label)}
                        </span>
                    ),
                )}
            </div>
        </div>
    );
}
