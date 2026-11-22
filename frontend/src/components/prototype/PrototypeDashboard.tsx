"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  FileUp,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { demoOverview, demoTransactions } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import { endDemoSession, startDemoSession } from "@/lib/demo-session";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FinoraMark } from "@/components/brand/FinoraMark";
import "./prototype-dashboard.css";

type Section =
  | "overview"
  | "calendar"
  | "insights"
  | "import"
  | "data"
  | "access"
  | "profile";

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "import", label: "Statement import", icon: FileUp },
  { id: "data", label: "Data map", icon: Database },
  { id: "access", label: "Access & roles", icon: UsersRound },
  { id: "profile", label: "Profile", icon: UserRound },
];

const entityMap = [
  { name: "User", table: "users", fields: "email · full name · currency · preferences", link: "Owns accounts, budgets, goals" },
  { name: "Account", table: "bank_accounts", fields: "institution · masked number · balance · currency", link: "Belongs to one user; has transactions" },
  { name: "Transaction", table: "transactions", fields: "date · amount · type · merchant · category · source", link: "Belongs to a user and account" },
  { name: "Category", table: "categories", fields: "name · icon · color · parent category", link: "Classifies transactions and budgets" },
  { name: "Merchant", table: "merchants", fields: "clean name · match patterns · default category", link: "Can be linked from transactions" },
  { name: "Budget", table: "budgets", fields: "name · period · limit · date range", link: "Contains category allocations" },
  { name: "Goal", table: "financial_goals", fields: "title · target · savings · contribution · status", link: "Belongs to one user; has milestones" },
  { name: "ML profile", table: "ml_profiles", fields: "score · spend features · last computed", link: "Derived from one user's transactions" },
];

