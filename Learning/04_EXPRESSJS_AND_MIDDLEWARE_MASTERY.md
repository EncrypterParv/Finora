# Module 04: Express.js Architecture & Middleware Mastery

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Topic**: Express.js, Routing, Route Params, Query Strings, `express.Router()`, 5 Middleware Types, Error Handling  
> **Evaluation Relevance**: Extreme (Professors ask middleware flow and error handlers in almost every evaluation)

---

## 1. Introduction to Express.js

Express is a fast, unopinionated, minimalist web framework for Node.js. It simplifies HTTP server development by providing:
- Routing abstractions (`app.get`, `app.post`, etc.).
- A powerful **Middleware Pipeline**.
- Simplified request/response helpers (`res.json()`, `res.status()`, `req.params`).

---

## 2. Express Application Setup & Routing

```javascript
const express = require('express');
const app = express();

// Built-in middleware to parse incoming JSON payloads
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Welcome to Finora API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

---

## 3. Parameters in Express: Route Params vs Query Params vs Body

| Parameter Type | Location in HTTP Request | Express Property | Example URL / Request | When to Use |
| :--- | :--- | :--- | :--- | :--- |
| **Route Params** | URL Path Segment | `req.params` | `/api/users/:id` $\rightarrow$ `/api/users/42` | Identifying a **specific resource** |
| **Query Params** | URL Query String (`?key=val`) | `req.query` | `/api/tx?category=food&limit=10` | **Filtering, sorting, searching, pagination** |
| **Request Body** | Message Payload | `req.body` | `{"amount": 500, "note": "Lunch"}` | **Creating / updating data** |

### Code Example:
```javascript
app.get('/api/accounts/:accountId/transactions', (req, res) => {
  // 1. Route Parameter (identifies the account)
  const { accountId } = req.params;

  // 2. Query Parameters (filtering & pagination)
  const { category, minAmount, page = 1 } = req.query;

  res.json({
    accountId,
    filters: { category, minAmount },
    page: Number(page)
  });
});
```

---

## 4. `express.Router()` (Modular Architecture)

Rather than defining all routes on the global `app` object, Express allows modularizing routes using `express.Router()`.

```javascript
// routes/transactions.js
const express = require('express');
const router = express.Router();

// Defined relative to the mount path
router.get('/', (req, res) => {
  res.json({ transactions: [] });
});

router.post('/', (req, res) => {
  const { amount, title } = req.body;
  res.status(201).json({ id: Date.now(), amount, title });
});

module.exports = router;

// app.js
const express = require('express');
const app = express();
const transactionRoutes = require('./routes/transactions');

app.use(express.json());

// Mount the router at a common base path:
app.use('/api/v1/transactions', transactionRoutes);
```

---

## 5. Middleware Architecture & Execution Pipeline

> **Definition**: Middleware functions are functions that have access to the **request object (`req`)**, the **response object (`res`)**, and the **`next` function** in the application’s request-response cycle.

```
                         THE MIDDLEWARE PIPELINE
                         
    Incoming HTTP Request
             │
             ▼
    ┌─────────────────────────────────┐
    │  Middleware 1: Request Logger   │ ---> console.log(`${req.method} ${req.url}`)
    └────────────────┬────────────────┘
                     │ next()
                     ▼
    ┌─────────────────────────────────┐
    │  Middleware 2: express.json()   │ ---> Parses raw buffer body into req.body
    └────────────────┬────────────────┘
                     │ next()
                     ▼
    ┌─────────────────────────────────┐
    │  Middleware 3: Auth Validator   │ ---> Verifies JWT Token in Authorization header
    └────────────────┬────────────────┘
                     │ next()  (or returns 401 if invalid)
                     ▼
    ┌─────────────────────────────────┐
    │  Route Handler: POST /tx        │ ---> Controller logic, queries DB, returns res.status(201).json()
    └─────────────────────────────────┘
```

### What can middleware do?
1. Execute any code.
2. Make changes to the `req` and `res` objects (e.g. attaching `req.user`).
3. End the request-response cycle (e.g. `res.status(401).send(...)`).
4. Call the next middleware function in the stack using `next()`.

---

## 6. The 5 Types of Middleware in Express

### 1. Application-Level Middleware
Bound to an instance of `app` using `app.use()` or `app.METHOD()`:
```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware
});
```

### 2. Router-Level Middleware
Bound to an instance of `express.Router()`:
```javascript
const router = express.Router();

router.use((req, res, next) => {
  console.log('Transaction Router Accessed');
  next();
});
```

### 3. Built-in Middleware
Shipped with Express:
- `express.json()`: Parses incoming requests with JSON payloads.
- `express.urlencoded({ extended: true })`: Parses URL-encoded bodies (form submissions).
- `express.static('public')`: Serves static files (images, CSS, HTML).

### 4. Third-Party Middleware
Installed via npm:
- `cors()`: Enables Cross-Origin Resource Sharing.
- `morgan()`: HTTP request logger.
- `helmet()`: Sets secure HTTP headers.

### 5. Error-Handling Middleware (CRITICAL!)
Must **always take four arguments**: `(err, req, res, next)`.  
If you omit `next` (giving only 3 arguments), Express treats it as standard middleware, and error handling will fail!

```javascript
// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Error Caught:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: message
  });
});
```

---

## 7. Middleware Traps & Professor Viva Questions

### Q1: What happens if you forget to call `next()`?
**Answer**: The request-response cycle hangs indefinitely until the client hits a timeout (e.g., Gateway Timeout 504), because Express does not know to proceed to the next handler.

### Q2: What happens if you pass an argument to `next()` like `next(new Error("Database down"))`?
**Answer**: Express immediately skips **all** remaining non-error middleware and route handlers in the stack and jumps directly to the first registered **Error-Handling Middleware** (`(err, req, res, next)`).

### Q3: What is `next('route')`?
**Answer**: In route-level middleware, `next('route')` bypasses the remaining middleware functions in the current route sub-stack and passes control to the **next route definition** matching the path.

---

## 8. Manual Coding Drill: Complete Express Application

> **Exam Drill**: "Write a complete Express server with a bearer-token auth middleware, input validation, modular routes, and a global error handler."

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// 1. Custom Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Header format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  if (token !== "secret-finora-key") {
    return res.status(403).json({ error: "Forbidden. Invalid token." });
  }

  // Attach decoded user info to request object
  req.user = { id: "user_123", role: "admin" };
  next();
};

// 2. Custom Validation Middleware
const validateTransaction = (req, res, next) => {
  const { amount, category } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    const error = new Error("Amount must be a positive number");
    error.statusCode = 422;
    return next(error); // Forward to error handler
  }
  if (!category || typeof category !== 'string') {
    const error = new Error("Category must be a non-empty string");
    error.statusCode = 422;
    return next(error);
  }
  next();
};

// 3. Protected Route
app.post('/api/transactions', authenticateToken, validateTransaction, (req, res) => {
  const { amount, category } = req.body;
  const newTx = {
    id: `tx_${Date.now()}`,
    userId: req.user.id,
    amount,
    category
  };
  res.status(201).json({ success: true, data: newTx });
});

// 4. 404 Route Not Found Handler
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// 5. Global Error Handling Middleware (4 Parameters!)
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    status: status,
    error: err.message || "Internal Server Error"
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```
