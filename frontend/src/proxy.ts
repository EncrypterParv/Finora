import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  // Logout owns the session cookie changes for this request.
  if (request.nextUrl.pathname === "/auth/sign-out") return;
  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
