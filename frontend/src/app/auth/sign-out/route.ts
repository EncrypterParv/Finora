import { createServerClient, DEFAULT_COOKIE_OPTIONS, isChunkLike } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.slice(0, -1);
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(host && origin === `${protocol}://${host}` && (!fetchSite || fetchSite === "same-origin"));
}

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403, headers });
  }

  const config = getSupabaseConfig();
  if (!config) return new NextResponse(null, { status: 503, headers });

  const response = new NextResponse(null, { status: 204, headers });
  const storageKey = `sb-${new URL(config.url).hostname.split(".")[0]}-auth-token`;
  const cookies = request.cookies.getAll();
  const sessionCookies = cookies.filter(({ name }) => isChunkLike(name, storageKey));

  // Expire this browser's session even when Supabase can't revoke it, and
  // never send a refreshed session back in a logout response.
  const expire = (name: string) =>
    response.cookies.set(name, "", { ...DEFAULT_COOKIE_OPTIONS, maxAge: 0 });

  for (const { name } of cookies) {
    if ([storageKey, `${storageKey}-user`, `${storageKey}-code-verifier`].some((key) => isChunkLike(name, key))) {
      expire(name);
    }
  }
  if (!sessionCookies.length) return response;

  const signal = AbortSignal.timeout(4_000);
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: { name: storageKey },
    cookies: {
      getAll: () => cookies,
      setAll: (changes) => {
        for (const { name, options } of changes) {
          if (options?.maxAge === 0) expire(name);
        }
      },
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal }),
    },
  });

  const timeout = new Promise<null>((resolve) => {
    signal.addEventListener("abort", () => resolve(null), { once: true });
  });
  try {
    const result = await Promise.race([supabase.auth.signOut({ scope: "local" }), timeout]);
    if (!result || result.error) {
      console.warn("[Finora Auth] session revocation unavailable", {
        code: result?.error?.code ?? "timeout",
        status: result?.error?.status,
      });
    }
  } catch {
    console.warn("[Finora Auth] session revocation did not complete");
  }
  return response;
}
