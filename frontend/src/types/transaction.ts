export type TransactionType = 'DEBIT' | 'CREDIT' | 'TRANSFER';
export type TransactionSource = 'BANK_API' | 'CSV' | 'XLSX' | 'PDF' | 'MANUAL';

export interface TaxMetadata {
  gst_rate_pct?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  hsn_sac_code?: string;
  tax_invoice_number?: string;
}

export interface CanonicalTransaction {
  id: string;
  user_id: string;
  account_id: string;
  occurred_at: string; // ISO 8601 string
  amount: number;
  currency: string;
  transaction_type: TransactionType;
  raw_description: string;
  merchant_name: string;
  category_name: string;
  balance_before?: number;
  balance_after?: number;
  reference_id: string;
  source: TransactionSource;
  tax_info?: TaxMetadata;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface TransactionDetail extends CanonicalTransaction {
  monthly_budget_allocated?: number;
  monthly_budget_spent?: number;
  monthly_budget_utilization_pct?: number;
  projected_monthly_spend?: number;
  projected_budget_exhaustion_date?: string;
  recommended_daily_spend?: number;
  is_anomaly?: boolean;
  anomaly_reason?: string;
}
