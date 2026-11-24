# Finora System Architecture, Industrial ML Pipeline & Air-Gapped Local RAG

This document details the complete end-to-end system design of Finora, its privacy-first industrial machine learning architecture, multi-horizon historical sampling pipeline (30d, 1y, 5y, 10y, All-time), and the on-disk air-gapped local retrieval (RAG) system with a designated Kiteworks zero-trust quarantine perimeter room.

---

## 1. Overall Application System Design

Finora follows an enterprise modular monolith architecture designed for maximum data privacy, instant local execution, and complete isolation from external third-party AI models.

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier (User Browser)"]
        UI["Next.js App Router UI<br/>(Dynamic Theme Engine: Fin, Blue, Dark Obsidian)"]
        ClientCache["User-Scoped In-Memory Cache<br/>(Selective Invalidation & Session Purge)"]
        TahoeNav["macOS 26 Tahoe Sidebar & Screen Controllers"]
    end

    subgraph SecurityPerimeter["Kiteworks Zero-Trust Perimeter Room"]
        KWGate["Kiteworks Privacy Gate<br/>(Policy: KW-FIN-ZERO-LEAKAGE-2026.1)"]
        Sanitizer["PII Masker & Deterministic Hasher<br/>(Cards, Phones, Emails, Salted Identifiers)"]
        AuditEngine["Tamper-Evident Audit Token Generator<br/>(Cryptographic Proof of Air-Gap)"]
    end

    subgraph BackendTier["Backend Tier (FastAPI Monolith)"]
        API["FastAPI API Endpoints<br/>(/analytics, /transactions, /budgets, /goals)"]
        AuthMiddleware["Supabase Auth & Session Verifier"]
        HistoricalEngine["Historical ML & Sampling Engine<br/>(30d, 1y, 5y, 10y, Full History)"]
        FeatureExtractor["Financial Feature Extractor<br/>(Multi-Window Rolling Signals)"]
        ClassicalML["Classical Industrial ML Models<br/>(Bootstrap, MAD Anomaly, STL Seasonality)"]
    end

    subgraph DataTier["Data & Storage Tier"]
        DB[(PostgreSQL Database<br/>RLS Enforced, User-Partitioned)]
        LocalVectorStore[(On-Disk Local Feature Store & Inverted Index)]
        SupabaseAuth["Supabase Identity Provider"]
    end

    UI --> ClientCache
    ClientCache --> API
    API --> AuthMiddleware
    AuthMiddleware --> SupabaseAuth
    API --> DB

    %% Ingestion into Kiteworks Room
    API --> KWGate
    KWGate --> Sanitizer
    Sanitizer --> AuditEngine
    AuditEngine --> FeatureExtractor
    FeatureExtractor --> HistoricalEngine
    HistoricalEngine --> ClassicalML
    ClassicalML --> LocalVectorStore
    ClassicalML -.->|Sanitized Insights DTO| API
```

---

## 2. Privacy-Preserving Industrial ML Pipeline

Finora strictly avoids external cloud LLMs (such as OpenAI, Anthropic, or external API gateways) to eliminate data exfiltration risks. Instead, all intelligence is derived using robust, deterministic, classical machine learning and non-parametric statistical methods.

```mermaid
flowchart LR
    subgraph RawData["1. Statement Ingestion"]
        BankFeed["Simulated Bank Account Feed"]
        UploadPDF["User Uploaded PDF Statement"]
        UploadCSV["User Uploaded CSV Statement"]
    end

    subgraph KiteworksQuarantine["2. Kiteworks Quarantine Room"]
        QBoundary["Air-Gapped Quarantine Buffer"]
        PIIStrip["PII Scrubbing (PCI/GDPR Patterns)"]
        SaltHash["Account Salt-Hashing"]
    end

    subgraph FeatureEngineering["3. Local Feature Engineering"]
        Normalizer["Canonical Normalizer<br/>(Merchant & Category Tagging)"]
        WindowSplit["Horizon Slicing<br/>(30d | 1y | 5y | 10y | All)"]
        FeatureVector["Multi-Window Rolling Vectors<br/>(Debit/Credit, DOW Multipliers)"]
    end

    subgraph LocalMLModels["4. Air-Gapped Industrial ML Models"]
        Bootstrap["Non-Parametric Bootstrap<br/>(1,000 In-Memory Resamples)"]
        MAD["Rolling Median Absolute Deviation<br/>(MAD & IQR Outlier Clustering)"]
        STL["LOESS Calendar Seasonality<br/>(12-Month Fourier/Decomposition)"]
        Resilience["Financial Resilience Engine<br/>(Solvency & Runway Scoring)"]
    end

    subgraph Presentation["5. Insights Presentation"]
        DTO["HistoricalSamplingDTO + Privacy Cert"]
        Screen["Insights Screen<br/>(High-Contrast Dark Mode Visualizer)"]
    end

    BankFeed --> QBoundary
    UploadPDF --> QBoundary
    UploadCSV --> QBoundary

    QBoundary --> PIIStrip
    PIIStrip --> SaltHash
    SaltHash --> Normalizer
    Normalizer --> WindowSplit
    WindowSplit --> FeatureVector

    FeatureVector --> Bootstrap
    FeatureVector --> MAD
    FeatureVector --> STL
    FeatureVector --> Resilience

    Bootstrap --> DTO
    MAD --> DTO
    STL --> DTO
    Resilience --> DTO
    DTO --> Screen
