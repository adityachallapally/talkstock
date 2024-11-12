// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [GitHub, Google],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Use an absolute URL here
        const baseUrl = process.env.NEXTAUTH_URL;
        const res = await fetch(`${baseUrl}/api/create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user, account }),
        });
        if (!res.ok) {
          console.error("Failed to create/update user");
          return false; // Prevent sign in if user creation/update fails
        }
      }
      return true;
    },
  },
});