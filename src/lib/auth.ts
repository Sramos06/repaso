import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 90 }, // login once ≈ 90 days
  pages: { signIn: "/signin" },
  callbacks: {
    // hard allow-list: only Shawn's account may create a session
    // (case-insensitive: Google can return email with different casing than the env var)
    signIn({ profile }) {
      const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
      const email = profile?.email?.toLowerCase();
      if (!allowed || !email) return false;
      return email === allowed;
    },
    jwt({ token, profile }) {
      if (profile?.sub) token.googleSub = profile.sub;
      return token;
    },
    session({ session, token }) {
      // Narrow cast (not `any`): stamps the JWT's googleSub onto the session
      // object so requireUser/getUserTheme can read it without a DB round trip.
      if (token.googleSub) (session as { googleSub?: unknown }).googleSub = token.googleSub;
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
