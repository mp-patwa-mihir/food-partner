/**
 * User role constants — intentionally kept free of any Node.js dependencies
 * so this file is safe to import in the Edge Runtime (middleware).
 */
export enum UserRole {
  CUSTOMER = "CUSTOMER",
  PROVIDER = "PROVIDER",
  ADMIN    = "ADMIN",
}
