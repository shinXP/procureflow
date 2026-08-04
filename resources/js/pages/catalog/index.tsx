import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    Check,
    ClipboardList,
    PackageOpen,
    Plus,
    Search,
    ShoppingBasket,
} from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/master-data/pagination';
import { PurchaseRequestFormDialog } from '@/components/purchase-requests/purchase-request-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { index as catalogIndex } from '@/routes/catalog';
import { index as purchaseRequestsIndex } from '@/routes/purchase-requests';
import type { CategoryOption, Paginated, Product } from '@/types';

const maximumRequestItems = 50;

export default function CatalogIndex({
    products,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    categories: CategoryOption[];
    filters: { search: string; category_id: number | null };
}) {
    const { auth } = usePage().props;
    const isAdministrator = auth.user.role === 'admin';
    const canCreateRequest = ['admin', 'requester'].includes(auth.user.role);
    const [requestOpen, setRequestOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    function toggleProduct(product: Product): void {
        if (
            selectedProducts.some(
                (selectedProduct) => selectedProduct.id === product.id,
            )
        ) {
            setSelectedProducts(
                selectedProducts.filter(
                    (selectedProduct) => selectedProduct.id !== product.id,
                ),
            );

            return;
        }

        if (selectedProducts.length >= maximumRequestItems) {
            return;
        }

        setSelectedProducts([...selectedProducts, product]);
    }

    const requestProductOptions = [
        ...selectedProducts,
        ...products.data.filter(
            (product) =>
                !selectedProducts.some(
                    (selectedProduct) => selectedProduct.id === product.id,
                ),
        ),
    ];

    return (
        <>
            <Head title="Product catalog" />

            <div className="space-y-6 p-4 md:p-8">
                <section className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-xl backdrop-blur-xl md:p-8">
                    <div className="absolute top-0 right-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
                                {isAdministrator
                                    ? 'Admin procurement workspace'
                                    : 'Requester workspace'}
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                Product catalog
                            </h1>
                            <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                                {canCreateRequest
                                    ? 'Choose active products, review the quantities, and save a purchase request draft.'
                                    : 'Browse the active products available to requesters across the organization.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline" asChild>
                                <Link href={purchaseRequestsIndex()}>
                                    <ClipboardList />
                                    {isAdministrator
                                        ? 'Purchase requests'
                                        : 'My requests'}
                                </Link>
                            </Button>
                            {canCreateRequest && (
                                <Button
                                    onClick={() => setRequestOpen(true)}
                                    disabled={selectedProducts.length === 0}
                                >
                                    <ShoppingBasket /> Review draft
                                    {selectedProducts.length > 0 && (
                                        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
                                            {selectedProducts.length}
                                        </span>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="overflow-hidden rounded-2xl border bg-card/80 shadow-xl backdrop-blur-xl">
                    <Form
                        {...catalogIndex.form()}
                        className="grid gap-3 border-b p-4 md:grid-cols-[1fr_220px_auto_auto]"
                    >
                        <div className="relative">
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search products"
                                className="pl-9"
                            />
                        </div>
                        <NativeSelect
                            name="category_id"
                            defaultValue={filters.category_id ?? ''}
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </NativeSelect>
                        <Button variant="outline">Filter</Button>
                        {(filters.search || filters.category_id) && (
                            <Button variant="ghost" asChild>
                                <Link href={catalogIndex()}>Reset</Link>
                            </Button>
                        )}
                    </Form>

                    <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {products.data.map((product) => {
                            const selected = selectedProducts.some(
                                (selectedProduct) =>
                                    selectedProduct.id === product.id,
                            );

                            return (
                                <article
                                    key={product.id}
                                    className="group overflow-hidden rounded-2xl border bg-background/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-emerald-950/30 dark:to-slate-900">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <PackageOpen className="size-12 opacity-40" />
                                                <span className="text-xs">
                                                    No product image
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4 p-5">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                                    {product.sku}
                                                </span>
                                                <span className="truncate text-muted-foreground">
                                                    {product.category?.name}
                                                </span>
                                            </div>
                                            <h2 className="mt-2 text-lg font-semibold">
                                                {product.name}
                                            </h2>
                                            <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                                                {product.description ||
                                                    'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border-t pt-4 text-sm">
                                            <span className="capitalize">
                                                Per {product.unit}
                                            </span>
                                            {canCreateRequest && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={
                                                        selected
                                                            ? 'secondary'
                                                            : 'default'
                                                    }
                                                    onClick={() =>
                                                        toggleProduct(product)
                                                    }
                                                    disabled={
                                                        !selected &&
                                                        selectedProducts.length >=
                                                            maximumRequestItems
                                                    }
                                                >
                                                    {selected ? (
                                                        <Check />
                                                    ) : (
                                                        <Plus />
                                                    )}
                                                    {selected
                                                        ? 'Selected'
                                                        : 'Add to draft'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {products.data.length === 0 && (
                        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-muted-foreground">
                            <PackageOpen className="size-12 opacity-40" />
                            <p>No active products match your filters.</p>
                        </div>
                    )}

                    <Pagination
                        links={products.links}
                        from={products.from}
                        to={products.to}
                        total={products.total}
                    />
                </div>
            </div>

            {requestOpen && (
                <PurchaseRequestFormDialog
                    open
                    onOpenChange={setRequestOpen}
                    products={requestProductOptions}
                    initialProducts={selectedProducts}
                    onSaved={() => setSelectedProducts([])}
                />
            )}
        </>
    );
}

CatalogIndex.layout = {
    breadcrumbs: [{ title: 'Catalog', href: catalogIndex() }],
};
