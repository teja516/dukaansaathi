// Auto-generated from the reviewed schema — canonical Supplier shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Supplier {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  name: string;
  phoneNumber?: string | null;
  notes?: string | null;
  isSample?: boolean | null;
}
