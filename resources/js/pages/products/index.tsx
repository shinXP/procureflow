import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Grid2X2,
    ImagePlus,
    List,
    PackageOpen,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Pagination } from '@/components/master-data/pagination';
import { StatusBadge } from '@/components/master-data/status-badge';
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
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { destroy, index, store, update } from '@/routes/products';
import type { Auth, CategoryOption, Paginated, Product } from '@/types';

type ProductFormData = {
    category_id: string;
    sku: string;
    name: string;
    description: string;
    image: File | null;
    unit: string;
    reorder_level: string;
    is_active: boolean;
};

export default function ProductIndex({
    products,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    categories: CategoryOption[];
    filters: { search: string; category_id: number | null };
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isInventoryOfficer = auth.user.role === 'inventory_officer';
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(
        null,
    );
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm<ProductFormData>({
        category_id: '',
        sku: '',
        name: '',
        description: '',
        image: null,
        unit: 'piece',
        reorder_level: '0',
        is_active: true,
    });
    const deleteForm = useForm({});
    const returnQuery = {
        query: {
            return_search: filters.search || undefined,
            return_category_id: filters.category_id ?? undefined,
            return_page:
                products.current_page > 1 ? products.current_page : undefined,
        },
    };

    function openCreateModal(): void {
        setEditingProduct(null);
        setImagePreview(null);
        form.setData({
            category_id: '',
            sku: '',
            name: '',
            description: '',
            image: null,
            unit: 'piece',
            reorder_level: '0',
            is_active: true,
        });
        form.clearErrors();
        setFormModalOpen(true);
    }

    function openEditModal(product: Product): void {
        setEditingProduct(product);
        setImagePreview(product.image_url);
        form.setData({
            category_id: String(product.category_id),
            sku: product.sku,
            name: product.name,
            description: product.description ?? '',
            image: null,
            unit: product.unit,
            reorder_level: product.reorder_level,
            is_active: product.is_active,
        });
        form.clearErrors();
        setFormModalOpen(true);
    }

    function closeFormModal(): void {
        setFormModalOpen(false);
        setEditingProduct(null);
        setImagePreview(null);
        form.reset();
        form.clearErrors();
    }

    function submitProduct(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => closeFormModal(),
        };

        if (editingProduct) {
            form.post(update.form(editingProduct, returnQuery).action, options);

            return;
        }

        form.post(store.url(returnQuery), options);
    }

    function chooseImage(file: File | undefined): void {
        if (!file) {
            return;
        }

        form.setData('image', file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(String(reader.result));
        reader.readAsDataURL(file);
    }

    function deleteProduct(): void {
        if (!deletingProduct) {
            return;
        }

        deleteForm.delete(destroy.url(deletingProduct, returnQuery), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalOpen(false);
                setDeletingProduct(null);
            },
        });
    }

    return (
        <>
            <Head
                title={isInventoryOfficer ? 'Inventory catalog' : 'Products'}
            />

            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
                            {isInventoryOfficer
                                ? 'Inventory workspace'
                                : 'Master data'}
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            {isInventoryOfficer
                                ? 'Product catalog'
                                : 'Products'}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            Browse product photos and details, or maintain the
                            items available for procurement and inventory.
                        </p>
                    </div>

                    <Button
                        onClick={openCreateModal}
                        disabled={
                            !categories.some(
                                (category) => category.is_active !== false,
                            )
                        }
                    >
                        <Plus />
                        Add product
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-card/80 shadow-xl backdrop-blur-xl">
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
                        <Form
                            {...index.form()}
                            className="grid flex-1 gap-3 md:grid-cols-[1fr_220px_auto_auto]"
                        >
                            <div className="relative">
                                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Search name, SKU, or description"
                                    className="pl-9"
                                />
                            </div>
                            <NativeSelect
                                name="category_id"
                                defaultValue={filters.category_id ?? ''}
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </NativeSelect>
                            <Button variant="outline">Filter</Button>
                            {(filters.search || filters.category_id) && (
                                <Button variant="ghost" asChild>
                                    <Link href={index()}>Reset</Link>
                                </Button>
                            )}
                        </Form>

                        <div className="flex rounded-lg border bg-muted/50 p-1">
                            <Button
                                type="button"
                                variant={
                                    view === 'grid' ? 'secondary' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setView('grid')}
                                aria-label="Grid view"
                            >
                                <Grid2X2 />
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    view === 'list' ? 'secondary' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setView('list')}
                                aria-label="List view"
                            >
                                <List />
                            </Button>
                        </div>
                    </div>

                    {view === 'grid' ? (
                        <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {products.data.map((product) => (
                                <article
                                    key={product.id}
                                    className="group overflow-hidden rounded-2xl border bg-background/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-emerald-950/30 dark:to-slate-900">
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
                                        <div className="absolute top-3 right-3">
                                            <StatusBadge
                                                active={product.is_active}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-5">
                                        <div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300">
                                                    {product.sku}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {product.category?.name ??
                                                        'Uncategorized'}
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
                                            <span className="text-muted-foreground">
                                                Reorder at{' '}
                                                <strong className="text-foreground">
                                                    {Number(
                                                        product.reorder_level,
                                                    ).toLocaleString()}
                                                </strong>
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() =>
                                                    openEditModal(product)
                                                }
                                            >
                                                <Pencil />
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    setDeletingProduct(product);
                                                    deleteForm.clearErrors();
                                                    setDeleteModalOpen(true);
                                                }}
                                                aria-label={`Delete ${product.name}`}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Unit
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Reorder level
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.data.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-12 overflow-hidden rounded-lg bg-muted">
                                                        {product.image_url ? (
                                                            <img
                                                                src={
                                                                    product.image_url
                                                                }
                                                                alt=""
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            <PackageOpen className="m-3 size-6 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {product.name}
                                                        </p>
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            {product.sku}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {product.category?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {product.unit}
                                            </td>
                                            <td className="px-4 py-3">
                                                {Number(
                                                    product.reorder_level,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    active={product.is_active}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEditModal(
                                                                product,
                                                            )
                                                        }
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => {
                                                            setDeletingProduct(
                                                                product,
                                                            );
                                                            deleteForm.clearErrors();
                                                            setDeleteModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {products.data.length === 0 && (
                        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-muted-foreground">
                            <PackageOpen className="size-12 opacity-40" />
                            <div>
                                <p className="font-medium text-foreground">
                                    No products found
                                </p>
                                <p className="mt-1 text-sm">
                                    Try changing the search or category filter.
                                </p>
                            </div>
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

            <Dialog
                open={formModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeFormModal();
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Edit product' : 'Add product'}
                        </DialogTitle>
                        <DialogDescription>
                            Add a clear image so inventory officers can
                            recognize this product quickly.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitProduct} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                            <div className="aspect-square overflow-hidden rounded-2xl border bg-muted">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Product preview"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <ImagePlus className="size-10" />
                                        <span className="text-xs">
                                            Image preview
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="grid content-center gap-2">
                                <Label htmlFor="product-image">
                                    Product image
                                </Label>
                                <Input
                                    id="product-image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) =>
                                        chooseImage(event.target.files?.[0])
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, or WebP up to 4 MB.
                                </p>
                                <InputError message={form.errors.image} />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="product-sku">SKU</Label>
                                <Input
                                    id="product-sku"
                                    value={form.data.sku}
                                    onChange={(event) =>
                                        form.setData('sku', event.target.value)
                                    }
                                    placeholder="OFF-0001"
                                    required
                                />
                                <InputError message={form.errors.sku} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="product-category">
                                    Category
                                </Label>
                                <NativeSelect
                                    id="product-category"
                                    value={form.data.category_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'category_id',
                                            event.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="" disabled>
                                        Select a category
                                    </option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                            disabled={
                                                category.is_active === false &&
                                                Number(
                                                    form.data.category_id,
                                                ) !== category.id
                                            }
                                        >
                                            {category.name}
                                            {category.is_active === false
                                                ? ' (Inactive)'
                                                : ''}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={form.errors.category_id} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="product-name">Product name</Label>
                            <Input
                                id="product-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="A4 Copy Paper"
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="product-unit">Unit</Label>
                                <NativeSelect
                                    id="product-unit"
                                    value={form.data.unit}
                                    onChange={(event) =>
                                        form.setData('unit', event.target.value)
                                    }
                                    required
                                >
                                    {[
                                        'piece',
                                        'box',
                                        'pack',
                                        'ream',
                                        'set',
                                        'unit',
                                    ].map((unit) => (
                                        <option
                                            key={unit}
                                            value={unit}
                                            className="capitalize"
                                        >
                                            {unit}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={form.errors.unit} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="product-reorder">
                                    Reorder level
                                </Label>
                                <Input
                                    id="product-reorder"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.reorder_level}
                                    onChange={(event) =>
                                        form.setData(
                                            'reorder_level',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={form.errors.reorder_level}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="product-description">
                                Description
                            </Label>
                            <Textarea
                                id="product-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Product specifications or identifying details"
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                id="product-active"
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                                className="size-4 accent-emerald-600"
                            />
                            <Label htmlFor="product-active">
                                Active product
                            </Label>
                        </div>
                        <InputError message={form.errors.is_active} />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeFormModal}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Saving...'
                                    : editingProduct
                                      ? 'Save changes'
                                      : 'Add product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete product</DialogTitle>
                        <DialogDescription>
                            Delete <strong>{deletingProduct?.name}</strong>? Its
                            uploaded image will also be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteProduct}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing
                                ? 'Deleting...'
                                : 'Delete product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductIndex.layout = { breadcrumbs: [{ title: 'Products', href: index() }] };
