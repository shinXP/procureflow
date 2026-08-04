import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-3">
            <SidebarGroupLabel className="text-[0.65rem] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Workspace
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="h-10 rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-emerald-50 data-[active=true]:font-medium data-[active=true]:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white dark:data-[active=true]:bg-emerald-400/10 dark:data-[active=true]:text-emerald-300"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
