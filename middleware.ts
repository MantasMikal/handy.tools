import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "5 s"),
});

export async function middleware(request: NextRequest) {
  console.log("Incoming request", request.url);
  // check if the request is a server action and apply the rate limiting then
  const ip = request.ip ?? "121.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return Response.json(
      { error: "You are making too many requests", details: "Rate limited." },
      { status: 429 }
    );
  }
}

export const config = {
  matcher: "/api/:path*",
};