const initialMembers = [
  { name: "Aarav Mehta", email: "aarav@example.test", role: "Owner" },
  { name: "Mira Shah", email: "mira@example.test", role: "Editor" },
  { name: "Dev Patel", email: "dev@example.test", role: "Viewer" },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PrototypeDashboard({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [toast, setToast] = useState("");
  const [profileName, setProfileName] = useState(userName);
  const [currency, setCurrency] = useState("INR");
  const [profileSaved, setProfileSaved] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [fileName, setFileName] = useState("");
  const [imported, setImported] = useState(false);

  useEffect(() => {
    // Auth is real; this flag keeps the prototype's feature data synthetic.
    startDemoSession();
    return endDemoSession;
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="finora-prototype min-h-screen bg-[#f3eee5] text-[#28231f]">
      <aside className="prototype-sidebar fixed inset-y-0 left-0 hidden w-[244px] flex-col border-r border-[#e3d9cc] bg-[#f8f4ec] px-4 py-5 md:flex">
        <div className="prototype-brand mb-8 flex items-center gap-3 px-2">
          <div>
            <FinoraMark size="md" />
            <div className="prototype-brand-caption pl-1 text-[11px] text-[#837970]">Personal finance workspace</div>
          </div>
        </div>
        <div className="prototype-nav-label mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#968d82]">Your workspace</div>
        <nav className="prototype-nav space-y-1" aria-label="Prototype sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return <button key={item.id} type="button" onClick={() => setSection(item.id)} aria-current={active ? "page" : undefined} className={`prototype-nav-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${active ? "is-active bg-[#f4eee7] font-semibold text-[#4e342e]" : "text-[#6f675f] hover:bg-[#f8f6f2] hover:text-[#28231f]"}`}>
              <Icon size={16} strokeWidth={1.8} />{item.label}
            </button>;
          })}
        </nav>
        <div className="prototype-sidebar-note mt-auto rounded-lg border border-[#e9e4db] bg-[#fbfaf7] p-3 text-xs text-[#766e65]">
          <div className="mb-1 flex items-center gap-2 font-medium text-[#4e342e]"><CircleHelp size={14} /> Preview environment</div>
          Figures and workspace controls are examples. Your sign-in is real; this financial data is not.
        </div>
      </aside>

      <div className="md:pl-[244px]">
        <header className="prototype-topbar sticky top-0 z-20 border-b border-[#e8e4dc] bg-[#f3eee5]/95 px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="min-w-0"><div className="prototype-breadcrumb text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c7465]">Finora <span aria-hidden="true">/</span> Personal</div><div className="mt-1 text-sm font-semibold">{navItems.find((item) => item.id === section)?.label}</div></div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="prototype-status hidden items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"><span aria-hidden="true" />Sample workspace</span>
              <button type="button" onClick={() => setSection("profile")} className="prototype-account flex items-center gap-2 rounded-lg px-2 py-1.5 text-left" aria-label="Open profile">
                <span className="prototype-avatar grid h-8 w-8 place-items-center rounded-full text-xs font-semibold">{(userName || userEmail || "U").slice(0, 1).toUpperCase()}</span>
                <span className="hidden max-w-44 truncate text-xs font-medium sm:block">{userEmail || "Your account"}</span>
              </button>
              <button type="button" onClick={signOut} className="prototype-signout rounded-md p-2 text-[#766e65]" aria-label="Log out"><LogOut size={16} /></button>
            </div>
          </div>
          <nav className="prototype-mobile-nav mx-auto mt-3 flex max-w-[1280px] gap-1 overflow-x-auto pb-0.5 md:hidden" aria-label="Prototype sections">
            {navItems.map((item) => <button key={item.id} type="button" onClick={() => setSection(item.id)} aria-current={section === item.id ? "page" : undefined} className={`shrink-0 rounded-md px-3 py-2 text-xs ${section === item.id ? "bg-[#4e342e] text-white" : "bg-white text-[#655c54]"}`}>{item.label}</button>)}
          </nav>
        </header>

        <main className="prototype-content mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
          <div className="prototype-demo-note mb-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8d7c5] bg-[#fffaf2] px-4 py-3 text-xs text-[#725b43]">
            <span><strong>Sample workspace</strong> <span aria-hidden="true">·</span> Synthetic October 2026 figures; edits stay in this browser session.</span>
            <span className="prototype-note-status"><span aria-hidden="true" /> No bank connected</span>
          </div>
          {section === "overview" && <OverviewView onOpen={setSection} imported={imported} />}
          {section === "calendar" && <CalendarPrototype />}
          {section === "insights" && <InsightsPrototype />}
          {section === "import" && <ImportPrototype fileName={fileName} setFileName={setFileName} imported={imported} setImported={setImported} notify={notify} />}
          {section === "data" && <DataMapPrototype />}
          {section === "access" && <AccessPrototype members={members} setMembers={setMembers} notify={notify} />}
          {section === "profile" && <ProfilePrototype name={profileName} email={userEmail} setName={setProfileName} currency={currency} setCurrency={setCurrency} saved={profileSaved} onSave={() => { setProfileSaved(true); notify("Profile changes saved in this prototype session."); }} />}
        </main>
        {toast && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#352720] px-4 py-3 text-sm text-white shadow-lg">{toast}</div>}
      </div>
    </div>
  );
}

function PageTitle({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="prototype-page-title mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="prototype-eyebrow">Your finances, in context</span><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777067]">{description}</p></div>{action}</div>;
}

function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`prototype-surface rounded-xl border border-[#e8e4dc] bg-white ${className}`}>{children}</section>;
}

