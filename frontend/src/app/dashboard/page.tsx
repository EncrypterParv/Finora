"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PrototypeDashboard } from "@/components/prototype/PrototypeDashboard";
import { isDemoSession } from "@/lib/demo-session";

function DashboardContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isDemoSession()) {
      router.replace("/login");
      return;
    }
    queryClient.clear();
    setReady(true);
  }, [queryClient, router]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-sm text-[#766e65]" role="status">Opening prototype…</div>;
  }

  return <PrototypeDashboard />;
}

export default function DashboardPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f7f5f0]" />}><DashboardContent /></Suspense>;
}
