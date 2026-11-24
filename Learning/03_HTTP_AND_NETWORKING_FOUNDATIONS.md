# Module 03: HTTP Protocol, Networking & Raw Node.js Servers

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Topic**: HTTP Protocol, Request/Response Lifecycle, Methods, Status Codes, Raw HTTP Server  
> **Evaluation Relevance**: Critical (Core viva theory + Writing HTTP server without Express on paper)

---

## 1. HTTP Protocol & Architecture

**HTTP (HyperText Transfer Protocol)** is an application-layer protocol operating on top of TCP/IP. It is:
1. **Client-Server**: Clients (browsers, mobile apps, curl) send requests; servers send responses.
2. **Stateless**: Each request is executed independently without the server remembering previous requests.
3. **Media Independent**: Any type of data can be transferred as long as both client and server specify the MIME type in `Content-Type`.

```
                    THE HTTP REQUEST-RESPONSE LIFECYCLE
                    
    ┌──────────┐                                             ┌──────────┐
    │  CLIENT  │                                             │  SERVER  │
    └────┬─────┘                                             └────┬─────┘
         │  1. DNS Lookup (Domain -> IP)                          │
         │  2. TCP 3-Way Handshake (SYN -> SYN-ACK -> ACK)        │
         │  3. TLS/SSL Handshake (if HTTPS)                       │
         │                                                        │
         │  4. HTTP REQUEST                                       │
         ├───────────────────────────────────────────────────────>│
         │     POST /api/v1/transactions HTTP/1.1                 │
         │     Host: api.finora.com                               │
         │     Authorization: Bearer <jwt-token>                  │
         │     Content-Type: application/json                     │
         │                                                        │
         │     { "amount": 450, "category": "Food" }              │
         │                                                        │
         │                                      5. Server parses  │
         │                                         middleware,    │
         │                                         auth, queries  │
         │                                         database       │
         │                                                        │
         │  6. HTTP RESPONSE                                      │
         │<───────────────────────────────────────────────────────┤
         │     HTTP/1.1 201 Created                               │
         │     Content-Type: application/json                     │
         │     Date: Tue, 24 Nov 2026 12:00:00 GMT                │
         │                                                        │
         │     { "id": "tx_99", "status": "success" }             │
         │                                                        │
         │  7. Connection closes or stays alive (Keep-Alive)      │
```

---

## 2. Anatomy of HTTP Messages

### 2.1 HTTP Request Anatomy
```http
POST /api/v1/accounts/acc_01/deposit HTTP/1.1     <-- 1. Request Line (Method, URI, Version)
Host: api.finora.com                              <-- 2. Request Headers (Key-Value metadata)
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Content-Length: 32
                                                  <-- 3. Empty Line (CRLF - Separates headers & body)
{"amount": 5000, "currency": "INR"}              <-- 4. Message Body (Payload)
```

### 2.2 HTTP Response Anatomy
```http
HTTP/1.1 200 OK                                   <-- 1. Status Line (Version, Status Code, Reason)
Content-Type: application/json; charset=utf-8     <-- 2. Response Headers
Content-Length: 48
Cache-Control: private, no-cache
                                                  <-- 3. Empty Line (CRLF)
{"success": true, "balance": 15400, "status": "OK"} <-- 4. Response Body
```

---

## 3. HTTP Methods: Safe vs Idempotent Matrix

> **Professor's Favorite Exam Question**:  
> "What is the difference between a Safe method and an Idempotent method? Is POST idempotent? Is PATCH idempotent?"

- **Safe Methods**: Calling the method does NOT alter the server's resource state (read-only operations).
- **Idempotent Methods**: Making $N$ identical requests has the **exact same side effect** on the server as making 1 request.

| HTTP Method | Purpose | Safe? | Idempotent? |
| :--- | :--- | :---: | :---: |
| **GET** | Retrieve a resource representation | **YES** | **YES** |
| **HEAD** | Same as GET, but returns headers only (no body) | **YES** | **YES** |
| **OPTIONS** | Describe communication options for target resource (CORS preflight) | **YES** | **YES** |
| **POST** | Create a subordinate resource or trigger processing | **NO** | **NO** *(Multiple calls create multiple records)* |
| **PUT** | Replace the target resource entirely | **NO** | **YES** *(Replacing with state X 5 times leaves state X)* |
| **PATCH** | Apply partial modifications to a resource | **NO** | **NO** *(e.g. `{ $inc: { views: 1 } }` increments every call)* |
| **DELETE** | Remove the target resource | **NO** | **YES** *(Deleting once deletes it; deleting again returns 404/204, resource remains gone)* |

