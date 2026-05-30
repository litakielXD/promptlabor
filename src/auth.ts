import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type PromptlaborAuthUser = {
  id: string;
  role: string;
  approved: boolean;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/api/auth",
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;
        if (!user.approved) throw new Error("PENDING_APPROVAL");

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved,
        };
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const promptlaborUser = user as PromptlaborAuthUser;
        token.id = promptlaborUser.id;
        token.role = promptlaborUser.role;
        token.approved = promptlaborUser.approved;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        const promptlaborUser = session.user as typeof session.user & {
          role?: unknown;
          approved?: unknown;
        };
        promptlaborUser.role = typeof token.role === "string" ? token.role : "MEMBER";
        promptlaborUser.approved = token.approved === true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
