// Auto-generated from the reviewed schema — canonical Customer shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Customer {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  name: string;
  phoneNumber?: string | null;
  notes?: string | null;
  isSample?: boolean | null;
}
