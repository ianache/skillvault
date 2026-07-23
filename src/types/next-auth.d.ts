import type { DefaultSession } from "next-auth";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: string[];
    };
    idToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    idToken?: string;
  }
}
