import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@acme/db";

import { loginOrSignin } from "./authorize";

/**
 * Module augmentation for `next-auth` types
 * Allows us to add custom properties to the `session` object
 * and keep type safety
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 **/
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure
 * adapters, providers, callbacks, etc.
 * @see https://next-auth.js.org/configuration/options
 **/
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  // Include user.id on session
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: loginOrSignin(prisma),
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    //     DiscordProvider({
    //       clientId: process.env.DISCORD_CLIENT_ID as string,
    //       clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    //     }),
    //     /**
    //      * ...add more providers here
    //      *
    //      * Most other providers require a bit more work than the Discord provider.
    //      * For example, the GitHub provider requires you to add the
    //      * `refresh_token_expires_in` field to the Account model. Refer to the
    //      * NextAuth.js docs for the provider you want to use. Example:
    //      * @see https://next-auth.js.org/providers/github
    //      **/
  ],
};
