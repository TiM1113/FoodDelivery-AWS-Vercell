import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtVerify } from "jose";

const API_URL = process.env.API_URL ?? "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const res = await fetch(`${API_URL}/api/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) return null;

          const data = await res.json();
          if (!data.success) return null;

          // Prefer userId from body; fall back to decoding the Set-Cookie JWT
          let userId = data.userId ? String(data.userId) : undefined;

          if (!userId) {
            const setCookie = res.headers.getSetCookie?.() ?? [];
            const tokenCookie = setCookie
              .find((c) => c.startsWith("token="))
              ?.split(";")[0]
              ?.slice("token=".length);
            if (tokenCookie) {
              try {
                const { payload } = await jwtVerify(tokenCookie, JWT_SECRET);
                userId = String(payload.id);
              } catch {
                /* JWT decode failed — userId stays undefined */
              }
            }
          }

          if (!userId) return null;

          return {
            id: userId,
            name: data.name ?? "",
            email: String(credentials.email),
            role: data.role as string,
          };
        } catch {
          clearTimeout(timeoutId);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
