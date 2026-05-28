import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      approved: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    approved: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    approved?: boolean;
  }
}
