import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compareSync } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.passwordHash) {
          throw new Error("This account uses Google login. Please sign in with Google.");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        const isPasswordValid = compareSync(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (!existing) {
            // New user via Google — create their account automatically
            const googleProfile = profile as { given_name?: string; family_name?: string } | undefined;
            await prisma.user.create({
              data: {
                email: user.email!,
                emailVerified: new Date(),
                passwordHash: null,
                firstName: googleProfile?.given_name ?? user.name?.split(" ")[0] ?? "Student",
                lastName: googleProfile?.family_name ?? (user.name?.split(" ").slice(1).join(" ") || ""),
                gradeLevel: "11",
                avatarUrl: user.image ?? undefined,
              },
            });
          } else if (!existing.emailVerified) {
            // Auto-verify existing unverified account when they sign in with Google
            await prisma.user.update({
              where: { id: existing.id },
              data: { emailVerified: new Date() },
            });
          }
          return true;
        } catch (err) {
          console.error("[Google OAuth] Failed to create/update user:", err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google") {
        // Google OAuth: look up our DB user by email to get our internal ID + role
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true, subscriptionTier: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.subscriptionTier = dbUser.subscriptionTier;
        }
        return token;
      }

      if (user) {
        // Credentials sign-in: populate token from DB
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { subscriptionTier: true },
        });
        token.subscriptionTier = dbUser?.subscriptionTier ?? "FREE";
      } else if (trigger === "update" && token.id) {
        // useSession().update() called (e.g. post-payment activation) — re-sync tier from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { subscriptionTier: true },
        });
        if (dbUser) token.subscriptionTier = dbUser.subscriptionTier;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      subscriptionTier: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    subscriptionTier: string;
  }
}
