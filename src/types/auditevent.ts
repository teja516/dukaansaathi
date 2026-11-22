// Auto-generated from the reviewed schema — canonical AuditEvent shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface AuditEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}
