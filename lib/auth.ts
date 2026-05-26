import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const password = credentials?.password;
        const ownerPassword = process.env.OWNER_PASSWORD;

        if (!ownerPassword) {
          throw new Error("OWNER_PASSWORD не настроен.");
        }

        if (password && password === ownerPassword) {
          return {
            id: "owner",
            name: "Owner",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = "owner";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = "Owner";
      }

      session.user = {
        ...session.user,
        role: token.role as string,
      };

      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