function OverviewView({ onOpen, imported }: { onOpen: (section: Section) => void; imported: boolean }) {
  const stats = [
    { label: "Spent this month", value: formatCurrency(demoOverview.month_to_date_spend), note: "October 1–18, 2026", icon: ArrowUpRight },
    { label: "Income this month", value: formatCurrency(demoOverview.monthly_inflow), note: "Synthetic monthly income", icon: ArrowDownLeft },
    { label: "Behaviour score", value: `${demoOverview.behaviour_profile.score}/100`, note: "Illustrative score", icon: Activity },
  ];
  return <>
    <PageTitle title="Your money, in one view" description="A considered snapshot of the sample cash flow, with clear paths into the details." action={<button onClick={() => onOpen("import")} className="prototype-primary-action inline-flex items-center gap-2 rounded-md bg-[#4e342e] px-3.5 py-2.5 text-sm font-medium text-white"><Plus size={16} /> Try statement import</button>} />
    <div className="overview-topline">
      <section className="overview-balance" aria-label="Sample available balance">
        <div className="overview-balance-copy">
          <span className="overview-label"><WalletCards size={15} /> Available balance</span>
          <strong className="overview-balance-value">{formatCurrency(demoOverview.liquid_balance)}</strong>
          <span className="overview-balance-caption">Across 2 simulated accounts · sample figures</span>
          <button onClick={() => onOpen("calendar")} className="overview-balance-link">Review cash flow <ArrowRight size={15} /></button>
        </div>
        <div className="balance-stamp" aria-hidden="true"><span>FINORA</span><strong>01</strong><i /></div>
      </section>
      <div className="overview-kpis">{stats.map(({ label, value, note, icon: Icon }, index) => <Surface key={label} className={`overview-kpi overview-kpi-${index + 1} p-4`}><div className="flex items-start justify-between"><span className="text-xs text-[#777067]">{label}</span><Icon size={16} className="text-[#8d7769]" /></div><div className="mt-3 text-xl font-semibold tabular-nums">{value}</div><div className="mt-1 text-[11px] text-[#938b82]">{note}</div></Surface>)}</div>
    </div>
    <div className="overview-content-grid mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
      <Surface className="overview-activity p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><span className="prototype-eyebrow">Latest entries</span><h2 className="mt-1 font-semibold">Recent activity</h2><p className="mt-1 text-xs text-[#837970]">Sample transactions · October 2026</p></div><button onClick={() => onOpen("calendar")} className="prototype-inline-link inline-flex items-center gap-1 text-xs font-medium">Open calendar <ArrowRight size={14} /></button></div>
        <div className="mt-4 divide-y divide-[#f0ede7]">{demoTransactions.slice(0, 5).map((tx) => <div key={tx.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{tx.merchant_name}</div><div className="mt-0.5 text-[11px] text-[#8a8279]">{tx.category_name} · {new Date(tx.occurred_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div></div><div className={`shrink-0 text-sm font-medium tabular-nums ${tx.transaction_type === "CREDIT" ? "text-[#477250]" : "text-[#433b35]"}`}>{tx.transaction_type === "CREDIT" ? "+" : "−"}{formatCurrency(tx.amount)}</div></div>)}</div>
      </Surface>
      <Surface className="overview-explore p-5 md:p-6"><span className="prototype-eyebrow">A good next step</span><h2 className="mt-1 font-semibold">Explore your money</h2><p className="mt-1 text-xs leading-5 text-[#837970]">Choose a view to understand one part of this sample workspace.</p><div className="mt-4 space-y-1">{[
        ["Calendar", "Find the days money moved", "calendar"],
        ["Insights", "See illustrative spending patterns", "insights"],
        ["Statement import", imported ? "Preview viewed this session" : "See the sample review flow", "import"],
        ["Data map", "Review the current entities", "data"],
        ["Profile settings", "Inspect mock preferences", "profile"],
      ].map(([name, detail, target]) => <button key={name} onClick={() => onOpen(target as Section)} className="prototype-explore-link flex w-full items-center justify-between rounded-md px-3 py-3 text-left"><span><span className="block text-sm font-medium">{name}</span><span className="mt-0.5 block text-[11px] text-[#8a8279]">{detail}</span></span><ArrowRight size={15} /></button>)}</div></Surface>
    </div>
  </>;
}

function CalendarPrototype() {
  const [mode, setMode] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(new Date(2026, 9, 3));
  const monthDays = useMemo(() => {
    if (mode === "day") return [new Date(cursor)];
    if (mode === "week") {
      const start = new Date(cursor);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
    }
    return Array.from({ length: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() }, (_, index) => new Date(cursor.getFullYear(), cursor.getMonth(), index + 1));
  }, [cursor, mode]);
  const selectedKey = dateKey(cursor);
  const selectedTransactions = demoTransactions.filter((tx) => tx.occurred_at.slice(0, 10) === selectedKey);
  const move = (direction: number) => setCursor((current) => {
    if (mode === "month") return new Date(current.getFullYear(), current.getMonth() + direction, 1);
    const next = new Date(current);
    next.setDate(next.getDate() + (mode === "week" ? 7 : 1) * direction);
    return next;
  });
  return <>
    <PageTitle title="Financial calendar" description="Browse sample cash flow by month, week, or day. Select a date to see its transactions." />
    <Surface className="p-4 md:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button aria-label="Previous period" onClick={() => move(-1)} className="rounded-md border border-[#e8e4dc] p-2 hover:bg-[#faf8f4]"><ChevronLeft size={16} /></button><button aria-label="Next period" onClick={() => move(1)} className="rounded-md border border-[#e8e4dc] p-2 hover:bg-[#faf8f4]"><ChevronRight size={16} /></button><strong className="ml-1 text-sm">{cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong></div><div className="flex rounded-md border border-[#e8e4dc] bg-[#faf9f6] p-1">{(["month", "week", "day"] as const).map((value) => <button key={value} onClick={() => setMode(value)} className={`rounded px-3 py-1.5 text-xs capitalize ${mode === value ? "bg-white font-medium shadow-sm" : "text-[#777067]"}`}>{value}</button>)}</div></div>
      <div className={`grid gap-1 ${mode === "month" ? "grid-cols-7" : "grid-cols-1 sm:grid-cols-7"}`}>{mode === "month" && ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-[#938b82]">{day}</div>)}
        {mode === "month" && Array.from({ length: (monthDays[0].getDay() + 6) % 7 }, (_, index) => <div key={`blank-${index}`} />)}
        {monthDays.map((day) => { const key = dateKey(day); const txs = demoTransactions.filter((tx) => tx.occurred_at.slice(0, 10) === key); const selected = key === selectedKey; return <button key={key} onClick={() => setCursor(day)} className={`min-h-[66px] rounded-md border p-2 text-left transition-colors ${selected ? "border-[#8c6c58] bg-[#fbf4ec]" : "border-[#efede8] hover:bg-[#faf8f4]"}`}><span className="text-xs">{day.getDate()}</span>{txs.length > 0 && <span className="mt-2 block text-[10px] text-[#6d5a4c]">{txs.length} item{txs.length > 1 ? "s" : ""} · {formatCurrency(txs.reduce((sum, tx) => sum + (tx.transaction_type === "DEBIT" ? tx.amount : 0), 0))}</span>}</button>; })}</div>
    </Surface>
    <Surface className="mt-4 p-5"><h2 className="font-semibold">{cursor.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</h2>{selectedTransactions.length ? <div className="mt-3 divide-y divide-[#f0ede7]">{selectedTransactions.map((tx) => <div key={tx.id} className="flex items-center justify-between py-3"><div><div className="text-sm font-medium">{tx.merchant_name}</div><div className="text-xs text-[#837970]">{tx.category_name} · {tx.occurred_at.slice(11, 16)}</div></div><span className="text-sm font-medium">{tx.transaction_type === "CREDIT" ? "+" : "−"}{formatCurrency(tx.amount)}</span></div>)}</div> : <p className="mt-3 text-sm text-[#837970]">No sample transactions on this day.</p>}</Surface>
  </>;
}

function InsightsPrototype() {
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    demoTransactions.filter((tx) => tx.transaction_type === "DEBIT").forEach((tx) => totals.set(tx.category_name, (totals.get(tx.category_name) ?? 0) + tx.amount));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, []);
  const max = categories[0]?.[1] ?? 1;
  return <>
    <PageTitle title="Spending insights" description="Simple, explainable patterns from a synthetic transaction sample. These are not personalized financial advice." />
    <div className="grid gap-4 md:grid-cols-3"><Surface className="p-4"><div className="text-xs text-[#837970]">Sample score</div><div className="mt-2 text-2xl font-semibold">{demoOverview.behaviour_profile.score}<span className="text-sm font-normal text-[#837970]"> / 100</span></div><div className="mt-2 text-xs text-[#837970]">Illustrative calculation only</div></Surface><Surface className="p-4"><div className="text-xs text-[#837970]">Weekend share</div><div className="mt-2 text-2xl font-semibold">{(demoOverview.behaviour_profile.weekend_vs_weekday_ratio * 100).toFixed(0)}%</div><div className="mt-2 text-xs text-[#837970]">Of synthetic outflow</div></Surface><Surface className="p-4"><div className="text-xs text-[#837970]">Available history</div><div className="mt-2 text-2xl font-semibold">18 days</div><div className="mt-2 text-xs text-[#837970]">Too short for a stable trend</div></Surface></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]"><Surface className="p-5"><h2 className="font-semibold">Outflow by category</h2><div className="mt-4 space-y-4">{categories.map(([category, amount]) => <div key={category}><div className="mb-1.5 flex justify-between text-xs"><span>{category}</span><span className="tabular-nums">{formatCurrency(amount)}</span></div><div className="h-2 rounded bg-[#f1eee8]"><div className="h-2 rounded bg-[#9a7359]" style={{ width: `${Math.max(4, amount / max * 100)}%` }} /></div></div>)}</div></Surface><Surface className="p-5"><h2 className="font-semibold">What the sample suggests</h2><div className="mt-4 space-y-4">{demoOverview.recommendations.slice(0, 3).map((item) => <div key={item.id} className="border-b border-[#f0ede7] pb-4 last:border-0"><div className="text-sm font-medium">{item.title}</div><p className="mt-1 text-xs leading-5 text-[#777067]">{item.evidence}</p><div className="mt-2 text-xs text-[#694b3b]">Example action: {item.suggested_action}</div></div>)}</div><p className="mt-1 text-[11px] text-[#938b82]">Prototype examples only. No trained model is running.</p></Surface></div>
  </>;
}

function ImportPrototype({ fileName, setFileName, imported, setImported, notify }: { fileName: string; setFileName: (value: string) => void; imported: boolean; setImported: (value: boolean) => void; notify: (message: string) => void }) {
  const [stage, setStage] = useState<"choose" | "review" | "done">(imported ? "done" : "choose");
  return <>
    <PageTitle title="Statement import" description="Explore the proposed upload and review flow with generated sample rows. No file contents are uploaded or parsed." />
    <Surface className="p-5 md:p-7"><div className="max-w-2xl"><div className="mb-5 flex items-start gap-3"><div className="rounded-md bg-[#f4eee7] p-2.5 text-[#694b3b]"><FileUp size={18} /></div><div><h2 className="font-semibold">{stage === "choose" ? "Choose a statement file" : stage === "review" ? "Review sample rows" : "Sample import complete"}</h2><p className="mt-1 text-xs leading-5 text-[#837970]">CSV, XLSX, and PDF are shown as planned formats. This prototype uses a fixed preview regardless of the selected file.</p></div></div>
      {stage === "choose" && <><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#d7cfc3] bg-[#fcfbf8] px-5 text-center hover:bg-[#faf7f1]"><FileUp className="mb-3 text-[#8c725e]" size={24} /><span className="text-sm font-medium">Select a sample statement</span><span className="mt-1 text-xs text-[#837970]">Your selection stays in this browser; data is not read.</span><input type="file" accept=".csv,.xlsx,.pdf" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileName(file.name); setStage("review"); } }} /></label><button onClick={() => { setFileName("sample_statement_october.csv"); setStage("review"); }} className="mt-4 rounded-md border border-[#ddd6cb] px-3 py-2 text-xs font-medium hover:bg-[#faf8f4]">Use generated sample</button></>}
      {stage === "review" && <><div className="mb-3 rounded-md bg-[#f8f6f1] px-3 py-2 text-xs text-[#766e65]">Selected name: <strong>{fileName}</strong> · Preview below is generated sample data</div><div className="overflow-x-auto rounded-md border border-[#e8e4dc]"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[#faf9f6] text-[#777067]"><tr>{["Date", "Description", "Type", "Amount"].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#f0ede7]">{[["Oct 03", "Blue Tokai Coffee", "Debit", "₹320"], ["Oct 04", "Namma Metro", "Debit", "₹120"], ["Oct 05", "Sample monthly income", "Credit", "₹75,000"]].map((row) => <tr key={row[1]}>{row.map((cell) => <td key={cell} className="px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setStage("choose")} className="rounded-md border border-[#ddd6cb] px-3 py-2 text-xs">Choose another</button><button onClick={() => { setImported(true); setStage("done"); notify("Sample import recorded for this session."); }} className="rounded-md bg-[#4e342e] px-3 py-2 text-xs font-medium text-white">Confirm sample import</button></div></>}
      {stage === "done" && <div className="rounded-md border border-[#e8e4dc] bg-[#fbfaf7] p-4"><div className="flex items-center gap-2 text-sm font-medium"><Check size={16} className="text-[#477250]" />Sample import recorded</div><p className="mt-2 text-xs text-[#837970]">3 illustrative rows · 2 debits · 1 credit. No data was sent or persisted.</p><button onClick={() => { setImported(false); setFileName(""); setStage("choose"); }} className="mt-4 rounded-md border border-[#ddd6cb] px-3 py-2 text-xs">Start another sample</button></div>}
    </div></Surface>
  </>;
}

function DataMapPrototype() {
  const [selected, setSelected] = useState(entityMap[0].table);
  const entity = entityMap.find((item) => item.table === selected) ?? entityMap[0];
  return <>
    <PageTitle title="Data map" description="A first-pass view of the entities already represented in the local SQLAlchemy models. Fields are illustrative, not a finalized schema." />
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]"><Surface className="p-2"><div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#938b82]">Prototype entities</div>{entityMap.map((item) => <button key={item.table} onClick={() => setSelected(item.table)} className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm ${selected === item.table ? "bg-[#f4eee7] font-medium text-[#4e342e]" : "text-[#655c54] hover:bg-[#faf8f4]"}`}><span>{item.name}</span><span className="text-[10px] text-[#938b82]">table</span></button>)}</Surface><Surface className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs text-[#837970]">Entity detail</div><h2 className="mt-1 text-xl font-semibold">{entity.name}</h2><code className="mt-1 block text-xs text-[#8a8279]">{entity.table}</code></div><Database size={19} className="text-[#8c725e]" /></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><div className="text-[10px] font-semibold uppercase tracking-wide text-[#938b82]">Current field examples</div><p className="mt-2 text-sm leading-6">{entity.fields}</p></div><div><div className="text-[10px] font-semibold uppercase tracking-wide text-[#938b82]">Relationship</div><p className="mt-2 text-sm leading-6">{entity.link}</p></div></div><div className="mt-6 rounded-md bg-[#faf8f4] p-3 text-xs leading-5 text-[#766e65]">Next design step: decide which fields are user-entered, imported, derived, or operational before expanding this model.</div><p className="mt-4 text-[11px] text-[#938b82]">This prototype does not connect to or change a database.</p></Surface></div>
  </>;
}

function AccessPrototype({ members, setMembers, notify }: { members: typeof initialMembers; setMembers: (members: typeof initialMembers) => void; notify: (message: string) => void }) {
  const [email, setEmail] = useState("");
  const addMember = () => { if (!email.includes("@")) { notify("Enter a valid sample email address."); return; } setMembers([...members, { name: email.split("@")[0], email, role: "Viewer" }]); setEmail(""); notify("Sample member added for this session."); };
  return <>
    <PageTitle title="Access & roles" description="A local sketch of role-based access for a future shared workspace. Changing roles here has no real effect." action={<span className="inline-flex items-center gap-2 rounded-md bg-[#fbf4ec] px-3 py-2 text-xs text-[#694b3b]"><LockKeyhole size={14} /> Mock permissions</span>} />
    <Surface className="overflow-hidden"><div className="border-b border-[#eeeae3] px-5 py-4"><h2 className="font-semibold">Workspace members</h2><p className="mt-1 text-xs text-[#837970]">Owner manages the workspace; editor can change financial data; viewer can read it.</p></div><div className="divide-y divide-[#f0ede7]">{members.map((member, index) => <div key={member.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><div className="text-sm font-medium">{member.name}{index === 0 && <span className="ml-2 text-[10px] text-[#8a8279]">You</span>}</div><div className="mt-0.5 text-xs text-[#837970]">{member.email}</div></div><select aria-label={`Role for ${member.name}`} value={member.role} onChange={(event) => setMembers(members.map((item) => item.email === member.email ? { ...item, role: event.target.value } : item))} className="rounded-md border border-[#ddd6cb] bg-white px-2.5 py-2 text-xs" disabled={index === 0}><option>Owner</option><option>Editor</option><option>Viewer</option></select></div>)}</div><div className="flex flex-col gap-2 border-t border-[#eeeae3] p-4 sm:flex-row"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="person@example.test" className="min-w-0 flex-1 rounded-md border border-[#ddd6cb] px-3 py-2.5 text-sm outline-none focus:border-[#9a7359]" /><button onClick={addMember} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#4e342e] px-3 py-2.5 text-xs font-medium text-white"><Plus size={14} /> Add sample member</button></div></Surface>
    <p className="mt-3 text-xs text-[#837970]">Prototype roles: Owner · Editor · Viewer. Team membership and authorization are not connected to an identity provider.</p>
  </>;
}

function ProfilePrototype({ name, email, setName, currency, setCurrency, saved, onSave }: { name: string; email: string; setName: (value: string) => void; currency: string; setCurrency: (value: string) => void; saved: boolean; onSave: () => void }) {
  const [weeklySummary, setWeeklySummary] = useState(true);
  return <>
    <PageTitle title="Your profile" description="Basic account preferences and settings. Saved changes last only for this browser session." />
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><Surface className="p-5 md:p-6"><span className="prototype-eyebrow">Account details</span><h2 className="mt-1 font-semibold">Personal details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add your name" className="prototype-field mt-1.5 block w-full rounded-md border border-[#ddd6cb] px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-medium">Email<input value={email} readOnly className="prototype-field mt-1.5 block w-full rounded-md border border-[#e8e4dc] bg-[#faf9f6] px-3 py-2.5 text-sm font-normal text-[#837970]" /></label><label className="text-xs font-medium">Display currency<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="prototype-field mt-1.5 block w-full rounded-md border border-[#ddd6cb] bg-white px-3 py-2.5 text-sm font-normal"><option>INR</option><option>USD</option><option>EUR</option></select></label></div><button onClick={onSave} className="prototype-primary-action mt-5 rounded-md bg-[#4e342e] px-4 py-2.5 text-xs font-medium text-white">{saved ? "Save again" : "Save profile"}</button><p className="mt-3 text-xs text-[#837970]">This prototype keeps profile edits in the current browser session only.</p></Surface><div className="space-y-4"><Surface className="p-5 md:p-6"><span className="prototype-eyebrow">Preferences</span><h2 className="mt-1 font-semibold">Your routine</h2><label className="mt-4 flex items-center justify-between gap-4 text-sm"><span><span className="block font-medium">Weekly summary</span><span className="mt-1 block text-xs text-[#837970]">Prototype preference toggle</span></span><input type="checkbox" checked={weeklySummary} onChange={(event) => setWeeklySummary(event.target.checked)} className="h-4 w-4 accent-[#4e342e]" /></label></Surface><Surface className="p-5 md:p-6"><span className="prototype-eyebrow">Sign-in</span><h2 className="mt-1 font-semibold">Account security</h2><p className="mt-2 text-xs leading-5 text-[#837970]">Your password and session are managed by Supabase Auth. Password management is not connected in this prototype.</p><button disabled className="prototype-disabled-action mt-3 rounded-md border border-[#e8e4dc] px-3 py-2 text-xs">Password settings · not connected</button></Surface><Surface className="p-5 md:p-6"><div className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} className="text-[#6c8268]" /> Data privacy</div><p className="mt-2 text-xs leading-5 text-[#837970]">Financial figures in this workspace are synthetic demo data.</p></Surface></div></div>
  </>;
}
