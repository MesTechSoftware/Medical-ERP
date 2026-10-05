import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkLock, logAttempt, recordFailure, reset } from "@/lib/rate-limit";
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
        if (checkLock(email).locked) {
          logAttempt(null, "kilitli");
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        // OPERASYON'un davranışı 1B madde 3'te doğar (GÇ-7); o güne kadar giriş yapamaz.
        if (!user || !user.isActive || user.role === "OPERASYON") {
          recordFailure(email);
          logAttempt(user?.id ?? null, "hatali_kimlik");
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
          logAttempt(user.id, "hatali_kimlik");
          await createAuditLog({
            action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
            entityType: "Auth",
            entityId: email,
          });
          return null;
        }

        reset(email);
        logAttempt(user.id, "basarili");
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
