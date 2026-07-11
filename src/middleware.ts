export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|signin|manifest|icons|sw\\.js|icon\\.png|apple-icon\\.png).*)"],
};
