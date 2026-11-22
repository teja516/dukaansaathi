// Auto-generated from the reviewed schema — canonical User shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  shopId?: string | null;
  lastLoginAt?: string | null;
  failedLoginCount: number;
  lockedUntil?: string | null;
  sessionVersion: number;
  passwordChangedAt?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: string | null;
  passwordResetRequestedAt?: string | null;
  passwordResetUsedAt?: string | null;
  passwordResetFailedAttempts: number;
  passwordResetLockedUntil?: string | null;
}
