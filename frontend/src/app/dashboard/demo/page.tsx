/**
 * Demo route — renders the workspace without Supabase authentication.
 *
 * This page is intentionally excluded from production auth guards so that
 * visitors can explore Finora without creating an account. No user data is
 * read from or written to the database; the workspace starts empty and all
 * API calls that require authentication will show the normal empty-state UI.
 */
"use client";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { PrototypeDashboard } from "@/components/prototype/PrototypeDashboard";

export default function DemoPage() {
  return (
    <QueryProvider>
      <PrototypeDashboard
        userEmail=""
        userName="Demo"
        accountCreated={false}
      />
    </QueryProvider>
  );
}
