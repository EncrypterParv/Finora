# Module 05: REST API Architecture & Design Principles

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Topic**: REST Architectural Style, Roy Fielding's 6 Constraints, URI Design, HTTP Status Mapping  
> **Evaluation Relevance**: Critical (Guaranteed questions on constraints, URI design, and idempotency)

---

## 1. What is REST?

**REST** stands for **Representational State Transfer**. It is not a protocol, language, or standard; it is an **architectural style** for distributed hypermedia systems, formulated by **Roy Fielding** in his 2000 PhD dissertation (*"Architectural Styles and the Design of Network-based Software Architectures"*).

An API that adheres to REST principles is called a **RESTful API**.

---

## 2. Roy Fielding's 6 Architectural Constraints

To be truly RESTful, a web service must conform to the following six architectural constraints:

```
                      THE 6 ARCHITECTURAL CONSTRAINTS OF REST
                      
       ┌────────────────────────┐         ┌────────────────────────┐
       │ 1. CLIENT-SERVER       │         │ 2. STATELESSNESS       │
       │ Separation of concerns │         │ No session stored      │
       │ (UI vs Data Storage)   │         │ on server              │
       └───────────┬────────────┘         └───────────┬────────────┘
                   │                                  │
       ┌───────────▼────────────┐         ┌───────────▼────────────┐
       │ 3. CACHEABILITY        │         │ 4. UNIFORM INTERFACE   │
       │ Explicit cache headers │         │ Standardized contracts │
       │ (reduces latency)      │         │ & URI conventions      │
       └───────────┬────────────┘         └───────────┬────────────┘
                   │                                  │
       ┌───────────▼────────────┐         ┌───────────▼────────────┐
       │ 5. LAYERED SYSTEM      │         │ 6. CODE ON DEMAND      │
       │ Proxies, Gateways,     │         │ (OPTIONAL) Client can  │
       │ Load Balancers allowed │         │ execute scripts from API│
       └────────────────────────┘         └────────────────────────┘
```

### 1. Client-Server Architecture
- **Principle**: Strict separation of concerns. The client handles user interface and user interaction; the server handles business logic, persistence, and data storage.
- **Benefit**: Clients and servers can evolve independently across different platforms (e.g., React web client and Flutter mobile client sharing one Express backend).

### 2. Statelessness (CRITICAL EXAM CONCEPT)
- **Principle**: The server must **never store the client's session state** between requests. Every single incoming request must contain all the information necessary for the server to understand and process it (e.g., JWT token in the `Authorization` header).
- **Benefit**: Massive horizontal scalability. Any server in a cluster can handle any request because no server holds memory of previous requests.

### 3. Cacheability
- **Principle**: Responses must implicitly or explicitly define themselves as **cacheable** or **non-cacheable**.
- **Implementation**: Controlled via HTTP headers (`Cache-Control: public, max-age=3600`, `ETag`, `Last-Modified`).
- **Benefit**: Eliminates redundant server round-trips, improving client speed and decreasing server load.

### 4. Uniform Interface (The Core Pillar)
A uniform interface decouples the architecture and allows each part to evolve independently. It consists of 4 sub-principles:
1. **Identification of Resources**: Resources are identified by URIs (`/api/v1/transactions/42`).
2. **Manipulation of Resources through Representations**: A client holds a representation (e.g., JSON) and modifies the resource by sending representations back with HTTP verbs (PUT, PATCH, DELETE).
3. **Self-Descriptive Messages**: Each message contains enough information to describe how to process it (e.g., `Content-Type: application/json`).
4. **HATEOAS (Hypermedia As The Engine Of Application State)**: Responses contain hypermedia links to dynamic actions the client can take next (e.g., links to cancel or view an order).

### 5. Layered System
- **Principle**: A client cannot tell whether it is connected directly to the end server or to an intermediary (such as a CDN, reverse proxy, API gateway, or load balancer).
- **Benefit**: Allows adding caching layers, security firewalls, and load balancing without altering client code.

### 6. Code on Demand (Optional)
- **Principle**: Servers can temporarily extend or customize client functionality by transferring executable code (e.g., JavaScript snippets, WebAssembly).
- **Note**: The only optional constraint in REST.

---

## 3. Resource-Oriented URI Design Best Practices

### Rule 1: Use Nouns, Not Verbs
- ❌ Bad: `/api/getTransactions`, `/api/createBudget`, `/api/deleteUser/4`
- ✅ Good: `GET /api/transactions`, `POST /api/budgets`, `DELETE /api/users/4`

