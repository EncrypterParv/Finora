"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  FileUp,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  RotateCw,
  ShieldCheck,
  Target,
  WalletCards,
  Zap,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FinoraMark } from "@/components/brand/FinoraMark";
import {
  BankAccountSummary,
  createBankAccount,
  confirmStatementImport,
  clearApiResponseCache,
  fetchBankAccounts,
  fetchTransactionPage,
  previewStatement,
  StatementDraftTransaction,
  StatementPreview,
} from "@/lib/api";
import { CanonicalTransaction } from "@/types/transaction";
import { endDemoSession, isDemoSession, startDemoSession } from "@/lib/demo-session";
import { SectionLoadingSkeleton, WorkspaceLoadingSkeleton } from "./PrototypeSkeletons";
import { PageTitle } from "./prototype-ui";
import { WorkspaceOverview } from "./WorkspaceOverview";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { LiveBankConnectCard } from "./LiveBankConnectCard";
import "./prototype-dashboard.css";
import "./themes.css";

const AccountsScreen = dynamic(() => import("./AccountsScreen").then((module) => module.AccountsScreen), { loading: () => <SectionLoadingSkeleton /> });
const BudgetsScreen = dynamic(() => import("./BudgetsScreen").then((module) => module.BudgetsScreen), { loading: () => <SectionLoadingSkeleton /> });
const CalendarScreen = dynamic(() => import("./CalendarScreen").then((module) => module.CalendarScreen), { loading: () => <SectionLoadingSkeleton /> });
const GoalsScreen = dynamic(() => import("./GoalsScreen").then((module) => module.GoalsScreen), { loading: () => <SectionLoadingSkeleton /> });
const InsightsScreen = dynamic(() => import("./InsightsScreen").then((module) => module.InsightsScreen), { loading: () => <SectionLoadingSkeleton /> });
const TransactionsScreen = dynamic(() => import("./TransactionsScreen").then((module) => module.TransactionsScreen), { loading: () => <SectionLoadingSkeleton /> });

type Section = "overview" | "calendar" | "insights" | "transactions" | "budgets" | "goals" | "accounts" | "import";
type AccountType = "SAVINGS" | "CURRENT" | "CREDIT";

const sectionPreloaders: Partial<Record<Section, () => Promise<unknown>>> = {
  accounts: () => import("./AccountsScreen"),
  budgets: () => import("./BudgetsScreen"),
  calendar: () => import("./CalendarScreen"),
  goals: () => import("./GoalsScreen"),
  insights: () => import("./InsightsScreen"),
  transactions: () => import("./TransactionsScreen"),
};
const preloadedSections = new Map<Section, Promise<unknown>>();

function preloadSection(section: Section) {
  const load = sectionPreloaders[section];
  if (!load || preloadedSections.has(section)) return;

  const pending = load();
  preloadedSections.set(section, pending);
  void pending.catch(() => preloadedSections.delete(section));
}

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "transactions", label: "Transactions", icon: ArrowDownLeft },
  { id: "budgets", label: "Budgets", icon: PiggyBank },
  { id: "goals", label: "Goals", icon: Target },
  { id: "accounts", label: "Accounts", icon: WalletCards },
  { id: "import", label: "Add a statement", icon: FileUp },
];

const MAX_STATEMENT_UPLOAD_BYTES = 4 * 1024 * 1024;
const STATEMENT_REVIEW_PAGE_SIZE = 20;

