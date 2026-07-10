import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 90 }, // login once ≈ 90 days
  pages: { signIn: "/signin" },
  callbacks: {
    // hard allow-list: only Shawn's account may create a session
    signIn({ profile }) {
      return profile?.email === process.env.ALLOWED_EMAIL;
    },
    jwt({ token, profile }) {
      if (profile?.sub) token.googleSub = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (token.googleSub) (session as any).googleSub = token.googleSub;
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
