# Canonical Transaction Pipeline & Flow — FinancialCall

## 1. Architectural Philosophy

Every transaction entering FinancialCall—regardless of originating from a live bank sync (HSBCDemoAdapter), CSV batch file, Excel workbook, or PDF bank statement—**must pass through an identical canonical normalization pipeline**.

No raw source formats are persisted directly as separate entities. The system maintains a singular domain model of money in motion.

---

## 2. Ingestion to Calendar Pipeline

```mermaid
flowchart TD
    subgraph Sources [Heterogeneous Ingestion Sources]
        S_Bank[Simulated Bank API\nHSBC / SBI / HDFC Demo]
        S_CSV[CSV Bank Statements]
        S_XLSX[XLSX Bank Statements]
        S_PDF[PDF Bank Statements]
        S_Manual[Manual Transaction Input]
    end

    subgraph NormalizationPipeline [Canonical Ingestion Engine]
        Step1[Raw Record Parser & Sanitizer]
        Step2[Field Mapper & Type Validator]
        Step3[Currency & Amount Normalization]
        Step4[Merchant Resolution & Fuzzy Matching]
        Step5[Category Classifier Engine]
        Step6[Deduplication Hash Generator\nSHA256(Account + Timestamp + Amount + Ref)]
    end

    subgraph Persistence [PostgreSQL Core Storage]
        DB_Tx[(transactions Table\nCanonical Entity)]
    end

    subgraph DownstreamConsumers [Platform Intelligence Consumers]
        C_Cal[Financial Calendar View\nDay/Week/Month Heatmaps]
        C_Budget[Budget Tracking & Burn Estimator]
        C_ML[ML Feature Store & Anomaly Scorer]
        C_Goal[Financial Independence Projection]
    end

    Sources --> Step1
    Step1 --> Step2
    Step2 --> Step3
    Step3 --> Step4
    Step4 --> Step5
    Step5 --> Step6
    Step6 --> DB_Tx
    DB_Tx --> C_Cal
    DB_Tx --> C_Budget
    DB_Tx --> C_ML
    DB_Tx --> C_Goal
```

---

## 3. Step-by-Step Normalization Breakdown

| Step | Function | Error / Edge Case Handling |
| :--- | :--- | :--- |
| **1. Parser & Sanitizer** | Strips whitespace, null bytes, special formatting characters. | Rejects malformed binary payloads or corrupt files. |
| **2. Field Mapping** | Maps varied headers (`Txn Date`, `Value Dt`, `Posting Date`) to `occurred_at`. | Fallback to upload timestamp if date parsing fails; returns validation errors. |
| **3. Amount Normalization** | Identifies Credit/Debit indicators (`CR/DR`, negative numbers, separate debit/credit columns). | Enforces absolute numeric `amount` with explicit `transaction_type` enum (`DEBIT`, `CREDIT`, `TRANSFER`). |
| **4. Merchant Resolution** | Normalizes raw descriptions (e.g., `POS 4912903 SWIGGY BANGALORE IN` → `Swiggy`). | Substring dictionary lookup + regex substitution rules. |
| **5. Categorization** | Assigns merchant-based default category or applies keyword heuristics. | Assigns `Uncategorized` if ambiguous; prompts user for one-click rules. |
| **6. Deduplication** | Computes `dedup_hash = SHA256(f"{acc_id}_{occurred_at}_{amount}_{ref}")`. | On conflict: updates existing record metadata or safely ignores identical duplicate. |
