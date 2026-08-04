import { Form, Head, Link, useForm } from '@inertiajs/react';
import { Mail, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { destroy, index, store, update } from '@/routes/suppliers';

import type { Paginated, Supplier } from '@/types';

type SupplierFormData = {
    code: string;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    is_active: boolean;
};

export default function SupplierIndex({
    suppliers,
    filters,
}: {
    suppliers: Paginated<Supplier>;
    filters: {
        search: string;
    };
}) {
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(
        null,
    );

    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(
        null,
    );

    const form = useForm<SupplierFormData>({
        code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        is_active: true,
    });
    const deleteForm = useForm({});
    const returnQuery = {
        query: {
            return_search: filters.search || undefined,
            return_page:
                suppliers.current_page > 1 ? suppliers.current_page : undefined,
        },
    };

    function openCreateModal(): void {
        setEditingSupplier(null);

        form.setData({
            code: '',
            name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            is_active: true,
        });

        form.clearErrors();
        setFormModalOpen(true);
    }

    function openEditModal(supplier: Supplier): void {
        setEditingSupplier(supplier);

        form.setData({
            code: supplier.code,
            name: supplier.name,
            contact_person: supplier.contact_person ?? '',
            email: supplier.email ?? '',
            phone: supplier.phone ?? '',
            address: supplier.address ?? '',
            is_active: supplier.is_active,
        });

        form.clearErrors();
        setFormModalOpen(true);
    }

    function closeFormModal(): void {
        setFormModalOpen(false);
        setEditingSupplier(null);
        form.reset();
        form.clearErrors();
    }

    function submitSupplier(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeFormModal(),
        };

        if (editingSupplier) {
            form.put(update.url(editingSupplier, returnQuery), options);

            return;
        }

        form.post(store.url(returnQuery), options);
    }

    function openDeleteModal(supplier: Supplier): void {
        setDeletingSupplier(supplier);
        deleteForm.clearErrors();
        setDeleteModalOpen(true);
    }

    function closeDeleteModal(): void {
        setDeleteModalOpen(false);
        setDeletingSupplier(null);
    }

    function deleteSupplier(): void {
        if (!deletingSupplier) {
            return;
        }

        deleteForm.delete(destroy.url(deletingSupplier, returnQuery), {
            preserveScroll: true,
            onSuccess: () => closeDeleteModal(),
        });
    }

    return (
        <>
            <Head title="Suppliers" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Suppliers
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage suppliers and their contact information.
                        </p>
                    </div>

                    <Button onClick={openCreateModal}>
                        <Plus className="size-4" />
                        New supplier
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
                                placeholder="Search suppliers"
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
                                        Code
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Supplier
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Contact person
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Contact details
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
                                {suppliers.data.map((supplier) => (
                                    <tr
                                        key={supplier.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {supplier.code}
                                        </td>

                                        <td className="px-4 py-3 font-medium">
                                            {supplier.name}
                                        </td>

                                        <td className="px-4 py-3 text-muted-foreground">
                                            {supplier.contact_person || '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="space-y-1 text-muted-foreground">
                                                {supplier.email && (
                                                    <a
                                                        href={`mailto:${supplier.email}`}
                                                        className="flex items-center gap-1.5 hover:text-foreground"
                                                    >
                                                        <Mail className="size-3.5" />
                                                        {supplier.email}
                                                    </a>
                                                )}

                                                <p>{supplier.phone || '—'}</p>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                active={supplier.is_active}
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openEditModal(supplier)
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            supplier,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {suppliers.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center text-muted-foreground"
                                        >
                                            No suppliers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={suppliers.links}
                        from={suppliers.from}
                        to={suppliers.to}
                        total={suppliers.total}
                    />
                </div>
            </div>

            {/* Create and Edit Supplier Modal */}
            <Dialog
                open={formModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeFormModal();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? 'Edit supplier' : 'New supplier'}
                        </DialogTitle>

                        <DialogDescription>
                            {editingSupplier
                                ? 'Update the supplier information.'
                                : 'Add a new supplier to the system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitSupplier} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="supplier-code">
                                    Supplier code
                                </Label>

                                <Input
                                    id="supplier-code"
                                    value={form.data.code}
                                    onChange={(event) =>
                                        form.setData('code', event.target.value)
                                    }
                                    placeholder="SUP-001"
                                    required
                                />

                                <InputError message={form.errors.code} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="supplier-name">
                                    Supplier name
                                </Label>

                                <Input
                                    id="supplier-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder="Supplier business name"
                                    required
                                />

                                <InputError message={form.errors.name} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="supplier-contact">
                                    Contact person
                                </Label>

                                <Input
                                    id="supplier-contact"
                                    value={form.data.contact_person}
                                    onChange={(event) =>
                                        form.setData(
                                            'contact_person',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Full name"
                                />

                                <InputError
                                    message={form.errors.contact_person}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="supplier-phone">Phone</Label>

                                <Input
                                    id="supplier-phone"
                                    value={form.data.phone}
                                    onChange={(event) =>
                                        form.setData(
                                            'phone',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Contact number"
                                />

                                <InputError message={form.errors.phone} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="supplier-email">
                                Email address
                            </Label>

                            <Input
                                id="supplier-email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                placeholder="supplier@example.com"
                            />

                            <InputError message={form.errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="supplier-address">Address</Label>

                            <Textarea
                                id="supplier-address"
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                                placeholder="Complete business address"
                            />

                            <InputError message={form.errors.address} />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                id="supplier-active"
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

                            <Label htmlFor="supplier-active">
                                Active supplier
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
                                    : editingSupplier
                                      ? 'Save changes'
                                      : 'Create supplier'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Supplier Modal */}
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
                        <DialogTitle>Delete supplier</DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{deletingSupplier?.name}</strong>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDeleteModal}>
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={deleteSupplier}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing
                                ? 'Deleting...'
                                : 'Delete supplier'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SupplierIndex.layout = {
    breadcrumbs: [
        {
            title: 'Suppliers',
            href: index(),
        },
    ],
};
