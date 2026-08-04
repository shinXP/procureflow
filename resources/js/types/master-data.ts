export type Category = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    products_count?: number;
    created_at: string;
    updated_at: string;
};

export type CategoryOption = Pick<Category, 'id' | 'name'> & {
    is_active?: boolean;
};

export type Product = {
    id: number;
    category_id: number;
    category?: CategoryOption;
    sku: string;
    name: string;
    description: string | null;
    image_path: string | null;
    image_url: string | null;
    unit: string;
    reorder_level: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Supplier = {
    id: number;
    code: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};
