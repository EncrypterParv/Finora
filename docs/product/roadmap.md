# Engineering & Product Roadmap — FinancialCall

```mermaid
gantt
    title FinancialCall Development Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation (Current)
    System Architecture & HLD/LLD       :done,    p1_1, 2026-10-01, 2026-10-07
    Canonical Model & DB Schema         :done,    p1_2, 2026-10-05, 2026-10-07
    Bank Adapter & HSBC Mock Contract   :done,    p1_3, 2026-10-06, 2026-10-07
    Testing & Ingestion Foundation      :done,    p1_4, 2026-10-06, 2026-10-07
    
    section Phase 2: Core Platform
    Next.js Calendar UI Implementation  :active,  p2_1, 2026-10-08, 2026-10-22
    FastAPI Transaction & Account APIs  :active,  p2_2, 2026-10-08, 2026-10-20
    Full CSV/XLSX/PDF Ingestion Engine  :         p2_3, 2026-10-15, 2026-10-30
    
    section Phase 3: Intelligence & Goals
    ML Feature Store & Forecast Engine  :         p3_1, 2026-10-25, 2026-11-10
    Budget Burn & Anomaly Detection     :         p3_2, 2026-11-01, 2026-11-15
    Financial Independence Goal Planner :         p3_3, 2026-11-10, 2026-11-25
    
    section Phase 4: Polish & Delivery
    E2E Testing & Performance Tuning    :         p4_1, 2026-11-20, 2026-12-05
    Final Demonstration & Presentation  :         p4_2, 2026-12-01, 2026-12-15
```

---

## Milestone Deliverables

### Phase 1: Architectural Foundation (Delivered)
- Full System HLD, LLD, ER diagrams, security model, and API contracts.
- Backend domain boundaries: Canonical Transaction Model, BankAdapter abstraction, `HSBCDemoAdapter`.
- Modern relational database models (SQLAlchemy) & Pydantic schemas.
- Ingestion parser contracts & baseline ML forecasting abstractions.
- Automated test suites verifying normalization, bank adapters, and calendar algorithms.

### Phase 2: Core Calendar & Transaction Platform
- Interactive Next.js Calendar with Day/Week/Month time-axis grids.
- Transaction detail drawer with predictive context indicators.
- Ingestion UI with drag-and-drop CSV/XLSX/PDF statement upload and preview.

### Phase 3: Behavioural ML & Goal Planning
- Rolling 7d/30d/90d feature computation background jobs.
- Isolation Forest anomaly detection for uncharacteristic transactions.
- Interactive FIRE goal simulator with monthly adjustment sliders.

### Phase 4: Production Polish
- End-to-end Cypress/Playwright integration tests.
- High-concurrency query optimization and caching.
