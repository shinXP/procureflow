import { useForm } from '@inertiajs/react';
import { CalendarDays, PackageOpen, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
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
import { store, update } from '@/routes/purchase-requests';
import type { Product, PurchaseRequest } from '@/types';

type RequestItemInput = {
    product_id: number | '';
    quantity: string;
    notes: string;
};

type ReturnLocation = {
    search: string;
    status: string;
    page: number;
};

type PurchaseRequestFormData = {
    purpose: string;
    needed_at: string;
    items: RequestItemInput[];
    return_search: string;
    return_status: string;
    return_page: number;
};

const maximumItems = 50;

const emptyItem = (): RequestItemInput => ({
    product_id: '',
    quantity: '1',
    notes: '',
});

function dateInputValue(value: string | null | undefined): string {
    return value ? value.slice(0, 10) : '';
}

function localToday(): string {
    const today = new Date();
    const localTime = new Date(
        today.getTime() - today.getTimezoneOffset() * 60_000,
    );

    return localTime.toISOString().slice(0, 10);
}

export function PurchaseRequestFormDialog({
    open,
    onOpenChange,
    products,
    purchaseRequest = null,
    initialProducts = [],
    returnTo = { search: '', status: '', page: 1 },
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
    purchaseRequest?: PurchaseRequest | null;
    initialProducts?: Product[];
    returnTo?: ReturnLocation;
    onSaved?: () => void;
}) {
    const activeProducts = products.filter((product) => product.is_active);
    const initialItems: RequestItemInput[] = purchaseRequest
        ? purchaseRequest.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              notes: item.notes ?? '',
          }))
        : initialProducts.map((product) => ({
              product_id: product.id,
              quantity: '1',
              notes: '',
          }));

    const form = useForm<PurchaseRequestFormData>({
        purpose: purchaseRequest?.purpose ?? '',
        needed_at: dateInputValue(purchaseRequest?.needed_at),
        items: initialItems.length > 0 ? initialItems : [emptyItem()],
        return_search: returnTo.search,
        return_status: returnTo.status,
        return_page: returnTo.page,
    });

    const selectedProductIds = form.data.items
        .map((item) => item.product_id)
        .filter((productId): productId is number => productId !== '');
    const hasDuplicateProducts =
        new Set(selectedProductIds).size !== selectedProductIds.length;
    const isIncomplete =
        !form.data.purpose.trim() ||
        !form.data.needed_at ||
        form.data.items.length === 0 ||
        form.data.items.length > maximumItems ||
        form.data.items.some(
            (item) =>
                item.product_id === '' ||
                !item.quantity ||
                Number(item.quantity) <= 0,
        );

    function addItem(): void {
        form.setData('items', [...form.data.items, emptyItem()]);
    }

    function updateItem(
        index: number,
        field: keyof RequestItemInput,
        value: string | number,
    ): void {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
        form.clearErrors(
            `items.${index}.${field}` as keyof typeof form.errors,
            'items',
        );
    }

    function removeItem(index: number): void {
        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
        form.clearErrors();
    }

    function submitForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                onSaved?.();
            },
        };

        if (purchaseRequest) {
            form.put(
                update({
                    purchase_request: purchaseRequest.id,
                }).url,
                options,
            );

            return;
        }

        form.post(store.url(), options);
    }

    function handleOpenChange(nextOpen: boolean): void {
        if (!form.processing) {
            onOpenChange(nextOpen);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="overflow-hidden p-0 sm:max-w-4xl">
                <form
                    onSubmit={submitForm}
                    className="flex max-h-[92vh] flex-col"
                >
                    <DialogHeader className="border-b bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-6 pr-12">
                        <DialogTitle>
                            {purchaseRequest
                                ? `Edit ${purchaseRequest.reference}`
                                : 'Create purchase request'}
                        </DialogTitle>
                        <DialogDescription>
                            {purchaseRequest
                                ? 'Update the items and delivery date, then save your changes before submitting.'
                                : 'Build your request now and save it as a draft. You can review and submit it from My requests.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
                        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                            <div className="grid gap-2">
                                <Label htmlFor="request-purpose">
                                    Business purpose
                                </Label>
                                <Textarea
                                    id="request-purpose"
                                    value={form.data.purpose}
                                    onChange={(event) =>
                                        form.setData(
                                            'purpose',
                                            event.target.value,
                                        )
                                    }
                                    onFocus={() => form.clearErrors('purpose')}
                                    placeholder="Explain why these products are needed"
                                    rows={3}
                                    maxLength={2000}
                                    aria-invalid={Boolean(form.errors.purpose)}
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <InputError message={form.errors.purpose} />
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {form.data.purpose.length}/2000
                                    </span>
                                </div>
                            </div>

                            <div className="grid content-start gap-2">
                                <Label
                                    htmlFor="request-needed-at"
                                    className="flex items-center gap-1.5"
                                >
                                    <CalendarDays className="size-4" />
                                    Needed by
                                </Label>
                                <Input
                                    id="request-needed-at"
                                    type="date"
                                    min={localToday()}
                                    value={form.data.needed_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'needed_at',
                                            event.target.value,
                                        )
                                    }
                                    onFocus={() =>
                                        form.clearErrors('needed_at')
                                    }
                                    required
                                    aria-invalid={Boolean(
                                        form.errors.needed_at,
                                    )}
                                />
                                <InputError message={form.errors.needed_at} />
                            </div>
                        </div>

                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">
                                        Requested products
                                    </h3>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Choose each product only once and enter
                                        the exact quantity needed (
                                        {form.data.items.length}/{maximumItems}
                                        ).
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    disabled={
                                        form.data.items.length >=
                                            maximumItems ||
                                        selectedProductIds.length >=
                                            activeProducts.length
                                    }
                                >
                                    <Plus /> Add product
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {form.data.items.map((item, index) => {
                                    const selectedProduct = activeProducts.find(
                                        (product) =>
                                            product.id === item.product_id,
                                    );
                                    const unavailableItem =
                                        purchaseRequest?.items.find(
                                            (requestItem) =>
                                                requestItem.product_id ===
                                                item.product_id,
                                        );

                                    return (
                                        <div
                                            key={`${index}-${item.product_id}`}
                                            className="rounded-2xl border bg-muted/20 p-4"
                                        >
                                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_130px_auto] md:items-start">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor={`request-product-${index}`}
                                                    >
                                                        Product
                                                    </Label>
                                                    <div className="flex gap-3">
                                                        <div className="hidden size-10 shrink-0 overflow-hidden rounded-lg border bg-background sm:flex sm:items-center sm:justify-center">
                                                            {selectedProduct?.image_url ? (
                                                                <img
                                                                    src={
                                                                        selectedProduct.image_url
                                                                    }
                                                                    alt=""
                                                                    className="size-full object-cover"
                                                                />
                                                            ) : (
                                                                <PackageOpen className="size-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <NativeSelect
                                                            id={`request-product-${index}`}
                                                            value={
                                                                item.product_id
                                                            }
                                                            onChange={(event) =>
                                                                updateItem(
                                                                    index,
                                                                    'product_id',
                                                                    event.target
                                                                        .value
                                                                        ? Number(
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                          )
                                                                        : '',
                                                                )
                                                            }
                                                            aria-invalid={Boolean(
                                                                form.errors[
                                                                    `items.${index}.product_id`
                                                                ],
                                                            )}
                                                        >
                                                            <option value="">
                                                                Select a product
                                                            </option>
                                                            {!selectedProduct &&
                                                                unavailableItem && (
                                                                    <option
                                                                        value={
                                                                            unavailableItem.product_id
                                                                        }
                                                                        disabled
                                                                    >
                                                                        {
                                                                            unavailableItem.product_name
                                                                        }{' '}
                                                                        —
                                                                        unavailable
                                                                    </option>
                                                                )}
                                                            {activeProducts
                                                                .filter(
                                                                    (product) =>
                                                                        product.id ===
                                                                            item.product_id ||
                                                                        !selectedProductIds.includes(
                                                                            product.id,
                                                                        ),
                                                                )
                                                                .map(
                                                                    (
                                                                        product,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                product.id
                                                                            }
                                                                            value={
                                                                                product.id
                                                                            }
                                                                        >
                                                                            {
                                                                                product.sku
                                                                            }{' '}
                                                                            —{' '}
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                        </NativeSelect>
                                                    </div>
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                `items.${index}.product_id`
                                                            ]
                                                        }
                                                    />
                                                    {selectedProduct && (
                                                        <p className="text-xs text-muted-foreground sm:pl-[52px]">
                                                            Issued per{' '}
                                                            {
                                                                selectedProduct.unit
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor={`request-quantity-${index}`}
                                                    >
                                                        Quantity
                                                    </Label>
                                                    <Input
                                                        id={`request-quantity-${index}`}
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(event) =>
                                                            updateItem(
                                                                index,
                                                                'quantity',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        aria-invalid={Boolean(
                                                            form.errors[
                                                                `items.${index}.quantity`
                                                            ],
                                                        )}
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                `items.${index}.quantity`
                                                            ]
                                                        }
                                                    />
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="mt-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        removeItem(index)
                                                    }
                                                    aria-label={`Remove product row ${index + 1}`}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>

                                            <div className="mt-3 grid gap-2 sm:pl-[52px] md:pr-[174px]">
                                                <Label
                                                    htmlFor={`request-note-${index}`}
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    Item note (optional)
                                                </Label>
                                                <Input
                                                    id={`request-note-${index}`}
                                                    value={item.notes}
                                                    onChange={(event) =>
                                                        updateItem(
                                                            index,
                                                            'notes',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Specifications, size, or other details"
                                                    maxLength={500}
                                                />
                                                <InputError
                                                    message={
                                                        form.errors[
                                                            `items.${index}.notes`
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                {form.data.items.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-sm text-muted-foreground transition hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-foreground"
                                    >
                                        <PackageOpen className="size-8 opacity-50" />
                                        Add the first product to this request
                                    </button>
                                )}
                            </div>

                            <InputError message={form.errors.items} />
                            <InputError
                                message={
                                    form.errors[
                                        'status' as keyof typeof form.errors
                                    ]
                                }
                            />
                            {hasDuplicateProducts && (
                                <InputError message="Each product may only be selected once." />
                            )}
                        </section>
                    </div>

                    <DialogFooter className="border-t bg-muted/20 p-4 sm:p-5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                isIncomplete ||
                                hasDuplicateProducts
                            }
                        >
                            {form.processing
                                ? 'Saving...'
                                : purchaseRequest
                                  ? 'Save changes'
                                  : 'Save as draft'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