export function PrototypeDashboard({
  userEmail,
  userName,
  accountCreated = false,
}: {
  userEmail: string;
  userName: string;
  accountCreated?: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [accounts, setAccounts] = useState<BankAccountSummary[]>([]);
  const [transactions, setTransactions] = useState<CanonicalTransaction[]>([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const signOutChannel = useRef<BroadcastChannel | null>(null);
  const mobileNavigation = useRef<HTMLDetailsElement>(null);
  const workspaceMain = useRef<HTMLElement>(null);
  const [welcomeToastState, setWelcomeToastState] = useState<"visible" | "leaving" | "hidden">(accountCreated ? "visible" : "hidden");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"demo" | "live">(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname.includes("/demo") || isDemoSession() ? "demo" : "demo";
    }
    return "demo";
  });

  useEffect(() => {
    if (!accountCreated) return;
    router.replace("/dashboard", { scroll: false });
  }, [accountCreated, router]);

  useEffect(() => {
    if (welcomeToastState !== "visible") return;
    const timer = window.setTimeout(() => setWelcomeToastState("leaving"), 5_000);
    return () => window.clearTimeout(timer);
  }, [welcomeToastState]);

  useEffect(() => {
    if (welcomeToastState !== "leaving") return;
    const timer = window.setTimeout(() => setWelcomeToastState("hidden"), 260);
    return () => window.clearTimeout(timer);
  }, [welcomeToastState]);

  useEffect(() => {
    const verifyRestoredPage = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", verifyRestoredPage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("finora-sign-out");
      channel.onmessage = (event) => {
        if (event.data !== "signed-out") return;
        window.location.replace("/login?signed-out=1");
      };
      signOutChannel.current = channel;
    } catch {
      // Tabs still share the session cookies when BroadcastChannel is unavailable.
    }

    return () => {
      window.removeEventListener("pageshow", verifyRestoredPage);
      channel?.close();
      signOutChannel.current = null;
    };
  }, []);

  useEffect(() => {
    if (workspaceMode === "demo") {
      startDemoSession();
    } else {
      endDemoSession();
    }
    let active = true;
    async function loadWorkspace() {
      setLoading(true);
      setLoadError("");
      try {
        const [loadedAccounts, loadedTransactions] = await Promise.all([
          fetchBankAccounts(),
          fetchTransactionPage({}, 5, 0),
        ]);
        if (!active) return;
        setAccounts(loadedAccounts);
        setTransactions(loadedTransactions.items);
        setTransactionCount(loadedTransactions.total);
      } catch {
        if (active) setLoadError("We couldn’t load your financial records. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadWorkspace();
    return () => { active = false; };
  }, [retryKey, workspaceMode]);

  async function reloadWorkspace() {
    setRefreshError("");
    try {
      if (workspaceMode === "demo") startDemoSession();
      const [loadedAccounts, loadedTransactions] = await Promise.all([
        fetchBankAccounts(),
        fetchTransactionPage({}, 5, 0),
      ]);
      setAccounts(loadedAccounts);
      setTransactions(loadedTransactions.items);
      setTransactionCount(loadedTransactions.total);
    } catch {
      setRefreshError("Your change was saved, but we couldn’t refresh the workspace. Reload the page to see the latest records.");
    }
  }

  const handleModeChange = (newMode: "demo" | "live") => {
    setWorkspaceMode(newMode);
    if (newMode === "demo") {
      startDemoSession();
    } else {
      endDemoSession();
    }
    setRetryKey((k) => k + 1);
  };

  async function signOut() {
    setSigningOut(true);
    setSignOutError(false);
    try {
      const response = await fetch("/auth/sign-out", {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status !== 204) throw new Error("Sign-out did not complete");
    } catch {
      setSignOutError(true);
      setSigningOut(false);
      return;
    }

    clearApiResponseCache();
    signOutChannel.current?.postMessage("signed-out");
    window.location.replace("/login?signed-out=1");
  }

  const handleAccountCreated = (account: BankAccountSummary) => {
    setAccounts((current) => [...current, account]);
  };

  const handleImportComplete = async () => {
    await reloadWorkspace();
  };

  const handleAccountUpdated = (account: BankAccountSummary) => {
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, ...account } : item));
  };

  const handleAccountDeleted = async (accountId: string, removedTransactions: boolean) => {
    setAccounts((current) => current.filter((item) => item.id !== accountId));
    if (removedTransactions) await reloadWorkspace();
  };

  const sectionLabel = navigation.find((item) => item.id === section)?.label;

  return (
    <div className="finora-prototype min-h-screen" data-section={section}>
      <a className="prototype-skip-link" href="#workspace-main">Skip to main content</a>
      <aside
        className="prototype-sidebar-tahoe hidden md:flex"
        data-collapsed={sidebarCollapsed}
        aria-label="Workspace sidebar"
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[var(--finora-sidebar-line)]">
          <div className="flex items-center gap-2 overflow-hidden">
            <FinoraMark size="sm" showWordmark={!sidebarCollapsed} />
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--finora-sidebar-text)] hover:bg-white/10 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar (⌘+B)" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Workspace sections">
          {[
            { label: "Workspace", items: navigation.slice(0, 4) },
            { label: "Manage", items: navigation.slice(4) },
          ].map(({ label, items }) => (
            <div key={label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--finora-sidebar-text)]">
                  {label}
                </p>
              )}
              <div className="space-y-1">
                {items.map(({ id, label: itemLabel, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    onPointerEnter={() => preloadSection(id)}
                    onPointerDown={() => preloadSection(id)}
                    onFocus={() => preloadSection(id)}
                    aria-current={section === id ? "page" : undefined}
                    title={sidebarCollapsed ? itemLabel : undefined}
                    className={`tahoe-nav-item w-full ${sidebarCollapsed ? "justify-center !px-0" : ""} ${
                      section === id ? "is-active font-semibold" : ""
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                    {!sidebarCollapsed && <span className="truncate">{itemLabel}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--finora-sidebar-line)] p-2.5">
          <div className={`flex items-center gap-2.5 rounded-xl p-1.5 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <span className="prototype-avatar shrink-0" aria-hidden="true">
              {(userName.trim() || userEmail || "F").charAt(0).toUpperCase()}
            </span>
            {!sidebarCollapsed && (
              <span className="min-w-0 flex-1 truncate text-xs leading-4 text-[var(--finora-sidebar-text)]">
                <strong className="block truncate font-semibold text-[var(--finora-on-dark,#ffffff)]">
                  {userName || "Personal workspace"}
                </strong>
                <small className="block truncate">{userEmail || "Finora"}</small>
              </span>
            )}
          </div>
        </div>
      </aside>

      <div className="tahoe-content-shift min-h-screen flex flex-col" data-collapsed={sidebarCollapsed}>
        <header className="prototype-topbar sticky top-0 z-20 border-b px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3">
            <div className="prototype-topbar-context">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:grid h-8 w-8 place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[var(--prototype-ink,#20211f)] mr-1"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
              <span className="hidden sm:inline">Workspace</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <strong>{sectionLabel}</strong>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Version Switcher: Demo (10Y Pre-calc) vs Live (Air-Gapped) */}
              <div className="flex items-center rounded-full border border-[#d5d4cc] dark:border-[#26272e] bg-[#f5f4f0]/80 dark:bg-[#14151a]/80 backdrop-blur-md p-1 text-xs shadow-inner">
                <button
                  type="button"
                  onClick={() => handleModeChange("demo")}
                  aria-label="Demo mode"
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    workspaceMode === "demo"
                      ? "bg-white text-[#20211f] shadow-sm dark:bg-[#26272e] dark:text-white dark:font-semibold"
                      : "text-[#62645d] hover:text-[#20211f] dark:text-[#9ca3af] dark:hover:text-white"
                  }`}
                  title="View 10-Year Dynamic Pre-Calculated Demo Records & Graphs"
                >
                  <Zap size={13} className="text-amber-500 fill-amber-500/20" />
                  <span className="hidden font-semibold sm:inline">Demo (10Y Pre-calc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("live")}
                  aria-label="Live mode"
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    workspaceMode === "live"
                      ? "bg-white text-[#20211f] shadow-sm dark:bg-[#26272e] dark:text-white dark:font-semibold"
                      : "text-[#62645d] hover:text-[#20211f] dark:text-[#9ca3af] dark:hover:text-white"
                  }`}
                  title="Switch to Live Version (Connect Bank Account)"
                >
                  <Lock size={13} className="text-sky-500" />
                  <span className="hidden sm:inline">Live (Air-Gapped)</span>
                </button>
              </div>

              <ThemeSelector pill />
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="prototype-signout inline-flex items-center gap-2 rounded-full border border-[#d5d4cc] dark:border-[#26272e] px-3.5 py-1.5 text-xs font-semibold text-[#414340] dark:text-[#f3f4f6] hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-70"
              >
                <LogOut size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
              </button>
            </div>
          </div>
          <div className="sr-only" role="status">{signingOut ? "Signing out of Finora." : ""}</div>
          {signOutError && <p role="status" className="prototype-signout-notice mx-auto mt-2 max-w-[1540px] text-sm">
            We couldn’t finish signing out. Please try again.
          </p>}
          <details ref={mobileNavigation} className="prototype-mobile-menu md:hidden">
            <summary>Workspace sections <ChevronDown size={16} aria-hidden="true" /></summary>
            <nav aria-label="Workspace sections">
              {navigation.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onPointerEnter={() => preloadSection(id)} onPointerDown={() => preloadSection(id)} onFocus={() => preloadSection(id)} onClick={() => {
                  setSection(id);
                  if (mobileNavigation.current) mobileNavigation.current.open = false;
                  workspaceMain.current?.focus();
                }} aria-current={section === id ? "page" : undefined}>
                  <Icon size={16} aria-hidden="true" />{label}
                </button>
              ))}
            </nav>
          </details>
        </header>

        <main ref={workspaceMain} id="workspace-main" tabIndex={-1} className="prototype-content flex-1 mx-auto w-full max-w-[1540px] px-4 py-6 md:px-8 md:py-8 section-fade-enter" key={section} aria-busy={loading}>
          {welcomeToastState !== "hidden" && <aside className="prototype-toast" data-state={welcomeToastState} role="status" aria-live="polite" aria-atomic="true">
            <Check size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1"><p className="font-semibold">Your account is ready.</p><p className="mt-1 text-sm leading-5">You’re signed in to Finora. Your workspace starts empty; add a statement whenever you’re ready.</p></div>
            <button type="button" className="prototype-toast-dismiss" onClick={() => setWelcomeToastState("leaving")} aria-label="Dismiss account created notification"><X size={17} aria-hidden="true" /></button>
          </aside>}
          {refreshError && <p role="alert" className="mb-4 rounded-md border border-[#ead7d2] bg-white p-3 text-sm text-[#9f2f2d]">{refreshError}</p>}
          {loading ? <LoadingWorkspace /> : loadError ? <LoadError message={loadError} onRetry={() => setRetryKey((key) => key + 1)} /> : (
            <>
              {section === "import" ? (
                <StatementImportFlow accounts={accounts} onAccountCreated={handleAccountCreated} onComplete={handleImportComplete} />
              ) : section === "accounts" ? (
                <AccountsScreen accounts={accounts} onAdd={() => setSection("import")} onAccountUpdated={handleAccountUpdated} onAccountDeleted={handleAccountDeleted} />
              ) : section === "transactions" ? (
                <TransactionsScreen accounts={accounts} onRecordsChanged={reloadWorkspace} onAddStatement={() => setSection("import")} />
              ) : section === "calendar" ? (
                <CalendarScreen onAddStatement={() => setSection("import")} />
              ) : section === "insights" ? (
                <InsightsScreen
                  onAddStatement={() => setSection("import")}
                  workspaceMode={workspaceMode}
                  onConnectBank={reloadWorkspace}
                  onSwitchToDemo={() => handleModeChange("demo")}
                />
              ) : section === "budgets" ? (
                <BudgetsScreen />
              ) : section === "goals" ? (
                <GoalsScreen />
              ) : workspaceMode === "live" && accounts.length === 0 ? (
                <LiveBankConnectCard
                  onConnected={reloadWorkspace}
                  onAddStatement={() => setSection("import")}
                  onSwitchToDemo={() => handleModeChange("demo")}
                  title="Connect Your Bank Account to Activate Live Intelligence"
                  description="You are currently in the Live Version of Finora. Because no bank account has been connected yet, live transaction records and machine learning models are waiting for your statements. Select your bank below to begin."
                />
              ) : transactions.length > 0 ? (
                <WorkspaceOverview
                  userName={userName} accounts={accounts} transactions={transactions} transactionCount={transactionCount}
                  onAdd={() => setSection("import")} onInsights={() => setSection("insights")}
                  onAccounts={() => setSection("accounts")} onTransactions={() => setSection("transactions")}
                  workspaceMode={workspaceMode}
                />
              ) : accounts.length > 0 ? (
                <NoTransactionsState accounts={accounts} onAdd={() => setSection("import")} />
              ) : (
                <FirstUseEmptyState userName={userName} onAdd={() => setSection("import")} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingWorkspace() {
  return <WorkspaceLoadingSkeleton insideShell />;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className="prototype-workspace-notice rounded-xl border border-[#ead7d2] bg-white p-7" role="alert"><h1 className="text-xl font-semibold">Your records are temporarily unavailable</h1><p className="mt-2 text-sm text-[#575953]">{message}</p><button type="button" onClick={onRetry} className="prototype-primary-action mt-5 inline-flex items-center gap-2 rounded-md bg-[#262724] px-4 py-2.5 text-sm font-medium text-white"><RotateCw size={15} /> Try again</button></section>;
}

function FirstUseEmptyState({ userName, onAdd }: { userName: string; onAdd: () => void }) {
  return <section className="prototype-first-use mx-auto max-w-4xl rounded-2xl border border-[#d5d4cc] bg-[#fbfbf9] px-6 py-10 md:px-12 md:py-14">
    <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <div>
        <h1>{userName ? `Welcome, ${userName.split(" ")[0]}.` : "Welcome to Finora."}<br />Start with your own records.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#575953]">Import a bank statement to review your transactions and build your personal view.</p>
        <button type="button" onClick={onAdd} className="prototype-primary-action mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#20211f] px-4 py-3 text-sm font-medium text-white"><FileUp size={17} className="shrink-0" /> Add a bank statement <ArrowRight size={16} className="shrink-0" /></button>
      </div>
      <Image className="hidden h-auto w-full lg:block" src="/images/statement-still-life.png" width={610} height={610} sizes="(max-width: 1023px) 1px, 208px" alt="" />
    </div>
    <div className="mt-8 grid gap-3 border-t border-[#e5e4de] pt-5 text-xs leading-5 text-[#575953] sm:grid-cols-2">
      <p><strong className="font-semibold text-[#262724]">No bank login.</strong> We never ask for your online banking password or full account number.</p>
      <p><strong className="font-semibold text-[#262724]">You review first.</strong> The original statement is processed temporarily; only records you confirm are saved.</p>
    </div>
    <p className="mt-5 text-xs text-[#62645d]">Supported: CSV, PDF, PNG, JPG. Scanned files need careful review.</p>
  </section>;
}

function NoTransactionsState({ accounts, onAdd }: { accounts: BankAccountSummary[]; onAdd: () => void }) {
  return <section className="prototype-workspace-notice rounded-xl border border-[#e5e4de] bg-white px-6 py-10 md:px-10">
    <span className="prototype-eyebrow">{accounts.length === 1 ? accounts[0].institution_name : `${accounts.length} accounts`}</span>
    <h1 className="mt-3 text-2xl font-semibold">No transactions found yet.</h1>
    <p className="mt-2 max-w-xl text-sm leading-6 text-[#575953]">Your account is ready. Add a statement to review and save transactions, or record one manually from the Transactions tab.</p>
    <button type="button" onClick={onAdd} className="prototype-primary-action mt-6 inline-flex items-center gap-2 rounded-md bg-[#262724] px-4 py-2.5 text-sm font-medium text-white"><FileUp size={16} /> Try another statement <ArrowRight size={15} /></button>
  </section>;
}

function StatementImportFlow({ accounts, onAccountCreated, onComplete }: { accounts: BankAccountSummary[]; onAccountCreated: (account: BankAccountSummary) => void; onComplete: () => Promise<void> }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [showAccountForm, setShowAccountForm] = useState(accounts.length === 0);
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
  const [lastFour, setLastFour] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [preview, setPreview] = useState<StatementPreview | null>(null);
  const [rows, setRows] = useState<StatementDraftTransaction[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWorking(true);
    try {
      const account = await createBankAccount({
        institution_name: institution,
        account_type: accountType,
        ...(lastFour ? { last_four: lastFour } : {}),
      });
      onAccountCreated(account);
      setAccountId(account.id);
      setShowAccountForm(false);
      setInstitution("");
      setLastFour("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this account.");
    } finally {
      setWorking(false);
    }
  }

  async function inspectStatement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setError("");
    setNotice("");
    setWorking(true);
    try {
      const result = await previewStatement(file);
      setPreview(result);
      setRows(result.transactions);
      setReviewPage(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not read this statement.");
    } finally {
      setWorking(false);
    }
  }

  async function saveTransactions() {
    if (!preview || !accountId || !rows.length) return;
    setError("");
    setWorking(true);
    try {
      const result = await confirmStatementImport({
        account_id: accountId,
        source_format: preview.format,
        transactions: rows.map((row) => ({ ...row, account_id: accountId })),
      });
      setNotice(result.transactions_added === 0
        ? `No new records were added. ${result.duplicates_skipped} duplicate ${result.duplicates_skipped === 1 ? "row was" : "rows were"} skipped.`
        : `${result.transactions_added} transaction${result.transactions_added === 1 ? "" : "s"} saved. ${result.duplicates_skipped ? `${result.duplicates_skipped} duplicate rows skipped.` : ""}`);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setPreview(null);
      setRows([]);
      setReviewPage(1);
      await onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save these transactions.");
    } finally {
      setWorking(false);
    }
  }

  function chooseFile(nextFile: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (nextFile && nextFile.size > MAX_STATEMENT_UPLOAD_BYTES) {
      setPreviewUrl("");
      setFile(null);
      setPreview(null);
      setRows([]);
      setReviewPage(1);
      setError("This file is larger than 4 MB. Choose a smaller statement to upload it here.");
      setNotice("");
      return;
    }
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
    setFile(nextFile);
    setPreview(null);
    setRows([]);
    setReviewPage(1);
    setError("");
    setNotice("");
  }

  function updateRow(index: number, update: Partial<StatementDraftTransaction>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...update } : row));
  }

  const rowErrors = useMemo(() => rows.map((row) => {
    const amount = Number(row.amount);
    const date = new Date(row.occurred_at);
    return !row.raw_description.trim() || !row.category_name.trim() || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime());
  }), [rows]);
  const hasInvalidRows = rowErrors.some(Boolean);
  const reviewPageCount = Math.max(1, Math.ceil(rows.length / STATEMENT_REVIEW_PAGE_SIZE));
  const firstVisibleRow = (reviewPage - 1) * STATEMENT_REVIEW_PAGE_SIZE;
  const visibleRows = rows.slice(firstVisibleRow, firstVisibleRow + STATEMENT_REVIEW_PAGE_SIZE);

  return <>
    <PageTitle title="Add a bank statement" description="Import a statement, review the extracted records, then choose what to save." />
    {accounts.length > 0 && !showAccountForm && !preview && <div className="statement-light-panel mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#e5e4de] bg-white px-4 py-3 text-sm">
      <label htmlFor="statement-account" className="text-xs font-medium text-[#414340]">Save under</label>
      <select id="statement-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setNotice(""); }} className="min-h-10 rounded-md border border-[#d5d4cc] bg-white px-3 text-sm">
        {accounts.map((account) => <option key={account.id} value={account.id}>{account.institution_name} · {account.account_number_masked}</option>)}
      </select>
      <button type="button" className="prototype-inline-link text-xs font-medium" onClick={() => setShowAccountForm(true)}>Add another account</button>
    </div>}

    {showAccountForm && <form onSubmit={saveAccount} className="mb-5 rounded-xl border border-[#e5e4de] bg-white p-5">
      <h2 className="font-semibold">Label this account</h2>
      <p className="mt-1 text-xs leading-5 text-[#62645d]">This creates an account label only. It does not connect to your bank or upload a statement. A last-four label is optional; never enter the full number.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-[#414340]">Bank or institution<input required maxLength={100} value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="e.g. Your bank" className="prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#d5d4cc] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-medium text-[#414340]">Account type<select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)} className="prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#d5d4cc] bg-white px-3 text-sm font-normal"><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option><option value="CREDIT">Credit</option></select></label>
        <label className="text-xs font-medium text-[#414340]">Last four digits (optional)<input value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="1234" className="prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#d5d4cc] px-3 text-sm font-normal" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={working} className="prototype-primary-action rounded-md bg-[#262724] px-4 py-2.5 text-sm font-medium text-white">{working ? "Saving…" : "Save account label"}</button>{accounts.length > 0 && <button type="button" onClick={() => setShowAccountForm(false)} className="rounded-md border border-[#d5d4cc] px-4 py-2.5 text-sm">Cancel</button>}</div>
    </form>}

    {!showAccountForm && !preview && <section className="rounded-xl border border-[#e5e4de] bg-white p-5 md:p-7">
      <div className="flex items-start gap-3"><div className="rounded-md bg-[#eeede8] p-2.5 text-[#414340]"><FileUp size={18} /></div><div><h2 className="font-semibold">Choose your statement</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-[#62645d]">CSV works best when it includes date, description, and separate debit/credit columns or a transaction type. PDF, PNG, and JPG need the optional OCR runtime, which is not installed in this Vercel demo. Scanned text can contain extraction mistakes and always needs careful review.</p></div></div>
      {accounts.length === 0 ? <p className="mt-5 rounded-md bg-[#f5f4f0] p-3 text-xs text-[#575953]">Add an account label above before choosing a statement.</p> : <form onSubmit={inspectStatement} className="mt-5">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#bab9af] bg-[#fbfbf9] px-5 text-center hover:bg-[#faf7f1] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#9a7359]">
          <FileUp className="mb-3 text-[#8c725e]" size={24} /><span className="text-sm font-medium">{file ? file.name : "Select a statement file"}</span><span className="mt-1 text-xs text-[#62645d]">Maximum 4 MB · PDF up to 20 pages · CSV, PDF, PNG, JPG</span><input type="file" accept=".csv,.pdf,.png,.jpg,.jpeg,text/csv,application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
        </label>
        {file && <button type="submit" disabled={working} className="prototype-primary-action mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#262724] px-4 py-2.5 text-sm font-medium text-white">{working ? "Reading statement…" : "Review extracted records"}<ArrowRight size={15} /></button>}
      </form>}
      <p className="mt-5 flex items-start gap-2 border-t border-[#e5e4de] pt-4 text-xs leading-5 text-[#575953]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#6c8268]" />Your file is processed temporarily and is not stored. No transaction is saved until you confirm the review.</p>
    </section>}

    {preview && <section className="rounded-xl border border-[#e5e4de] bg-white p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="prototype-eyebrow">Review before saving</span><h2 className="mt-1 text-xl font-semibold">{rows.length ? `${rows.length} transaction${rows.length === 1 ? "" : "s"} detected` : "No transactions detected"}</h2><p className="mt-1 text-xs text-[#62645d]">{file?.name} · Your file is not stored by Finora.</p></div><span className="rounded-full bg-[#eeede8] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#414340]">{preview.format === "image" ? "Scanned image" : preview.format === "pdf" ? "PDF statement" : "CSV statement"}</span></div>
      {preview.needs_review && <div className="mt-4 rounded-md border border-[#e9d5b8] bg-[#faf7ef] p-3 text-xs leading-5 text-[#725b43]" role="note"><strong>Review before saving.</strong> {preview.format === "image" || preview.format === "pdf" ? "Scanned text can be misread; OCR is a draft, not a verified bank record. Check every date and amount against the original." : "CSV column labels and debit or credit conventions vary by bank. Check the extracted dates, directions, and amounts against your statement."}</div>}
      {preview.warnings.map((warning) => <p key={warning} className="mt-3 text-xs text-[#8b4a3d]">{warning}</p>)}
      {rows.length === 0 ? <div className="mt-5 rounded-lg bg-[#f5f4f0] p-5"><p className="text-sm font-medium">Nothing has been imported.</p><p className="mt-1 text-xs leading-5 text-[#575953]">We could not find transaction rows in this statement. Try another file or a clearer scan. Your account label remains saved, but this statement added no transactions.</p><button type="button" onClick={() => { setPreview(null); setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }} className="prototype-inline-link mt-3 text-sm font-medium">Choose another statement</button></div> : <>
        <div className="statement-review-grid mt-5 grid gap-4 xl:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
          <StatementSourcePreview file={file} previewUrl={previewUrl} />
          <div className="min-w-0">
            <div className="overflow-x-auto rounded-lg border border-[#e5e4de]">
              <table id="statement-review-table" className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-[#f5f4f0] text-[#575953]"><tr>{["Date", "Description", "Type", "Amount", "Category"].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#e5e4de]">
                  {visibleRows.map((row, pageIndex) => {
                    const index = firstVisibleRow + pageIndex;
                    return <tr key={`${row.reference_id}-${index}`} className={rowErrors[index] ? "bg-[#fff0ee]" : ""}>
                      <td className="px-2 py-2"><input aria-label={`Date for row ${index + 1}`} type="date" required value={row.occurred_at.slice(0, 10)} onChange={(event) => updateRow(index, { occurred_at: `${event.target.value}T00:00:00.000Z` })} className="min-h-9 w-[142px] rounded border border-[#d5d4cc] px-2" /></td>
                      <td className="px-2 py-2"><input aria-label={`Description for row ${index + 1}`} required maxLength={500} value={row.raw_description} onChange={(event) => updateRow(index, { raw_description: event.target.value })} className="min-h-9 w-[210px] rounded border border-[#d5d4cc] px-2" /></td>
                      <td className="px-2 py-2"><select aria-label={`Transaction type for row ${index + 1}`} value={row.transaction_type} onChange={(event) => updateRow(index, { transaction_type: event.target.value as StatementDraftTransaction["transaction_type"] })} className="min-h-9 rounded border border-[#d5d4cc] bg-white px-2"><option value="DEBIT">Debit</option><option value="CREDIT">Credit</option><option value="TRANSFER">Transfer</option></select></td>
                      <td className="px-2 py-2"><input aria-label={`Amount for row ${index + 1}`} type="number" required min="0.01" step="0.01" value={row.amount} onChange={(event) => updateRow(index, { amount: Number(event.target.value) })} className="min-h-9 w-28 rounded border border-[#d5d4cc] px-2 text-right" /></td>
                      <td className="px-2 py-2"><input aria-label={`Category for row ${index + 1}`} required maxLength={100} value={row.category_name} onChange={(event) => updateRow(index, { category_name: event.target.value })} className="min-h-9 w-32 rounded border border-[#d5d4cc] px-2" /></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            {rows.length > STATEMENT_REVIEW_PAGE_SIZE && <nav aria-label="Statement review pagination" className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#575953]" aria-live="polite">
                Showing {firstVisibleRow + 1}–{Math.min(firstVisibleRow + STATEMENT_REVIEW_PAGE_SIZE, rows.length)} of {rows.length} records · Page {reviewPage} of {reviewPageCount}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setReviewPage((page) => Math.max(1, page - 1))} disabled={reviewPage === 1} aria-label="Previous transaction page" className="inline-flex min-h-10 items-center gap-1 rounded-md border border-[#d5d4cc] px-3 text-xs font-medium text-[#414340] disabled:opacity-45">
                  <ChevronLeft size={15} aria-hidden="true" />Previous
                </button>
                <button type="button" onClick={() => setReviewPage((page) => Math.min(reviewPageCount, page + 1))} disabled={reviewPage === reviewPageCount} aria-label="Next transaction page" className="inline-flex min-h-10 items-center gap-1 rounded-md border border-[#d5d4cc] px-3 text-xs font-medium text-[#414340] disabled:opacity-45">
                  Next<ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </nav>}
          </div>
        </div>
        {hasInvalidRows && <p className="mt-3 text-xs text-[#9f2f2d]" role="alert">Fix highlighted fields on every page before saving.</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#e5e4de] pt-4"><button type="button" disabled={working || hasInvalidRows} onClick={saveTransactions} className="prototype-primary-action inline-flex min-h-11 items-center gap-2 rounded-md bg-[#20211f] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{working ? "Saving…" : `Confirm and save ${rows.length} record${rows.length === 1 ? "" : "s"}`}<Check size={15} /></button><button type="button" disabled={working} onClick={() => { setPreview(null); setRows([]); }} className="min-h-11 rounded-md border border-[#d5d4cc] px-4 py-2.5 text-sm">Back</button><p className="text-xs text-[#62645d]">Only these reviewed rows will be saved.</p></div>
      </>}
    </section>}
    {error && <p role="alert" className="mt-4 rounded-md bg-[#fdebec] p-3 text-sm text-[#9f2f2d]">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-md bg-[#edf5ed] p-3 text-sm text-[#3e6545]">{notice}</p>}
  </>;
}

function StatementSourcePreview({ file, previewUrl }: { file: File | null; previewUrl: string }) {
  if (!file || !previewUrl) return <div className="flex min-h-44 items-center justify-center rounded-lg bg-[#f5f4f0] p-4 text-xs text-[#62645d]">Original file preview unavailable.</div>;
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return <iframe title="Selected statement PDF" src={previewUrl} className="min-h-[360px] w-full rounded-lg border border-[#e5e4de]" />;
  if (file.type.startsWith("image/") || /\.(png|jpe?g)$/i.test(file.name)) return (
    // This is a local object URL preview; Next Image optimization cannot handle it.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={previewUrl} alt="Selected statement for review" className="max-h-[560px] w-full rounded-lg border border-[#e5e4de] object-contain" />
  );
  return <div className="flex min-h-44 flex-col justify-center rounded-lg bg-[#f5f4f0] p-5"><span className="text-xs font-medium">Original CSV file</span><span className="mt-1 break-all text-xs text-[#62645d]">{file.name}</span><p className="mt-3 text-xs leading-5 text-[#575953]">Compare the extracted rows with your bank’s original CSV if anything looks unexpected.</p></div>;
}
