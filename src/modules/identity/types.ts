/**
 * identity module: types only.
 * Wire shapes for the users table and the /api/auth/* endpoints.
 * Dates are ISO strings and no secret fields are included, because this is what JSON carries.
 */

export type InterfaceLanguage = 'english' | 'hindi';

/** Public user shape returned by the API. Never includes passwordHash or reset/lockout internals. */
export type User = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  shopId: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
};

/** Alias used by UI and other modules when they only need the signed-in user. */
export type AuthUser = User;

/** Shop binding returned with the session. Shop details are owned by the shops module. */
export type AuthShop = {
  id: string;
  language: InterfaceLanguage;
};

/** GET /api/auth/me response, and PATCH /api/auth/me response body. */
export type AuthMeResponse = {
  user: AuthUser;
  shop: AuthShop | null;
};

/** POST /api/auth/register request body. */
export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

/** POST /api/auth/login request body. */
export type LoginInput = {
  email: string;
  password: string;
};

/** POST /api/auth/register and POST /api/auth/login response body. */
export type AuthSessionResponse = {
  user: AuthUser;
  token: string;
};

/** POST /api/auth/logout response body. */
export type LogoutResponse = {
  success: true;
};

/** PATCH /api/auth/me request body. Only name and email are self-editable. */
export type UpdateAuthMeInput = {
  name?: string;
  email?: string;
};

/** POST /api/auth/change-password request body. */
export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

/** POST /api/auth/change-password response body. */
export type ChangePasswordResponse = {
  success: true;
};

/** POST /api/auth/forgot-password request body. */
export type ForgotPasswordInput = {
  email: string;
};

/** POST /api/auth/forgot-password response body. Always the same message. */
export type ForgotPasswordResponse = {
  message: string;
};

/** POST /api/auth/reset-password request body. */
export type ResetPasswordInput = {
  token: string;
  password: string;
};

/** POST /api/auth/reset-password response body. */
export type ResetPasswordResponse = {
  success: true;
};

/** Standard error body for every identity endpoint. */
export type AuthErrorResponse = {
  error: string;
};

/** Public module contract: listUsers query. */
export type ListUsersQuery = {
  shopId?: string;
  page?: number;
  limit?: number;
};

/** Public module contract: listUsers result. */
export type ListUsersResult = {
  users: User[];
  total: number;
};

/** Public module contract: createUser input. Server sets id, timestamps and hash. */
export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  shopId?: string | null;
};

/** Public module contract: updateUser input. */
export type UpdateUserInput = {
  name?: string;
  email?: string;
  shopId?: string | null;
};