# Historical Statement Ingestion Architecture — Finora

## 1. Overview & Ingestion Life Cycle

Users frequently hold years of historical statement records in varied formats (CSV, XLSX, PDF). The Ingestion Engine processes multi-year banking archives and converts them into canonical transaction records seamlessly.

---

## 2. Parsing Architecture

```mermaid
flowchart TD
    File[Uploaded File Stream] --> MIME{MIME Type & Header Detector}
    
    MIME -->|text/csv| P_CSV[CSV Stream Parser]
    MIME -->|application/vnd.openxmlformats| P_XLSX[XLSX Spreadsheet Parser]
    MIME -->|application/pdf| P_PDF[PDF Text/Table Extraction Engine]
    
    P_CSV --> Sched[Column & Layout Heuristic Detector]
    P_XLSX --> Sched
    P_PDF --> Sched
    
    Sched --> RawRecords[Raw Records Stream]
    
    RawRecords --> Val[Schema & Sanity Validation]
    Val --> Norm[Canonical Normalizer & Classifier]
    Norm --> Dedup{Deduplication Check against DB}
    
    Dedup -->|New Record| Insert[Batch Insert to transactions]
    Dedup -->|Duplicate| Skip[Log Duplicate & Skip]
    
    Insert --> Feat[Trigger Historical Feature Computation]
    Feat --> MLProfile[Update User ML Behaviour Profile]
```

---

## 3. Supported File Formats & Extractors

### 3.1 CSV Parser
- Auto-detects delimiters (`,`, `;`, `\t`, `|`).
- Heuristic header detection scanning for common financial terms (`Date`, `Narration`, `Description`, `Debit`, `Credit`, `Withdrawal`, `Deposit`, `Balance`).

### 3.2 XLSX Parser
- Inspects worksheet sheets; automatically selects the sheet with the densest numerical and date matrix.
- Handles formatted dates, floating point serials, and custom currency formatting.

### 3.3 PDF Parser
- Vector & text coordinate table extraction.
- Regex fallbacks for standard Indian and Global bank statement layouts (HDFC, SBI, ICICI, HSBC, Chase, Barclays).