---

## 4. HTTP Status Codes Matrix

### 2xx Success
- **200 OK**: Request succeeded. Standard response for GET, PUT, PATCH.
- **201 Created**: Resource successfully created. Returns `Location` header or created object (standard for POST).
- **204 No Content**: Request succeeded, but server intentionally returns no response body (common for DELETE).

### 3xx Redirection
- **301 Moved Permanently**: Resource permanently moved to new URI; clients should update bookmarks.
- **302 Found (Temporary Redirect)**: Resource temporarily residing at different URI.
- **304 Not Modified**: Conditional GET (`If-None-Match` / `ETag`). Client can use local cached copy (saves bandwidth).

### 4xx Client Errors
- **400 Bad Request**: Malformed syntax, invalid JSON, or missing required fields.
- **401 Unauthorized**: Authentication required or invalid/expired credentials (**"Who are you?"**).
- **403 Forbidden**: Server understands identity, but client lacks permissions (**"I know who you are, but you cannot enter"**).
- **404 Not Found**: Target URI does not exist.
- **409 Conflict**: Request conflicts with current server state (e.g. duplicate email registration).
- **422 Unprocessable Entity**: Syntactically valid JSON, but semantic validation failed (e.g. `age: -5`).

### 5xx Server Errors
- **500 Internal Server Error**: Unhandled exception on backend.
- **502 Bad Gateway**: Server received invalid response from upstream server (e.g. Nginx $\rightarrow$ Node.js crashed).
- **503 Service Unavailable**: Server overloaded or down for maintenance.
- **504 Gateway Timeout**: Upstream server took too long to reply.

---

## 5. HTTP Headers & CORS

### 5.1 Common Headers
- `Authorization`: Credentials for authentication (`Bearer <token>` or `Basic <base64>`).
- `Content-Type`: MIME type of the payload (`application/json`, `text/html`, `multipart/form-data`).
- `Accept`: Content types the client can process (`Accept: application/json`).
- `Cache-Control`: Caching directives (`no-store`, `no-cache`, `max-age=3600`).

### 5.2 CORS (Cross-Origin Resource Sharing)
Browsers enforce the **Same-Origin Policy** (same protocol, domain, port). CORS headers allow servers to relax this restriction:
- `Access-Control-Allow-Origin: *` (or specific origin like `https://finora.com`)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- **Preflight Request**: For non-simple requests, browsers send an `OPTIONS` request before the actual request.

---

## 6. Manual Coding Drill: Raw Node.js HTTP Server

> **Exam Drill**: "Write a pure Node.js HTTP server without Express that handles GET and POST on `/api/items` with JSON parsing and status codes."

```javascript
const http = require('http');
const url = require('url');

// In-memory data store
let items = [
  { id: 1, name: "Keyboard", price: 2500 }
];

const server = http.createServer((req, res) => {
  // Parse URL and Query parameters
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set default JSON headers
  res.setHeader('Content-Type', 'application/json');

  // Route: GET /api/items
  if (method === 'GET' && pathname === '/api/items') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: items }));
    return;
  }

  // Route: POST /api/items (Reading stream body chunks)
  if (method === 'POST' && pathname === '/api/items') {
    let rawBody = '';

    // Listen to stream data chunks
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });

    // When all chunks arrive
    req.on('end', () => {
      try {
        const payload = JSON.parse(rawBody);

        if (!payload.name || !payload.price) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "name and price are required" }));
          return;
        }

        const newItem = {
          id: Date.now(),
          name: payload.name,
          price: Number(payload.price)
        };

        items.push(newItem);

        res.writeHead(201);
        res.end(JSON.stringify({ success: true, data: newItem }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });
    return;
  }

  // Fallback: 404 Not Found
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Route not found" }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Raw HTTP Server running on http://localhost:${PORT}`);
});
```