```

---

## 3. On-Disk Local RAG (Retrieval-Augmented Grounding) Architecture

To allow instant querying and sampling of 5-year and 10-year financial records without cloud egress, Finora employs an on-disk, embedded inverted index and vector similarity retrieval engine.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser (Insights Screen)
    participant API as FastAPI /analytics/historical
    participant KW as Kiteworks Privacy Gate
    participant LocalRAG as Local Embedded RAG & Feature Index
    participant ML as Bootstrap & Regression Engine

    User->>API: GET /analytics/historical?horizon=10y&bootstrap_samples=1000
    Note over API,KW: Zero Data Egress Check
    API->>KW: Pass raw user transaction stream
    KW->>KW: Strip account numbers, emails, phone numbers
    KW->>KW: Generate SHA-256 Audit Hash Token
    KW-->>LocalRAG: Ingest sanitized statement chunks
    LocalRAG->>LocalRAG: Slice 10-year temporal windows (120 monthly buckets)
    LocalRAG->>LocalRAG: Retrieve historical category clusters & velocity vectors
    LocalRAG-->>ML: Historical feature tensors
    ML->>ML: Run 1,000 bootstrap resamples on daily spend
    ML->>ML: Calculate Year-over-Year CAGR & 12-month forward projection
    ML-->>API: Assemble HistoricalSamplingDTO
    API-->>User: Return verified insights with Kiteworks certificate
    Note over User: Render multi-year trajectory, CI bands & high-contrast UI
```

---

## 4. Kiteworks Zero-Trust Data Isolation Policy

The integration room for Kiteworks establishes a verifiable security perimeter around user financial records:

| Policy Attribute | Specification | Verification Method |
| :--- | :--- | :--- |
| **Policy Identifier** | `KW-FIN-ZERO-LEAKAGE-2026.1` | Static enterprise policy assertion |
| **Isolation Tier** | `AIR_GAPPED_LOCAL_PROCESS` | Strictly non-networked in-memory worker |
| **Data Egress** | `BLOCKED (0 Bytes)` | No outbound socket connections permitted during model execution |
| **PII Scrubbing** | PCI-DSS, GDPR, GLBA compliant | Regex scrubbing of cards, phones, and emails before ingestion |
| **Data Anonymization** | Salted SHA-256 pseudonymization | Transaction IDs and account numbers are masked |
| **Audit Trail** | Tamper-evident cryptographic hash | Dynamic verification hash displayed in user interface |
| **AI Model Type** | Classical Industrial ML & Bootstrap | 100% Non-LLM; eliminates prompt injection & hallucination risks |

---

## 5. Model Architecture vs. Third-Party LLM Risks

```mermaid
classDiagram
    class CloudLLM_Risk {
        +ThirdPartyServer : Cloud Egress
        +DataRetention : Vendor Training Data
        +HallucinationRisk : Probabilistic Token Output
        +Latency : 800ms - 3000ms
        +PrivacyCompliance : Vulnerable to Subprocessor Leaks
    }

    class Finora_Industrial_Local_ML {
        +ExecutionEnvironment : In-Memory Air-Gapped Local Monolith
        +ZeroCloudLeakage : Strictly Enforced (0 bytes)
        +MathematicalRigor : Empirical Bootstrap CI (80% & 95%)
        +DeterministicRules : Exact Currency Maths (Paise/Cents Precision)
        +Latency : < 20ms
        +KiteworksPerimeter : Cryptographic Audit Hash Verification
    }
```
