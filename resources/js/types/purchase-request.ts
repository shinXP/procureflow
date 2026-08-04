export type PurchaseRequestStatus =
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'converted_to_purchase_order';

export type PurchaseRequestPermissions = {
    update?: boolean;
    delete?: boolean;
    submit?: boolean;
    decide?: boolean;
};

export type PurchaseRequestDecisionType = 'approved' | 'rejected';

export type PurchaseRequestDecision = {
    id: number;
    purchase_request_id: number;
    decision: PurchaseRequestDecisionType;
    remarks: string | null;
    decided_by: number;
    decided_at: string;
    created_at: string;
    updated_at: string;
    reviewer: {
        id: number;
        name: string;
        email: string;
        avatar?: string | null;
        avatar_path?: string | null;
    };
};

export type PurchaseRequestItem = {
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    unit: string;
    quantity: string;
    notes: string | null;
};

export type PurchaseRequest = {
    id: number;
    reference: string;
    purpose: string;
    status: PurchaseRequestStatus;
    needed_at: string | null;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
    items_count: number;
    items: PurchaseRequestItem[];
    decisions: PurchaseRequestDecision[];
    requester: {
        id: number;
        name: string;
        email: string;
        avatar?: string | null;
    };
    can: PurchaseRequestPermissions;
};

export type PurchaseRequestCounts = Record<PurchaseRequestStatus, number>;

export type ApprovalStatus = Exclude<PurchaseRequestStatus, 'draft'>;

export type PurchaseRequestApprovalCounts = Record<ApprovalStatus, number>;
