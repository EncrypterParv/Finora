"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileUp, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import {
  BankAccountSummary,
  createManualTransaction,
  deleteTransaction,
  fetchTransactionPage,
  TransactionFilters,
} from "@/lib/api";
import { CanonicalTransaction, TransactionType } from "@/types/transaction";
import {
  ConfirmStrip,
  EmptyPanel,
  ErrorNote,
  Field,
  IconButton,
  inputClass,
  PageTitle,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SuccessNote,
  formatDate,
  money,
  todayIso,
  toNumber,
} from "./prototype-ui";
import { TransactionsLoadingSkeleton } from "./PrototypeSkeletons";

const PAGE_SIZE = 25;

const typeOptions: { value: "" | TransactionType; label: string }[] = [
  { value: "", label: "All" },
  { value: "DEBIT", label: "Spending" },
  { value: "CREDIT", label: "Income" },
  { value: "TRANSFER", label: "Transfers" },
];

type MoreFilters = { account_id: string; start_date: string; end_date: string; min_amount: string; max_amount: string };
const emptyMoreFilters: MoreFilters = { account_id: "", start_date: "", end_date: "", min_amount: "", max_amount: "" };

// Transactions screen: server-side search, filters and pages, plus adding cash entries and deleting rows.
export function TransactionsScreen({ accounts, onRecordsChanged, onAddStatement }: { accounts: BankAccountSummary[]; onRecordsChanged: () => Promise<void> | void; onAddStatement: () => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | TransactionType>("");
  const [more, setMore] = useState<MoreFilters>(emptyMoreFilters);
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<CanonicalTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Wait until typing pauses before searching, like a debounced input in React apps.
  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const amountError = more.min_amount !== "" && more.max_amount !== "" && Number(more.min_amount) > Number(more.max_amount)
    ? "The minimum amount is higher than the maximum."
    : more.start_date && more.end_date && more.start_date > more.end_date
      ? "The start date is after the end date."
      : "";

  const filters = useMemo<TransactionFilters>(() => ({
    q: search || undefined,
    transaction_type: type || undefined,
    account_id: more.account_id || undefined,
    start_date: more.start_date || undefined,
    end_date: more.end_date || undefined,
    min_amount: more.min_amount === "" ? undefined : Number(more.min_amount),
    max_amount: more.max_amount === "" ? undefined : Number(more.max_amount),
  }), [search, type, more]);

  const activeExtraFilters = Object.values(more).filter(Boolean).length;
  const anyFilter = Boolean(search || type || activeExtraFilters);

  useEffect(() => {
    if (amountError) return;
    let active = true;
    setLoading(true);
    setError("");
    fetchTransactionPage(filters, PAGE_SIZE, page * PAGE_SIZE)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your transactions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page, reloadKey, amountError]);

  const accountLabel = useMemo(() => new Map(accounts.map((account) => [account.id, account.institution_name])), [accounts]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstShown = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastShown = Math.min(total, page * PAGE_SIZE + items.length);

  function updateMore(update: Partial<MoreFilters>) {
    setMore((current) => ({ ...current, ...update }));
    setPage(0);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setType("");
    setMore(emptyMoreFilters);
    setPage(0);
  }

  async function removeTransaction(id: string) {
    setDeleting(true);
    setError("");
    try {
      await deleteTransaction(id);
      setConfirmId(null);
      setNotice("Transaction deleted.");
      if (items.length === 1 && page > 0) setPage(page - 1);
      setReloadKey((key) => key + 1);
      await onRecordsChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this transaction.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAdded() {
    setShowAdd(false);
    setNotice("Transaction added.");
    setPage(0);
    setReloadKey((key) => key + 1);
    await onRecordsChanged();
  }

  return <>
    <PageTitle
      title="Transactions"
      description="Search and filter every record you’ve confirmed, add cash spending by hand, or remove a mistake."
      action={<>
        <SecondaryButton onClick={() => { setShowAdd((open) => !open); setNotice(""); }} aria-expanded={showAdd}><Plus size={16} /> Add a transaction</SecondaryButton>
        <PrimaryButton onClick={onAddStatement}><FileUp size={16} /> Add a statement</PrimaryButton>
      </>}
    />

    {showAdd && <AddTransactionForm accounts={accounts} onCancel={() => setShowAdd(false)} onSaved={handleAdded} onAddStatement={onAddStatement} />}

    <Panel className="mb-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search descriptions</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#62645d]" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="Search descriptions, e.g. Swiggy" className={`${inputClass} !mt-0 pl-9`} />
        </label>
        <div className="prototype-segmented" role="radiogroup" aria-label="Transaction type">
          {typeOptions.map((option) => <button key={option.label} type="button" role="radio" aria-checked={type === option.value} onClick={() => { setType(option.value); setPage(0); }}>{option.label}</button>)}
        </div>
        <SecondaryButton onClick={() => setShowMore((open) => !open)} aria-expanded={showMore}><SlidersHorizontal size={15} /> More filters{activeExtraFilters ? ` (${activeExtraFilters})` : ""}</SecondaryButton>
        {anyFilter && <button type="button" onClick={clearFilters} className="prototype-inline-link inline-flex items-center gap-1 text-xs font-medium"><X size={14} /> Clear filters</button>}
      </div>
      {showMore && <div className="mt-4 grid gap-3 border-t border-[#e5e4de] pt-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Account"><select value={more.account_id} onChange={(event) => updateMore({ account_id: event.target.value })} className={inputClass}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.institution_name} · {account.account_number_masked}</option>)}</select></Field>
        <Field label="From"><input type="date" value={more.start_date} onChange={(event) => updateMore({ start_date: event.target.value })} className={inputClass} /></Field>
        <Field label="To"><input type="date" value={more.end_date} onChange={(event) => updateMore({ end_date: event.target.value })} className={inputClass} /></Field>
        <Field label="Minimum amount (₹)"><input type="number" min="0" step="0.01" inputMode="decimal" value={more.min_amount} onChange={(event) => updateMore({ min_amount: event.target.value })} className={inputClass} /></Field>
        <Field label="Maximum amount (₹)"><input type="number" min="0" step="0.01" inputMode="decimal" value={more.max_amount} onChange={(event) => updateMore({ max_amount: event.target.value })} className={inputClass} /></Field>
      </div>}
      {amountError && <p role="alert" className="mt-3 text-xs text-[#9f2f2d]">{amountError}</p>}
    </Panel>

    {notice && <div className="mb-4"><SuccessNote message={notice} /></div>}
    {error && <div className="mb-4"><ErrorNote message={error} /></div>}

    {loading && items.length === 0 && !error ? <TransactionsLoadingSkeleton /> : !loading && total === 0 && !error ? (
      anyFilter
        ? <Panel className="px-6 py-9"><h2 className="text-lg font-semibold">No transactions match these filters</h2><p className="mt-2 text-sm text-[#575953]">Try a shorter search or a wider date range.</p><button type="button" onClick={clearFilters} className="prototype-inline-link mt-3 text-sm font-medium">Clear filters</button></Panel>
        : <EmptyPanel title="No transactions yet" body="Import a bank statement, or add a cash transaction by hand. Only records you confirm are saved." onAdd={onAddStatement} />
    ) : (
      <Panel className="p-5" >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#62645d]" aria-live="polite">
          <span>{loading ? "Loading transactions…" : `Showing ${firstShown}–${lastShown} of ${total}`}</span>
          {pageCount > 1 && <span>Page {page + 1} of {pageCount}</span>}
        </div>
        <ul className={`mt-3 divide-y divide-[#e5e4de] ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          {items.map((transaction) => {
            const credit = transaction.transaction_type === "CREDIT";
            const transfer = transaction.transaction_type === "TRANSFER";
            const meta = [transaction.category_name, accountLabel.get(transaction.account_id), transaction.source === "MANUAL" ? "Added by hand" : ""].filter(Boolean).join(" · ");
            return <li key={transaction.id} className="py-3">
              <div className="flex items-center gap-3">
                <div className="hidden w-[74px] shrink-0 text-xs tabular-nums text-[#62645d] sm:block">{formatDate(transaction.occurred_at, { day: "numeric", month: "short", year: "numeric" })}</div>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{transaction.raw_description}</div><div className="mt-1 truncate text-[11px] text-[#62645d]"><span className="sm:hidden">{formatDate(transaction.occurred_at, { day: "numeric", month: "short" })} · </span>{meta}</div></div>
                <div className={`shrink-0 text-right text-sm font-medium tabular-nums ${credit ? "text-[#477250]" : transfer ? "text-[#575953]" : "text-[#414340]"}`}>{credit ? "+" : transfer ? "" : "−"}{money(transaction.amount, transaction.currency, 2)}</div>
                <IconButton label={`Delete ${transaction.raw_description}`} onClick={() => { setConfirmId(transaction.id); setNotice(""); }}><Trash2 size={15} /></IconButton>
              </div>
              {confirmId === transaction.id && <ConfirmStrip
                message={<>Delete this {money(transaction.amount, transaction.currency, 2)} transaction from {formatDate(transaction.occurred_at)}?{transaction.transaction_type === "DEBIT" ? " It will also stop counting toward your budgets." : ""}</>}
                confirmLabel="Delete transaction"
                working={deleting}
                onConfirm={() => removeTransaction(transaction.id)}
                onCancel={() => setConfirmId(null)}
              />}
            </li>;
          })}
        </ul>
        {pageCount > 1 && <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e5e4de] pt-4">
          <SecondaryButton onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || loading}><ChevronLeft size={15} /> Newer</SecondaryButton>
          <SecondaryButton onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1 || loading}>Older <ChevronRight size={15} /></SecondaryButton>
        </div>}
      </Panel>
    )}
  </>;
}

// Form for a transaction that isn't on any statement, such as cash spending.
function AddTransactionForm({ accounts, onCancel, onSaved, onAddStatement }: { accounts: BankAccountSummary[]; onCancel: () => void; onSaved: () => Promise<void>; onAddStatement: () => void }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [amount, setAmount] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  if (accounts.length === 0) {
    return <Panel className="mb-4 p-5"><h2 className="font-semibold">Add an account first</h2><p className="mt-1 text-sm text-[#575953]">Every transaction belongs to an account. Create an account label when you add your first statement.</p><button type="button" onClick={onAddStatement} className="prototype-inline-link mt-2 text-sm font-medium">Add an account</button></Panel>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (toNumber(amount) <= 0) { setError("Enter an amount greater than zero."); return; }
    setWorking(true);
    try {
      await createManualTransaction({
        account_id: accountId,
        occurred_at: `${date}T00:00:00Z`,
        amount: Math.round(toNumber(amount) * 100) / 100,
        transaction_type: kind,
        description: description.trim(),
      });
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this transaction.");
    } finally {
      setWorking(false);
    }
  }

  return <form onSubmit={submit} className="mb-4 rounded-xl border border-[#e5e4de] bg-white p-5">
    <h2 className="font-semibold">Add a transaction</h2>
    <p className="mt-1 text-xs leading-5 text-[#62645d]">For spending or income that isn’t on a statement, like cash. It doesn’t change the account’s balance.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_1.6fr_0.8fr_0.8fr]">
      <Field label="Account"><select required value={accountId} onChange={(event) => setAccountId(event.target.value)} className={inputClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.institution_name} · {account.account_number_masked}</option>)}</select></Field>
      <Field label="Date"><input type="date" required max={todayIso()} value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></Field>
      <Field label="Description"><input required maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Auto fare to college" className={inputClass} /></Field>
      <Field label="Type"><select value={kind} onChange={(event) => setKind(event.target.value as "DEBIT" | "CREDIT")} className={inputClass}><option value="DEBIT">Spending</option><option value="CREDIT">Income</option></select></Field>
      <Field label="Amount (₹)"><input type="number" required min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${inputClass} text-right`} /></Field>
    </div>
    {error && <ErrorNote message={error} />}
    <div className="mt-4 flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={working}>{working ? "Saving…" : "Save transaction"}</PrimaryButton><SecondaryButton onClick={onCancel} disabled={working}>Cancel</SecondaryButton></div>
  </form>;
}
