export { default } from "next-auth/middleware";

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
