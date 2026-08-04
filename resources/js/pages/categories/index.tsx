import { Form, Head, Link, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { destroy, index, store, update } from '@/routes/categories';

import type { Category, Paginated } from '@/types';

type CategoryFormData = {
    name: string;
    description: string;
    is_active: boolean;
};

export default function CategoryIndex({
    categories,
    filters,
}: {
    categories: Paginated<Category>;
    filters: {
        search: string;
    };
}) {
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );

    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null,
    );

    const form = useForm<CategoryFormData>({
        name: '',
        description: '',
        is_active: true,
    });
    const deleteForm = useForm({});
    const returnQuery = {
        query: {
            return_search: filters.search || undefined,
            return_page:
                categories.current_page > 1
                    ? categories.current_page
                    : undefined,
        },
    };

    function openCreateModal(): void {
        setEditingCategory(null);

        form.setData({
            name: '',
            description: '',
            is_active: true,
        });

        form.clearErrors();
        setFormModalOpen(true);
    }

    function openEditModal(category: Category): void {
        setEditingCategory(category);

        form.setData({
            name: category.name,
            description: category.description ?? '',
            is_active: category.is_active,
        });

        form.clearErrors();
        setFormModalOpen(true);
    }

    function closeFormModal(): void {
        setFormModalOpen(false);
        setEditingCategory(null);
        form.reset();
        form.clearErrors();
    }

    function submitCategory(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeFormModal(),
        };

        if (editingCategory) {
            form.put(update.url(editingCategory, returnQuery), options);

            return;
        }

        form.post(store.url(returnQuery), options);
    }

    function openDeleteModal(category: Category): void {
        setDeletingCategory(category);
        deleteForm.clearErrors();
        setDeleteModalOpen(true);
    }

    function closeDeleteModal(): void {
        setDeleteModalOpen(false);
        setDeletingCategory(null);
    }

    function deleteCategory(): void {
        if (!deletingCategory) {
            return;
        }

        deleteForm.delete(destroy.url(deletingCategory, returnQuery), {
            preserveScroll: true,
            onSuccess: () => closeDeleteModal(),
        });
    }

    return (
        <>
            <Head title="Categories" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Categories
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Organize products into purchasing and inventory
                            groups.
                        </p>
                    </div>

                    <Button onClick={openCreateModal}>
                        <Plus className="size-4" />
                        New category
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <Form
                        {...index.form()}
                        className="flex flex-col gap-3 border-b p-4 sm:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />

                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search categories"
                                className="pl-9"
                            />
                        </div>

                        <Button variant="outline">Search</Button>

                        {filters.search && (
                            <Button variant="ghost" asChild>
                                <Link href={index()}>Reset</Link>
                            </Button>
                        )}
                    </Form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Name
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Description
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Products
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
                                {categories.data.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {category.name}
                                        </td>

                                        <td className="max-w-sm px-4 py-3 text-muted-foreground">
                                            {category.description || '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            {category.products_count ?? 0}
                                        </td>

                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                active={category.is_active}
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openEditModal(category)
                                                    }
                                                    aria-label={`Edit ${category.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            category,
                                                        )
                                                    }
                                                    aria-label={`Delete ${category.name}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {categories.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-12 text-center text-muted-foreground"
                                        >
                                            No categories found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={categories.links}
                        from={categories.from}
                        to={categories.to}
                        total={categories.total}
                    />
                </div>
            </div>

            {/* Create and Edit Modal */}
            <Dialog
                open={formModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeFormModal();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit category' : 'New category'}
                        </DialogTitle>

                        <DialogDescription>
                            {editingCategory
                                ? 'Update the selected category information.'
                                : 'Create a new product category.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCategory} className="space-y-5">
                        <div className="grid gap-2">
                            <Label htmlFor="category-name">Category name</Label>

                            <Input
                                id="category-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Example: Office Supplies"
                                autoFocus
                                required
                                aria-invalid={Boolean(form.errors.name)}
                            />

                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category-description">
                                Description
                            </Label>

                            <Textarea
                                id="category-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Brief description of the category"
                                aria-invalid={Boolean(form.errors.description)}
                            />

                            <InputError message={form.errors.description} />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                id="category-active"
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                                className="size-4 rounded border-input accent-emerald-600"
                            />

                            <Label htmlFor="category-active">
                                Active category
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
                                    : editingCategory
                                      ? 'Save changes'
                                      : 'Create category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeleteModal();
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete category</DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{deletingCategory?.name}</strong>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeDeleteModal}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={deleteCategory}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing
                                ? 'Deleting...'
                                : 'Delete category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: index(),
        },
    ],
};
