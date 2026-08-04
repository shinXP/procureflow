import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    ClipboardList,
    LayoutGrid,
    ShieldCheck,
    ShoppingBag,
    Tags,
    Truck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as approvalsIndex } from '@/routes/approvals';
import { index as catalogIndex } from '@/routes/catalog';
import { index as categoriesIndex } from '@/routes/categories';
import { index as productsIndex } from '@/routes/products';
import { index as purchaseRequestsIndex } from '@/routes/purchase-requests';
import { index as suppliersIndex } from '@/routes/suppliers';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const canManageMasterData = ['admin', 'inventory_officer'].includes(
        auth.user.role,
    );
    const canBrowseRequestWorkflow = auth.user.role === 'requester';
    const canReviewPurchaseRequests = ['admin', 'approver'].includes(
        auth.user.role,
    );
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(canBrowseRequestWorkflow
            ? [
                  {
                      title: 'Product catalog',
                      href: catalogIndex(),
                      icon: ShoppingBag,
                  },
                  {
                      title: 'My requests',
                      href: purchaseRequestsIndex(),
                      icon: ClipboardList,
                  },
              ]
            : []),
        ...(canReviewPurchaseRequests
            ? [
                  {
                      title: 'Approvals',
                      href: approvalsIndex(),
                      icon: ShieldCheck,
                  },
              ]
            : []),
        ...(canManageMasterData
            ? [
                  {
                      title: 'Categories',
                      href: categoriesIndex(),
                      icon: Tags,
                  },
                  {
                      title: 'Products',
                      href: productsIndex(),
                      icon: Boxes,
                  },
                  {
                      title: 'Suppliers',
                      href: suppliersIndex(),
                      icon: Truck,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-slate-200 dark:border-white/5"
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
