# Finora — Advanced Programming (AP) Evaluation & Study Hub

> **Course Context**: Advanced Programming (Web Development & Architecture)  
> **Institution**: Newton School of Technology  
> **Evaluation Mode**: Theory Viva + Manual Code Writing + Architecture Assessment  
> **Project Reference**: Finora (Personal Finance & Behavior Intelligence Platform)

---

## Evaluation Roadmap & Syllabus Breakdown

This learning repository is structured specifically for the **Advanced Programming (AP)** college evaluation. It provides crystal-clear theory, execution diagrams, pen-and-paper manual coding snippets, and real-world codebase mappings from Finora.

```
Learning/
├── README.md                                 # This Master Navigation & Exam Roadmap
├── 01_JAVASCRIPT_FUNDAMENTALS_AND_ASYNC.md   # JS Core, Event Loop, Promises, Polyfills
├── 02_NODEJS_RUNTIME_AND_CORE_MODULES.md     # Node Runtime, libuv, fs, Streams, Events
├── 03_HTTP_AND_NETWORKING_FOUNDATIONS.md     # Protocol, Methods, Status Codes, Raw Server
├── 04_EXPRESSJS_AND_MIDDLEWARE_MASTERY.md    # Express, Routing, 5 Middleware Types, Error Handling
├── 05_REST_API_ARCHITECTURE_AND_DESIGN.md    # 6 Constraints, Safe/Idempotent, Resource URIs
├── 06_FINORA_CODEBASE_DEEP_DIVE.md           # How Finora Implements AP Concepts
├── 07_MANUAL_CODING_CHEATSHEET.md            # 15 Blackboard / Paper Code Writing Drills
└── 08_VIVA_AND_ORAL_EVALUATION_QA.md         # 50+ Rapid-Fire Viva Questions & Answers
```

---

## Topic Mapping Matrix

| Course Topic | Core Theoretical Focus | Manual Coding Drill | Finora Production Mapping |
| :--- | :--- | :--- | :--- |
| **1. JavaScript Fundamentals** | Execution Context, Hoisting, Scope, Closures, Event Loop, Micro vs Macrotasks | Write polyfills for `map`, `filter`, `reduce`; Trace async output | `frontend/src/lib/api.ts`, `frontend/src/components/` |
| **2. Node.js Fundamentals** | V8 Engine + libuv, Single-threaded Loop, Thread Pool, CommonJS vs ESM | Command-line CLI script using `process.argv` and `process.env` | Build scripts, Next.js Node server runtime |
| **3. Node.js Core Modules** | `path` (join vs resolve), `fs` (Sync vs Callback vs Promises), Streams, Buffers, `EventEmitter` | File streaming copy with backpressure, Custom EventEmitter class | Statement file streaming parser in backend |
| **4. HTTP & Networking** | Request/Response anatomy, Headers, Status codes (1xx-5xx), Safe vs Idempotent | Native `http.createServer()` without frameworks | API contract between Next.js client & API server |
| **5. Express.js & Middleware** | Routing, `req.params` vs `req.query`, 5 Middleware types, `(err, req, res, next)` order | Custom auth middleware, validation middleware, global error handler | FastAPI / Next.js edge proxy equivalent routes |
| **6. REST API Architecture** | 6 Roy Fielding constraints, Resource URIs, Statelessness, JSON contracts | Complete CRUD REST API in 40 lines of code | `backend/app/api/v1/` endpoints |

---

## How to Prepare for the Evaluation

### If Tested on Theory (Viva / Oral Exam)
1. Read **`08_VIVA_AND_ORAL_EVALUATION_QA.md`** first to master instant, precise technical responses.
2. Review **`05_REST_API_ARCHITECTURE_AND_DESIGN.md`** for Roy Fielding's 6 constraints and HTTP method idempotency tables.
3. Review the **Event Loop execution order** in **`01_JAVASCRIPT_FUNDAMENTALS_AND_ASYNC.md`** (Macrotasks vs Microtasks vs Call Stack).

### If Tested on Manual Code Writing (Blackboard / Paper / Blank Editor)
1. Open **`07_MANUAL_CODING_CHEATSHEET.md`** and practice writing each of the 15 code snippets by hand without an IDE or autocomplete.
2. Memorize the exact signature of Express error middleware: `(err, req, res, next)` — forgetting `err` or `next` is an instant point deduction!
3. Memorize the pure Node.js HTTP server pattern:
   ```javascript
   const http = require('http');
   const server = http.createServer((req, res) => {
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ status: 'ok' }));
   });
   server.listen(3000);
   ```

### If Asked About Finora's Architecture
1. Refer to **`06_FINORA_CODEBASE_DEEP_DIVE.md`**.
2. Explain the Client-Server separation: Next.js frontend consuming RESTful endpoints (`/api/v1/analytics/overview`, `/api/v1/transactions`, `/api/v1/budgets`).
3. Explain how authentication tokens flow in HTTP Request Headers (`Authorization: Bearer <token>`).
4. Explain how CSV bank statements are parsed through stream-based batch processing to protect server memory.

---

*All files in this directory are written to be self-contained, crystal clear, and academically rigorous for college-level grading.*
