import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/api/products/:path*",
    "/api/orders/:path*",
    "/api/publish/:path*",
    "/api/settings/:path*",
    "/api/rates/:path*",
  ],
};
