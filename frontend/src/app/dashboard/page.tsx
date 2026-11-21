import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PrototypeDashboard } from "@/components/prototype/PrototypeDashboard";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default async function DashboardPage() {
  await cookies(); // Keep auth protection request-time, including before env setup.
  if (!getSupabaseConfig()) redirect("/login?setup=supabase");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const metadata = data.claims.user_metadata;
  const userName =
    typeof metadata === "object" &&
    metadata !== null &&
    "full_name" in metadata &&
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : "";

  return (
    <PrototypeDashboard
      userEmail={String(data.claims.email ?? "")}
      userName={userName}
    />
  );
}
