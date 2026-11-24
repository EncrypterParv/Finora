# Module 06: Finora Codebase Deep Dive & AP Concept Mapping

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Topic**: Production Code Mapping: Next.js Client, Edge Middleware, REST API, Stream Ingestion  
> **Evaluation Relevance**: High (Explaining your project architecture to evaluators)

---

## 1. High-Level System Architecture

Finora is architected following the **Client-Server Separation** and **Stateless REST** principles taught in Advanced Programming:

```
                            FINORA RUNTIME ARCHITECTURE
                            
    ┌────────────────────────────────────────────────────────┐
    │                 CLIENT: Next.js Frontend               │
    │  - React 19 Client & Server Components                 │
    │  - Edge Proxy Middleware (`frontend/src/proxy.ts`)     │
    │  - REST API Client (`frontend/src/lib/api.ts`)         │
    │  - TanStack Query (Async state management & caching)   │
    └───────────────────────────┬────────────────────────────┘
                                │
                                │ HTTP / JSON (Stateless REST)
                                │ Header: Authorization: Bearer <JWT>
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │                 SERVER: Backend API                    │
    │  - Modular Routers (`/api/v1/transactions`, etc.)      │
    │  - Auth Dependency & Validation Middleware             │
    │  - Stream Parsing for CSV Bank Statements              │
    │  - Statistical ML & Behaviour Change Detection         │
    └───────────────────────────┬────────────────────────────┘
                                │
                                │ SQL & Row Level Security (RLS)
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │                 PERSISTENCE: Supabase Postgres         │
    │  - User-scoped records (owner_id checks)               │
    └────────────────────────────────────────────────────────┘
```

---

## 2. Edge Middleware in Action: `frontend/src/proxy.ts`

In modern web development (Next.js 16), **middleware** sits between the incoming request and the application route. Notice how closely this aligns with Express middleware:

```typescript
// frontend/src/proxy.ts
import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  // 1. Bypass check for sign-out route (Logout owns session changes)
  if (request.nextUrl.pathname === "/auth/sign-out") return;

  // 2. Intercept request, refresh session token if expired, attach cookies
  return updateSupabaseSession(request);
}

// 3. Matcher configuration: runs on all page requests, excludes static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### AP Concept Connection:
- **Concept**: Application-Level Middleware & Authentication Guard.
- **Why it matters**: Demonstrates executing logic *before* route handlers render, ensuring the client session is valid before granting access to dashboard views.

---

## 3. Asynchronous REST Client: `frontend/src/lib/api.ts`

Finora uses an asynchronous HTTP client to interact with the backend API. It encapsulates headers, token injection, status checking, and JSON parsing.

```typescript
// Key pattern inside frontend/src/lib/api.ts
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken(); // Asynchronous token retrieval

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    // Stateless REST Principle: Credentials sent in every request header
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // HTTP Status Code Handling
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Requested resource was not found.");
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  // 204 No Content handling (common in DELETE/PUT)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
```

### AP Concept Connection:
- **Concepts**: `async/await`, `fetch` API, HTTP Request Headers (`Authorization`, `Content-Type`), HTTP Status Code evaluation (`401`, `404`, `204`), JSON parsing.

---

## 4. Backend Modular Routers: `backend/app/api/v1/router.py`

In Express, we use `express.Router()` mounted onto `app.use('/api/v1', router)`.  
Finora's backend follows the exact same pattern:

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import accounts, analytics, budgets, calendar, goals, statements, transactions

api_router = APIRouter()

# Modular router mounting (Identical to router.use('/accounts', accountsRouter))
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(statements.router, prefix="/statements", tags=["statements"])
```

---

## 5. RESTful Endpoint Implementations

### Example: Analytics Overview (`/api/v1/analytics/overview`)
- **HTTP Method**: `GET` (Safe & Idempotent).
- **Query Parameters**: `account_id`, `window_days` (default 30).
- **Headers Checked**: `Authorization: Bearer <jwt>`.
- **Response**: `200 OK` with JSON object containing:
  - `total_spent`, `expected_month_end`, `behaviour_score`, `weekend_spend_ratio`.

### Example: Bank Statement CSV Stream Parsing (`statements.py`)
- **HTTP Method**: `POST /api/v1/statements/preview`
- **Content-Type**: `multipart/form-data`
- **Stream Processing**: Uploaded file is streamed into memory chunks rather than read as one gigantic string, preventing Denial of Service (DoS) from memory exhaustion.
- **Deduplication**: Checks incoming transaction hashes against existing records before persisting (`Unique record` validation).

---

## 6. How to Explain Finora in Your Viva (Sample Pitch)

> *"Finora is designed following strict REST architectural constraints and clean separation of concerns. On the frontend, we use React and Next.js with edge proxy middleware for session management, and asynchronous data fetching with TanStack Query. Every API call communicates with our backend using standardized HTTP methods, JSON representations, and bearer token authorization headers, satisfying the statelessness requirement.*  
> *On the backend, our endpoints are split into modular resource-oriented routers (`/transactions`, `/budgets`, `/analytics`). Heavy file uploads like bank statements are processed via streaming to maintain memory efficiency, and response codes strictly adhere to HTTP standards (201 for creations, 204 for deletions, and 422 for validation errors)."*
