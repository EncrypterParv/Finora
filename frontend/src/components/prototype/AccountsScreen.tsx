"use client";

import { useState } from "react";
import { FileUp, Pencil, Trash2, WalletCards } from "lucide-react";
import {
  AccountTypeOption,
  ApiError,
  BankAccountSummary,
  deleteBankAccount,
  updateBankAccount,
} from "@/lib/api";
import {
  ConfirmStrip,
  EmptyPanel,
  ErrorNote,
  Field,
  IconButton,
  inputClass,
  PageTitle,
  PrimaryButton,
  SecondaryButton,
} from "./prototype-ui";

const accountTypeLabels: Record<string, string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  CHECKING: "Current",
  CREDIT: "Credit card",
};

// Accounts screen: the account labels a user created, with rename/edit and delete.
export function AccountsScreen({ accounts, onAdd, onAccountUpdated, onAccountDeleted }: {
  accounts: BankAccountSummary[];
  onAdd: () => void;
  onAccountUpdated: (account: BankAccountSummary) => void;
  onAccountDeleted: (accountId: string, removedTransactions: boolean) => Promise<void> | void;
}) {
  return <>
    <PageTitle title="Accounts" description="Account labels you added to organise your statements. Finora is not connected to your bank." action={<PrimaryButton onClick={onAdd}><FileUp size={16} /> Add an account</PrimaryButton>} />
    {accounts.length
      ? <div className="grid gap-3 sm:grid-cols-2">{accounts.map((account) => <AccountCard key={account.id} account={account} onUpdated={onAccountUpdated} onDeleted={onAccountDeleted} />)}</div>
      : <EmptyPanel title="No accounts added" body="Add an account label when you import your first bank statement. You don’t need to share your full account number." onAdd={onAdd} />}
  </>;
}

// One account: shows its label and switches between view, edit and delete-confirmation states.
function AccountCard({ account, onUpdated, onDeleted }: {
  account: BankAccountSummary;
  onUpdated: (account: BankAccountSummary) => void;
  onDeleted: (accountId: string, removedTransactions: boolean) => Promise<void> | void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm" | "confirm-with-transactions">("view");
  const [conflictMessage, setConflictMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function remove(withTransactions: boolean) {
    setWorking(true);
    setError("");
    try {
      await deleteBankAccount(account.id, withTransactions);
      await onDeleted(account.id, withTransactions);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setConflictMessage(cause.message);
        setMode("confirm-with-transactions");
      } else {
        setError(cause instanceof Error ? cause.message : "Could not delete this account.");
      }
    } finally {
      setWorking(false);
    }
  }

  return <section className="rounded-xl border border-[#e8e4dc] bg-white p-5">
    {mode === "edit"
      ? <EditAccountForm account={account} onCancel={() => setMode("view")} onSaved={(updated) => { onUpdated(updated); setMode("view"); }} />
      : <>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#f4eee7] text-[#694b3b]"><WalletCards size={18} /></span>
          <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{account.institution_name}</h2><p className="mt-1 text-xs text-[#837970]">{accountTypeLabels[account.account_type] ?? account.account_type} · {account.account_number_masked}</p></div>
          <IconButton label={`Edit ${account.institution_name}`} onClick={() => { setMode("edit"); setError(""); }}><Pencil size={15} /></IconButton>
          <IconButton label={`Delete ${account.institution_name}`} onClick={() => { setMode("confirm"); setError(""); }}><Trash2 size={15} /></IconButton>
        </div>
        <p className="mt-4 text-xs text-[#837970]">{account.currency} · {account.adapter_type === "STATEMENT_IMPORT" ? "Statement imports" : "Simulated bank sync"}</p>
        {mode === "confirm" && <ConfirmStrip message={<>Delete the account label <strong>{account.institution_name}</strong>?</>} confirmLabel="Delete account" working={working} onConfirm={() => remove(false)} onCancel={() => setMode("view")} />}
        {mode === "confirm-with-transactions" && <ConfirmStrip
          message={<>{transactionCountSentence(conflictMessage)} Deleting the account also permanently deletes them, and they stop counting toward your budgets.</>}
          confirmLabel="Delete account and its transactions"
          working={working}
          onConfirm={() => remove(true)}
          onCancel={() => setMode("view")}
        />}
        {error && <ErrorNote message={error} />}
      </>}
  </section>;
}

// Reads the count out of the API's 409 message ("Account has 12 transaction(s)...").
function transactionCountSentence(message: string): string {
  const count = Number(message.match(/(\d+)\s+transaction/)?.[1]);
  if (!Number.isFinite(count) || count <= 0) return "This account still has transactions.";
  return `This account has ${count} transaction${count === 1 ? "" : "s"}.`;
}

// Inline form for changing an account's name, type or last four digits.
function EditAccountForm({ account, onCancel, onSaved }: { account: BankAccountSummary; onCancel: () => void; onSaved: (account: BankAccountSummary) => void }) {
  const initialType = (account.account_type === "CHECKING" ? "CURRENT" : account.account_type) as AccountTypeOption;
  const [institution, setInstitution] = useState(account.institution_name);
  const [accountType, setAccountType] = useState<AccountTypeOption>(initialType);
  const [lastFour, setLastFour] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const updated = await updateBankAccount(account.id, {
        institution_name: institution.trim(),
        account_type: accountType,
        ...(lastFour ? { last_four: lastFour } : {}),
      });
      onSaved(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this account.");
    } finally {
      setWorking(false);
    }
  }

  return <form onSubmit={submit}>
    <h2 className="font-semibold">Edit account label</h2>
    <div className="mt-3 grid gap-3">
      <Field label="Bank or institution"><input required maxLength={100} value={institution} onChange={(event) => setInstitution(event.target.value)} className={inputClass} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Account type"><select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountTypeOption)} className={inputClass}><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option><option value="CREDIT">Credit card</option></select></Field>
        <Field label="New last four digits" hint="Leave blank to keep the current ones."><input value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder={account.account_number_masked.slice(-4).replace(/X/g, "") || "1234"} className={inputClass} /></Field>
      </div>
    </div>
    {error && <ErrorNote message={error} />}
    <div className="mt-4 flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={working}>{working ? "Saving…" : "Save changes"}</PrimaryButton><SecondaryButton onClick={onCancel} disabled={working}>Cancel</SecondaryButton></div>
  </form>;
}
