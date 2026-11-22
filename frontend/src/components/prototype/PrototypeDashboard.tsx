"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  Check,
  FileUp,
  LayoutDashboard,
  LogOut,
  RotateCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FinoraMark } from "@/components/brand/FinoraMark";
import { createClient } from "@/lib/supabase/client";
import {
  BankAccountSummary,
  createBankAccount,
  confirmStatementImport,
  fetchBankAccounts,
  fetchUserTransactions,
  previewStatement,
  StatementDraftTransaction,
  StatementPreview,
} from "@/lib/api";
import { CanonicalTransaction } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { endDemoSession } from "@/lib/demo-session";
import "./prototype-dashboard.css";

type Section = "overview" | "transactions" | "accounts" | "import";
type AccountType = "SAVINGS" | "CURRENT" | "CREDIT";

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowDownLeft },
  { id: "accounts", label: "Accounts", icon: WalletCards },
  { id: "import", label: "Add a statement", icon: FileUp },
];

const MAX_STATEMENT_UPLOAD_BYTES = 4 * 1024 * 1024;

export function PrototypeDashboard({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [accounts, setAccounts] = useState<BankAccountSummary[]>([]);
  const [transactions, setTransactions] = useState<CanonicalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    endDemoSession();
    let active = true;
    async function loadWorkspace() {
      setLoading(true);
      setLoadError("");
      try {
        const [loadedAccounts, loadedTransactions] = await Promise.all([
          fetchBankAccounts(),
          fetchUserTransactions(),
        ]);
        if (!active) return;
        setAccounts(loadedAccounts);
        setTransactions(loadedTransactions);
      } catch {
        if (active) setLoadError("We couldn’t load your financial records. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadWorkspace();
    return () => { active = false; };
  }, [retryKey]);

  async function reloadWorkspace() {
    setRefreshError("");
    try {
      const [loadedAccounts, loadedTransactions] = await Promise.all([
        fetchBankAccounts(),
        fetchUserTransactions(),
      ]);
      setAccounts(loadedAccounts);
      setTransactions(loadedTransactions);
    } catch {
      setRefreshError("Your import was saved, but we couldn’t refresh the workspace. Reload the page to see the latest records.");
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
      setSigningOut(false);
    }
  }

  const handleAccountCreated = (account: BankAccountSummary) => {
    setAccounts((current) => [...current, account]);
  };

  const handleImportComplete = async () => {
    await reloadWorkspace();
  };

  return (
    <div className="finora-prototype min-h-screen bg-[#f3eee5] text-[#28231f]">
      <aside className="prototype-sidebar fixed inset-y-0 left-0 hidden w-[244px] flex-col border-r border-[#e3d9cc] bg-[#f8f4ec] px-4 py-5 md:flex">
        <div className="prototype-brand mb-10 px-2"><FinoraMark size="md" /><div className="prototype-brand-caption pl-1 text-[11px] text-[#837970]">Personal finance workspace</div></div>
        <div className="prototype-nav-label mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#968d82]">Your workspace</div>
        <nav className="prototype-nav space-y-1" aria-label="Workspace sections">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className={`prototype-nav-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${section === id ? "is-active bg-[#f4eee7] font-semibold text-[#4e342e]" : "text-[#6f675f] hover:bg-[#f8f6f2] hover:text-[#28231f]"}`}>
              <Icon size={16} strokeWidth={1.8} />{label}
            </button>
          ))}
        </nav>
        <div className="prototype-sidebar-note mt-auto rounded-lg border border-[#e9e4db] bg-[#fbfaf7] p-3 text-xs text-[#766e65]">
          <div className="mb-1 flex items-center gap-2 font-medium text-[#4e342e]"><ShieldCheck size={14} /> Your records</div>
          Only records you confirm are saved to your account. Finora never asks for your bank password.
        </div>
      </aside>

      <div className="md:pl-[244px]">
        <header className="prototype-topbar sticky top-0 z-20 border-b border-[#e8e4dc] bg-[#f3eee5]/95 px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="min-w-0"><div className="prototype-breadcrumb text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c7465]">Finora <span aria-hidden="true">/</span> Personal</div><div className="mt-1 text-sm font-semibold">{navigation.find((item) => item.id === section)?.label}</div></div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="prototype-status hidden items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"><span aria-hidden="true" /> Private workspace</span>
              <span className="hidden max-w-44 truncate text-xs font-medium sm:block">{userEmail || userName}</span>
              <button type="button" onClick={signOut} disabled={signingOut} className="prototype-signout rounded-md p-2 text-[#766e65]" aria-label="Log out"><LogOut size={16} /></button>
            </div>
          </div>
          <nav className="prototype-mobile-nav mx-auto mt-3 flex max-w-[1280px] gap-1 overflow-x-auto pb-0.5 md:hidden" aria-label="Workspace sections">
            {navigation.map(({ id, label }) => <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className={`shrink-0 rounded-md px-3 py-2 text-xs ${section === id ? "bg-[#4e342e] text-white" : "bg-white text-[#655c54]"}`}>{label}</button>)}
          </nav>
        </header>

        <main className="prototype-content mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8" aria-busy={loading}>
          {refreshError && <p role="alert" className="mb-4 rounded-md border border-[#ead7d2] bg-white p-3 text-sm text-[#9f2f2d]">{refreshError}</p>}
          {loading ? <LoadingWorkspace /> : loadError ? <LoadError message={loadError} onRetry={() => setRetryKey((key) => key + 1)} /> : (
            <>
              {section === "import" ? (
                <StatementImportFlow accounts={accounts} onAccountCreated={handleAccountCreated} onComplete={handleImportComplete} />
              ) : section === "accounts" ? (
                <AccountsView accounts={accounts} onAdd={() => setSection("import")} />
              ) : section === "transactions" ? (
                <TransactionsView transactions={transactions} onAdd={() => setSection("import")} />
              ) : (
                <OverviewView userName={userName} accounts={accounts} transactions={transactions} onAdd={() => setSection("import")} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingWorkspace() {
  return <div role="status" className="rounded-xl border border-[#e8e4dc] bg-white p-8 text-sm text-[#766e65]">Loading your workspace…</div>;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className="rounded-xl border border-[#ead7d2] bg-white p-7" role="alert"><h1 className="text-xl font-semibold">Your records are temporarily unavailable</h1><p className="mt-2 text-sm text-[#766e65]">{message}</p><button type="button" onClick={onRetry} className="prototype-primary-action mt-5 inline-flex items-center gap-2 rounded-md bg-[#4e342e] px-4 py-2.5 text-sm font-medium text-white"><RotateCw size={15} /> Try again</button></section>;
}

function OverviewView({ userName, accounts, transactions, onAdd }: { userName: string; accounts: BankAccountSummary[]; transactions: CanonicalTransaction[]; onAdd: () => void }) {
  if (transactions.length === 0) {
    return accounts.length === 0 ? <FirstUseEmptyState userName={userName} onAdd={onAdd} /> : <NoTransactionsState accounts={accounts} onAdd={onAdd} />;
  }

  const mostRecent = transactions.slice(0, 5);
  return <>
    <PageTitle title={userName ? `Welcome, ${userName.split(" ")[0]}.` : "Your money, in one view."} description="A clear view of the records you’ve added to Finora." action={<button type="button" onClick={onAdd} className="prototype-primary-action inline-flex items-center gap-2 rounded-md bg-[#4e342e] px-3.5 py-2.5 text-sm font-medium text-white"><FileUp size={16} /> Add a statement</button>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Metric label="Accounts added" value={String(accounts.length)} detail="Only accounts you added" icon={WalletCards} />
      <Metric label="Imported transactions" value={String(transactions.length)} detail={transactions.length === 200 ? "Showing the latest 200 records" : "Confirmed records"} icon={ArrowDownLeft} />
    </div>
    <section className="mt-6 rounded-xl border border-[#e8e4dc] bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="prototype-eyebrow">Your records</span><h2 className="mt-1 font-semibold">Recent transactions</h2></div><button type="button" onClick={onAdd} className="prototype-inline-link inline-flex items-center gap-1 text-xs font-medium">Add another statement <ArrowRight size={14} /></button></div>
      <TransactionRows transactions={mostRecent} />
    </section>
    <p className="mt-4 text-xs text-[#837970]">Balances and insights appear only when they can be calculated from your imported records.</p>
  </>;
}

function FirstUseEmptyState({ userName, onAdd }: { userName: string; onAdd: () => void }) {
  return <section className="mx-auto max-w-3xl rounded-2xl border border-[#e6d8c9] bg-[#fffaf2] px-6 py-10 md:px-12 md:py-14">
    <span className="prototype-eyebrow">Your finances, in context</span>
    <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">{userName ? `Welcome, ${userName.split(" ")[0]}.` : "Welcome to Finora."}<br />Start with your own records.</h1>
    <p className="mt-4 max-w-xl text-sm leading-6 text-[#766e65]">Your workspace is empty because no financial records have been added. Import a bank statement to review your transactions and build your personal view.</p>
    <button type="button" onClick={onAdd} className="prototype-primary-action mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#352720] px-5 py-3 text-sm font-medium text-white"><FileUp size={17} /> Add a bank statement <ArrowRight size={16} /></button>
    <div className="mt-8 grid gap-3 border-t border-[#eadfd1] pt-5 text-xs leading-5 text-[#766e65] sm:grid-cols-2">
      <p><strong className="font-semibold text-[#4e342e]">No bank login.</strong> We never ask for your online banking password or full account number.</p>
      <p><strong className="font-semibold text-[#4e342e]">You review first.</strong> The original statement is processed temporarily; only records you confirm are saved.</p>
    </div>
    <p className="mt-5 text-xs text-[#8b7d71]">Supported: CSV, PDF, PNG, JPG. Scanned files need careful review.</p>
  </section>;
}

function NoTransactionsState({ accounts, onAdd }: { accounts: BankAccountSummary[]; onAdd: () => void }) {
  return <section className="rounded-xl border border-[#e8e4dc] bg-white px-6 py-10 md:px-10">
    <span className="prototype-eyebrow">{accounts.length === 1 ? accounts[0].institution_name : `${accounts.length} accounts`}</span>
    <h1 className="mt-3 text-2xl font-semibold">No transactions found yet.</h1>
    <p className="mt-2 max-w-xl text-sm leading-6 text-[#766e65]">Your account is saved, but there are no confirmed transaction records. The statement may have been empty or contained a layout we couldn’t read. Nothing has been invented or imported without your confirmation.</p>
    <button type="button" onClick={onAdd} className="prototype-primary-action mt-6 inline-flex items-center gap-2 rounded-md bg-[#4e342e] px-4 py-2.5 text-sm font-medium text-white"><FileUp size={16} /> Try another statement <ArrowRight size={15} /></button>
  </section>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof WalletCards }) {
  return <section className="rounded-xl border border-[#e8e4dc] bg-white p-5"><div className="flex items-start justify-between text-xs text-[#777067]"><span>{label}</span><Icon size={16} className="text-[#8d7769]" /></div><div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div><div className="mt-1 text-xs text-[#938b82]">{detail}</div></section>;
}

function TransactionsView({ transactions, onAdd }: { transactions: CanonicalTransaction[]; onAdd: () => void }) {
  return <><PageTitle title="Transactions" description="Only records imported from statements and confirmed by you appear here." action={<button type="button" onClick={onAdd} className="prototype-primary-action inline-flex items-center gap-2 rounded-md bg-[#4e342e] px-3.5 py-2.5 text-sm font-medium text-white"><FileUp size={16} /> Add a statement</button>} />
    {transactions.length ? <section className="rounded-xl border border-[#e8e4dc] bg-white p-5"><TransactionRows transactions={transactions} /></section> : <EmptyPanel title="No transactions yet" body="After you review and confirm a statement, its transaction records will appear here." onAdd={onAdd} />}
  </>;
}

function AccountsView({ accounts, onAdd }: { accounts: BankAccountSummary[]; onAdd: () => void }) {
  return <><PageTitle title="Accounts" description="Account labels you added to organize your statements. Finora is not connected to your bank." action={<button type="button" onClick={onAdd} className="prototype-primary-action inline-flex items-center gap-2 rounded-md bg-[#4e342e] px-3.5 py-2.5 text-sm font-medium text-white"><FileUp size={16} /> Add an account</button>} />
    {accounts.length ? <div className="grid gap-3 sm:grid-cols-2">{accounts.map((account) => <section key={account.id} className="rounded-xl border border-[#e8e4dc] bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4eee7] text-[#694b3b]"><WalletCards size={18} /></span><div><h2 className="font-semibold">{account.institution_name}</h2><p className="mt-1 text-xs text-[#837970]">{account.account_type.toLowerCase()} · {account.account_number_masked}</p></div></div><p className="mt-4 text-xs text-[#837970]">{account.currency} · statement imports only</p></section>)}</div> : <EmptyPanel title="No accounts added" body="Add an account label when you import your first bank statement. You don’t need to share your full account number." onAdd={onAdd} />}
  </>;
}

function EmptyPanel({ title, body, onAdd }: { title: string; body: string; onAdd: () => void }) {
  return <section className="rounded-xl border border-[#e8e4dc] bg-white px-6 py-9"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm text-[#766e65]">{body}</p><button type="button" onClick={onAdd} className="prototype-inline-link mt-4 inline-flex items-center gap-1 text-sm font-medium">Add a bank statement <ArrowRight size={14} /></button></section>;
}

function TransactionRows({ transactions }: { transactions: CanonicalTransaction[] }) {
  return <div className="mt-4 divide-y divide-[#f0ede7]">
    {transactions.map((transaction) => {
      const credit = transaction.transaction_type === "CREDIT";
      const date = new Date(transaction.occurred_at);
      return <article key={transaction.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><div className="truncate text-sm font-medium">{transaction.raw_description}</div><div className="mt-1 text-[11px] text-[#8a8279]">{Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · {transaction.category_name}</div></div>
        <div className={`shrink-0 text-sm font-medium tabular-nums ${credit ? "text-[#477250]" : "text-[#433b35]"}`}>{credit ? "+" : "−"}{formatCurrency(transaction.amount, transaction.currency)}</div>
      </article>;
    })}
  </div>;
}

function PageTitle({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="prototype-page-title mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="prototype-eyebrow">Your finances, in context</span><h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#777067]">{description}</p></div>{action}</div>;
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
      setError("This file is larger than 4 MB. Choose a smaller statement to upload it here.");
      setNotice("");
      return;
    }
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
    setFile(nextFile);
    setPreview(null);
    setRows([]);
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

  return <>
    <PageTitle title="Add a bank statement" description="Import a statement, review the extracted records, then choose what to save." />
    {accounts.length > 0 && !showAccountForm && !preview && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[#e8e4dc] bg-white px-4 py-3 text-sm">
      <label htmlFor="statement-account" className="text-xs font-medium text-[#655c54]">Save under</label>
      <select id="statement-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setNotice(""); }} className="min-h-10 rounded-md border border-[#ddd6cb] bg-white px-3 text-sm">
        {accounts.map((account) => <option key={account.id} value={account.id}>{account.institution_name} · {account.account_number_masked}</option>)}
      </select>
      <button type="button" className="prototype-inline-link text-xs font-medium" onClick={() => setShowAccountForm(true)}>Add another account</button>
    </div>}

    {showAccountForm && <form onSubmit={saveAccount} className="mb-5 rounded-xl border border-[#e8e4dc] bg-white p-5">
      <h2 className="font-semibold">Label this account</h2>
      <p className="mt-1 text-xs leading-5 text-[#837970]">This creates an account label only. It does not connect to your bank or upload a statement. A last-four label is optional; never enter the full number.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-[#655c54]">Bank or institution<input required maxLength={100} value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="e.g. Your bank" className="prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#ddd6cb] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-medium text-[#655c54]">Account type<select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)} className="prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#ddd6cb] bg-white px-3 text-sm font-normal"><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option><option value="CREDIT">Credit</option></select></label>
        <label className="text-xs font-medium text-[#655c54]">Last four digits (optional)<input value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="1234" className="prototype-field mt-1.5 block min-h-11 w-full rounded-md border border-[#ddd6cb] px-3 text-sm font-normal" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={working} className="prototype-primary-action rounded-md bg-[#4e342e] px-4 py-2.5 text-sm font-medium text-white">{working ? "Saving…" : "Save account label"}</button>{accounts.length > 0 && <button type="button" onClick={() => setShowAccountForm(false)} className="rounded-md border border-[#ddd6cb] px-4 py-2.5 text-sm">Cancel</button>}</div>
    </form>}

    {!showAccountForm && !preview && <section className="rounded-xl border border-[#e8e4dc] bg-white p-5 md:p-7">
      <div className="flex items-start gap-3"><div className="rounded-md bg-[#f4eee7] p-2.5 text-[#694b3b]"><FileUp size={18} /></div><div><h2 className="font-semibold">Choose your statement</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-[#837970]">CSV works best when it includes date, description, and separate debit/credit columns or a transaction type. PDF, PNG, and JPG need the optional OCR runtime, which is not installed in this Vercel demo. Scanned text can contain extraction mistakes and always needs careful review.</p></div></div>
      {accounts.length === 0 ? <p className="mt-5 rounded-md bg-[#faf8f4] p-3 text-xs text-[#766e65]">Add an account label above before choosing a statement.</p> : <form onSubmit={inspectStatement} className="mt-5">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#cdbdad] bg-[#fcfbf8] px-5 text-center hover:bg-[#faf7f1] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#9a7359]">
          <FileUp className="mb-3 text-[#8c725e]" size={24} /><span className="text-sm font-medium">{file ? file.name : "Select a statement file"}</span><span className="mt-1 text-xs text-[#837970]">Maximum 4 MB · PDF up to 20 pages · CSV, PDF, PNG, JPG</span><input type="file" accept=".csv,.pdf,.png,.jpg,.jpeg,text/csv,application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
        </label>
        {file && <button type="submit" disabled={working} className="prototype-primary-action mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#4e342e] px-4 py-2.5 text-sm font-medium text-white">{working ? "Reading statement…" : "Review extracted records"}<ArrowRight size={15} /></button>}
      </form>}
      <p className="mt-5 flex items-start gap-2 border-t border-[#eeeae3] pt-4 text-xs leading-5 text-[#766e65]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#6c8268]" />Your file is processed temporarily and is not stored. No transaction is saved until you confirm the review.</p>
    </section>}

    {preview && <section className="rounded-xl border border-[#e8e4dc] bg-white p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="prototype-eyebrow">Review before saving</span><h2 className="mt-1 text-xl font-semibold">{rows.length ? `${rows.length} transaction${rows.length === 1 ? "" : "s"} detected` : "No transactions detected"}</h2><p className="mt-1 text-xs text-[#837970]">{file?.name} · Your file is not stored by Finora.</p></div><span className="rounded-full bg-[#f4eee7] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#694b3b]">{preview.format === "image" ? "Scanned image" : preview.format === "pdf" ? "PDF statement" : "CSV statement"}</span></div>
      {preview.needs_review && <div className="mt-4 rounded-md border border-[#e9d5b8] bg-[#fff9ee] p-3 text-xs leading-5 text-[#725b43]" role="note"><strong>Review before saving.</strong> {preview.format === "image" || preview.format === "pdf" ? "Scanned text can be misread; OCR is a draft, not a verified bank record. Check every date and amount against the original." : "CSV column labels and debit or credit conventions vary by bank. Check the extracted dates, directions, and amounts against your statement."}</div>}
      {preview.warnings.map((warning) => <p key={warning} className="mt-3 text-xs text-[#8b4a3d]">{warning}</p>)}
      {rows.length === 0 ? <div className="mt-5 rounded-lg bg-[#faf8f4] p-5"><p className="text-sm font-medium">Nothing has been imported.</p><p className="mt-1 text-xs leading-5 text-[#766e65]">We could not find transaction rows in this statement. Try another file or a clearer scan. Your account label remains saved, but this statement added no transactions.</p><button type="button" onClick={() => { setPreview(null); setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }} className="prototype-inline-link mt-3 text-sm font-medium">Choose another statement</button></div> : <>
        <div className="statement-review-grid mt-5 grid gap-4 xl:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
          <StatementSourcePreview file={file} previewUrl={previewUrl} />
          <div className="overflow-x-auto rounded-lg border border-[#e8e4dc]"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#faf9f6] text-[#777067]"><tr>{["Date", "Description", "Type", "Amount", "Category"].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#f0ede7]">{rows.map((row, index) => <tr key={`${row.reference_id}-${index}`} className={rowErrors[index] ? "bg-[#fff0ee]" : ""}>
            <td className="px-2 py-2"><input aria-label={`Date for row ${index + 1}`} type="date" required value={row.occurred_at.slice(0, 10)} onChange={(event) => updateRow(index, { occurred_at: `${event.target.value}T00:00:00.000Z` })} className="min-h-9 w-[142px] rounded border border-[#ddd6cb] px-2" /></td>
            <td className="px-2 py-2"><input aria-label={`Description for row ${index + 1}`} required maxLength={500} value={row.raw_description} onChange={(event) => updateRow(index, { raw_description: event.target.value })} className="min-h-9 w-[210px] rounded border border-[#ddd6cb] px-2" /></td>
            <td className="px-2 py-2"><select aria-label={`Transaction type for row ${index + 1}`} value={row.transaction_type} onChange={(event) => updateRow(index, { transaction_type: event.target.value as StatementDraftTransaction["transaction_type"] })} className="min-h-9 rounded border border-[#ddd6cb] bg-white px-2"><option value="DEBIT">Debit</option><option value="CREDIT">Credit</option><option value="TRANSFER">Transfer</option></select></td>
            <td className="px-2 py-2"><input aria-label={`Amount for row ${index + 1}`} type="number" required min="0.01" step="0.01" value={row.amount} onChange={(event) => updateRow(index, { amount: Number(event.target.value) })} className="min-h-9 w-28 rounded border border-[#ddd6cb] px-2 text-right" /></td>
            <td className="px-2 py-2"><input aria-label={`Category for row ${index + 1}`} required maxLength={100} value={row.category_name} onChange={(event) => updateRow(index, { category_name: event.target.value })} className="min-h-9 w-32 rounded border border-[#ddd6cb] px-2" /></td>
          </tr>)}</tbody></table></div>
        </div>
        {hasInvalidRows && <p className="mt-3 text-xs text-[#9f2f2d]" role="alert">Fix highlighted dates, descriptions, categories, or amounts before saving.</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#eeeae3] pt-4"><button type="button" disabled={working || hasInvalidRows} onClick={saveTransactions} className="prototype-primary-action inline-flex min-h-11 items-center gap-2 rounded-md bg-[#352720] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{working ? "Saving…" : `Confirm and save ${rows.length} record${rows.length === 1 ? "" : "s"}`}<Check size={15} /></button><button type="button" disabled={working} onClick={() => { setPreview(null); setRows([]); }} className="min-h-11 rounded-md border border-[#ddd6cb] px-4 py-2.5 text-sm">Back</button><p className="text-xs text-[#837970]">Only these reviewed rows will be saved.</p></div>
      </>}
    </section>}
    {error && <p role="alert" className="mt-4 rounded-md bg-[#fdebec] p-3 text-sm text-[#9f2f2d]">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-md bg-[#edf5ed] p-3 text-sm text-[#3e6545]">{notice}</p>}
  </>;
}

function StatementSourcePreview({ file, previewUrl }: { file: File | null; previewUrl: string }) {
  if (!file || !previewUrl) return <div className="flex min-h-44 items-center justify-center rounded-lg bg-[#faf8f4] p-4 text-xs text-[#837970]">Original file preview unavailable.</div>;
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return <iframe title="Selected statement PDF" src={previewUrl} className="min-h-[360px] w-full rounded-lg border border-[#e8e4dc]" />;
  if (file.type.startsWith("image/") || /\.(png|jpe?g)$/i.test(file.name)) return (
    // This is a local object URL preview; Next Image optimization cannot handle it.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={previewUrl} alt="Selected statement for review" className="max-h-[560px] w-full rounded-lg border border-[#e8e4dc] object-contain" />
  );
  return <div className="flex min-h-44 flex-col justify-center rounded-lg bg-[#faf8f4] p-5"><span className="text-xs font-medium">Original CSV file</span><span className="mt-1 break-all text-xs text-[#837970]">{file.name}</span><p className="mt-3 text-xs leading-5 text-[#766e65]">Compare the extracted rows with your bank’s original CSV if anything looks unexpected.</p></div>;
}
