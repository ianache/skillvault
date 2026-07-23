export type AppRole = "admin" | "author" | "reviewer";

export const APP_ROLES: AppRole[] = ["admin", "author", "reviewer"];

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  active: boolean;
  roles: AppRole[];
  lastLoginAt: number;
  createdAt: number;
  updatedAt: number;
}
