import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const cookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.includes("next-auth") || name.includes("__Secure"));

  return NextResponse.json({
    host: request.headers.get("host"),
    nextAuthUrl: process.env.NEXTAUTH_URL || null,
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    hasOwnerPassword: Boolean(process.env.OWNER_PASSWORD),
    authCookieNames: cookieNames,
    hasToken: Boolean(token),
    tokenSub: token?.sub || null,
    tokenRole: typeof token?.role === "string" ? token.role : null,
  });
}
