import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkLock, recordFailure, reset } from "@/lib/rate-limit";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import type { Role } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Brute-force koruması (tek enforcement noktası: ham endpoint dahil).
        if (checkLock(email).locked) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE") {
          recordFailure(email);
          await createAuditLog({
            action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
            entityType: "Auth",
            entityId: email,
          });
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          recordFailure(email);
          await createAuditLog({
            action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
            entityType: "Auth",
            entityId: email,
          });
          return null;
        }

        reset(email);
        await createAuditLog({
          actorId: user.id,
          action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
          entityType: "Auth",
          entityId: user.id,
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
