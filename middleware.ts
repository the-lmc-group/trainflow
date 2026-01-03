import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip || "127.0.0.1";
  const limit = 60; // 60 requests per minute
  const windowMs = 60 * 1000; // 1 minute

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, {
      count: 0,
      lastReset: Date.now(),
    });
  }

  const ipData = rateLimit.get(ip);

  if (Date.now() - ipData.lastReset > windowMs) {
    ipData.count = 0;
    ipData.lastReset = Date.now();
  }

  if (ipData.count >= limit) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  ipData.count += 1;

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