### Rule 2: Use Plural Nouns for Collections
- ❌ Bad: `/api/transaction`, `/api/account/4`
- ✅ Good: `/api/transactions`, `/api/accounts/4`

### Rule 3: Represent Hierarchies & Sub-Resources Logically
To fetch transactions belonging to a specific account:
- ✅ Good: `GET /api/accounts/:accountId/transactions`
To fetch a specific transaction:
- ✅ Good: `GET /api/accounts/:accountId/transactions/:transactionId`

### Rule 4: Use Query Parameters for Filtering, Sorting, and Pagination
- ❌ Bad: `/api/transactions/filter/food/page/2`
- ✅ Good: `/api/transactions?category=food&page=2&limit=20&sort=desc`

### Rule 5: Versioning
Always include the API version in the URI or header:
- ✅ Good: `/api/v1/analytics/overview`

---

## 4. HTTP Verbs & Status Codes in REST

| Action | HTTP Verb | URI Pattern | Ideal Status Code |
| :--- | :--- | :--- | :--- |
| **List Resources** | `GET` | `/api/v1/goals` | `200 OK` |
| **Get Single Resource** | `GET` | `/api/v1/goals/:id` | `200 OK` (or `404 Not Found`) |
| **Create Resource** | `POST` | `/api/v1/goals` | `201 Created` (+ `Location` header) |
| **Replace Resource** | `PUT` | `/api/v1/goals/:id` | `200 OK` or `204 No Content` |
| **Update Partially** | `PATCH` | `/api/v1/goals/:id` | `200 OK` |
| **Delete Resource** | `DELETE` | `/api/v1/goals/:id` | `204 No Content` or `200 OK` |

---

## 5. Manual Coding Drill: Standard RESTful CRUD Resource

> **Exam Drill**: "Write a clean RESTful Express router managing a `/api/v1/budgets` resource implementing GET (list & single), POST, PUT, and DELETE."

```javascript
const express = require('express');
const router = express.Router();

let budgets = [
  { id: "b_1", category: "Dining", allocated: 8000, spent: 4200 },
  { id: "b_2", category: "Rent", allocated: 25000, spent: 25000 }
];

// 1. GET /api/v1/budgets (Read Collection with filter)
router.get('/', (req, res) => {
  const { category } = req.query;
  if (category) {
    const filtered = budgets.filter(b => b.category.toLowerCase() === category.toLowerCase());
    return res.status(200).json({ success: true, count: filtered.length, data: filtered });
  }
  res.status(200).json({ success: true, count: budgets.length, data: budgets });
});

// 2. GET /api/v1/budgets/:id (Read Single)
router.get('/:id', (req, res) => {
  const budget = budgets.find(b => b.id === req.params.id);
  if (!budget) {
    return res.status(404).json({ success: false, error: "Budget not found" });
  }
  res.status(200).json({ success: true, data: budget });
});

// 3. POST /api/v1/budgets (Create Resource)
router.post('/', (req, res) => {
  const { category, allocated } = req.body;
  if (!category || typeof allocated !== 'number') {
    return res.status(400).json({ success: false, error: "category and allocated amount required" });
  }

  const newBudget = {
    id: `b_${Date.now()}`,
    category,
    allocated,
    spent: 0
  };

  budgets.push(newBudget);
  res.status(201).json({ success: true, data: newBudget });
});

// 4. PUT /api/v1/budgets/:id (Full Replacement)
router.put('/:id', (req, res) => {
  const index = budgets.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Budget not found" });
  }

  const { category, allocated, spent } = req.body;
  if (!category || allocated === undefined || spent === undefined) {
    return res.status(400).json({ success: false, error: "PUT requires full replacement representation" });
  }

  budgets[index] = { id: req.params.id, category, allocated, spent };
  res.status(200).json({ success: true, data: budgets[index] });
});

// 5. DELETE /api/v1/budgets/:id (Remove Resource)
router.delete('/:id', (req, res) => {
  const initialLength = budgets.length;
  budgets = budgets.filter(b => b.id !== req.params.id);

  if (budgets.length === initialLength) {
    return res.status(404).json({ success: false, error: "Budget not found" });
  }

  // 204 No Content is standard REST for successful deletion
  res.status(204).send();
});

module.exports = router;
```
