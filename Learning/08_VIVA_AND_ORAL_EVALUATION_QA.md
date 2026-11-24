# Module 08: Viva & Oral Evaluation Q&A (50+ Rapid-Fire Questions)

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Format**: Question & High-Scoring Model Answer  
> **Use**: Rapid oral examination prep, trick questions, and concept checks

---

## Section 1: JavaScript Fundamentals & Core Concepts

### Q1: What is the difference between `var`, `let`, and `const`?
**Answer**: `var` is function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and hoisted into the **Temporal Dead Zone (TDZ)** without initialization (accessing them before declaration throws a `ReferenceError`). `const` also prevents variable re-assignment.

### Q2: What is the Temporal Dead Zone (TDZ)?
**Answer**: The TDZ is the period of time between entering a scope and the variable declaration being evaluated by the JS engine. Variables declared with `let` and `const` reside in the TDZ and cannot be accessed until their declaration line is executed.

### Q3: What is a Closure? Give a practical example.
**Answer**: A closure is the combination of a function bundled together with references to its surrounding lexical environment. It allows an inner function to remember and access variables from an outer function even after the outer function has finished executing. Practical examples include data encapsulation (private variables), function factories, and memoization.

### Q4: What is the difference between `==` and `===`?
**Answer**: `==` (abstract equality) performs type coercion before comparison if types differ. `===` (strict equality) checks both value and type without coercion. For example, `'5' == 5` is `true`, but `'5' === 5` is `false`.

### Q5: What is the Call Stack?
**Answer**: The Call Stack is a LIFO (Last In, First Out) data structure used by the JavaScript engine to keep track of function execution contexts. The currently executing function is at the top of the stack, and is popped off upon completion.

---

## Section 2: Asynchronous JavaScript & The Event Loop

### Q6: If JavaScript is single-threaded, how does it handle asynchronous I/O?
**Answer**: JavaScript delegates asynchronous operations (timers, file I/O, network requests) to the browser Web APIs or Node.js libuv C++ background threads. Once the background operation finishes, its callback is placed in a task queue (Microtask or Macrotask). The **Event Loop** pushes these callbacks onto the Call Stack only when the stack is empty.

### Q7: What is the difference between the Microtask Queue and the Macrotask Queue?
**Answer**: 
- **Microtask Queue**: Has higher priority. Contains Promise callbacks (`.then()`, `.catch()`, `.finally()`), `queueMicrotask()`, and in Node.js `process.nextTick()`.
- **Macrotask Queue**: Contains `setTimeout`, `setInterval`, `setImmediate`, and I/O events.
- **Rule**: When the Call Stack is empty, the Event Loop executes **ALL** pending microtasks before processing the next macrotask.

### Q8: What are the three states of a Promise?
**Answer**: 
1. `pending`: Initial state, neither fulfilled nor rejected.
2. `fulfilled`: Operation completed successfully (`resolve()`).
3. `rejected`: Operation failed (`reject()`).

### Q9: What is the difference between `Promise.all` and `Promise.allSettled`?
**Answer**: `Promise.all` fails fast — if any promise rejects, the entire returned promise rejects immediately. `Promise.allSettled` waits for all promises to finish regardless of success or failure, returning an array of objects describing each outcome (`{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`).

### Q10: What does `async/await` do under the hood?
**Answer**: `async/await` is syntactic sugar over Promises and Generators. An `async` function always returns a Promise. The `await` keyword pauses function execution inside the generator until the awaited Promise settles, allowing non-blocking synchronous-looking code.

---

## Section 3: Node.js Runtime & libuv

### Q11: What is Node.js and what are its core architectural components?
**Answer**: Node.js is a cross-platform JavaScript runtime. Its two core components are:
1. **Google V8 Engine**: Compiles JS directly to native machine code.
2. **libuv**: A C library that provides the event loop, thread pool (4 worker threads by default), and cross-platform asynchronous I/O.

### Q12: Is Node.js completely single-threaded?
**Answer**: No. The JavaScript execution (call stack and event loop) is single-threaded. However, Node.js uses **libuv's multi-threaded worker pool** for operations that cannot be done asynchronously by the OS kernel, such as file system I/O, DNS queries, cryptographic computations, and compression.

### Q13: What is the difference between CommonJS and ES Modules?
**Answer**: CommonJS uses `require()` and `module.exports` and loads modules synchronously at runtime. ES Modules use `import` and `export` and load modules asynchronously via static compile-time analysis, enabling tree-shaking and top-level `await`.

### Q14: What is `process.argv`?
**Answer**: An array containing the command-line arguments passed when launching the Node.js process. Index 0 is the `node` binary path, index 1 is the script file path, and index 2 onwards are custom user arguments.

### Q15: What is `process.nextTick()` and how does it differ from `setImmediate()`?
**Answer**: `process.nextTick()` callbacks run immediately after the current operation completes, before the event loop continues (priority microtask). `setImmediate()` callbacks are scheduled to run in the check phase of the event loop (macrotask).

---

## Section 4: Node Core Modules (`fs`, `path`, `events`, `streams`)

### Q16: What is the difference between `path.join()` and `path.resolve()`?
**Answer**: `path.join()` concatenates path segments using the platform-specific separator (`/` or `\`). `path.resolve()` processes path segments from right to left until an absolute path is formed, effectively simulating sequence of `cd` commands from the current working directory.

### Q17: What are the three ways to work with the `fs` module?
**Answer**: 
1. Synchronous (blocking): `fs.readFileSync`
2. Callback-based (non-blocking): `fs.readFile`
3. Promise-based (clean async/await): `fs.promises.readFile` or `require('fs/promises')`

### Q18: What is a Buffer in Node.js?
**Answer**: A `Buffer` is a chunk of fixed-size raw binary memory allocated outside V8's garbage-collected heap. It is used to handle raw binary data such as file contents, network packets, and image processing.

### Q19: What is Backpressure in streams?
**Answer**: Backpressure occurs when a readable stream produces data faster than the writable stream can consume it. If unhandled, chunks accumulate in memory causing memory spikes. Node's `pipe()` and `stream.pipeline()` handle backpressure automatically by pausing the readable stream when the writable internal buffer is full (`highWaterMark`).

### Q20: What are the primary methods of `EventEmitter`?
**Answer**: 
- `.on(event, listener)`: Registers a callback for named event.
- `.emit(event, ...args)`: Synchronously triggers all listeners with arguments.
- `.once(event, listener)`: Registers a callback that fires once and removes itself.
- `.removeListener(event, listener)`: Unregisters a listener.

---

## Section 5: HTTP Protocol & Networking

### Q21: What is the difference between Safe and Idempotent HTTP methods?
**Answer**:
- **Safe**: Does not alter server resource state (read-only): `GET`, `HEAD`, `OPTIONS`.
- **Idempotent**: Making $N$ identical requests has the same server state effect as making 1 request: `GET`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`. `POST` is NOT idempotent.

### Q22: Is `PATCH` idempotent?
**Answer**: Not necessarily. While a PATCH that sets absolute values (`{ name: "John" }`) is idempotent, a PATCH that applies deltas or increments (`{ $inc: { balance: 100 } }`) produces a different state with every execution.

### Q23: What is the difference between 401 Unauthorized and 403 Forbidden?
**Answer**: 
- **401 Unauthorized**: Authentication is required or credentials are missing/invalid (**"Who are you?"**).
- **403 Forbidden**: Identity is known and authenticated, but the user does not possess authorization permissions for that resource (**"I know who you are, but you cannot perform this action"**).

### Q24: What is a 204 No Content status code used for?
**Answer**: It indicates the request succeeded, but the server intentionally returns no response body. Commonly used for `DELETE` operations or `PUT` actions where no updated object needs to be returned.

### Q25: What is CORS and why is it needed?
**Answer**: Cross-Origin Resource Sharing. A browser security mechanism that restricts a web page from making requests to a different domain, port, or protocol than the one that served the page. Servers use response headers (`Access-Control-Allow-Origin`) to grant permission.

---

## Section 6: Express.js & Middleware

### Q26: What is Middleware in Express?
**Answer**: A function that has access to the request object (`req`), response object (`res`), and the `next` function in the application cycle. Middleware can run code, mutate `req`/`res`, terminate the request, or pass control to the next middleware using `next()`.

### Q27: Name the 5 types of middleware in Express.
**Answer**: 
1. Application-level (`app.use()`)
2. Router-level (`router.use()`)
3. Built-in (`express.json()`, `express.static()`)
4. Third-party (`cors()`, `helmet()`, `morgan()`)
5. Error-handling (`(err, req, res, next)`)

### Q28: How does Express recognize Error-Handling Middleware?
**Answer**: By its arity (parameter count). Error-handling middleware **must have exactly 4 parameters**: `(err, req, res, next)`. If you provide only 3 parameters, Express treats it as standard middleware.

### Q29: What happens if a middleware does not call `next()` and does not send a response?
**Answer**: The HTTP connection remains open, and the client request hangs indefinitely until a network or gateway timeout occurs.

### Q30: What is the difference between `req.params` and `req.query`?
**Answer**: 
- `req.params`: Captures dynamic path segments in route definitions (e.g., `/api/users/:id` $\rightarrow$ `req.params.id`). Used for identifying specific resources.
- `req.query`: Captures URL query string parameters after `?` (e.g., `?sort=asc&page=2` $\rightarrow$ `req.query.sort`). Used for filtering, sorting, and pagination.

---

## Section 7: REST API Architecture

### Q31: What are the 6 architectural constraints of REST?
**Answer**: 
1. Client-Server Architecture
2. Statelessness
3. Cacheability
4. Uniform Interface
5. Layered System
6. Code on Demand (Optional)

### Q32: What does Statelessness mean in REST?
**Answer**: The server retains no client session context between requests. Each request from any client must contain all necessary authentication and context data (e.g., JWT token in the header) for the server to fulfill it independently.

### Q33: Why should REST URIs use nouns instead of verbs?
**Answer**: Because HTTP verbs (GET, POST, PUT, DELETE) already define the action to be performed. The URI should identify the **resource** being manipulated (e.g. `POST /transactions` instead of `POST /createTransaction`).

### Q34: What is HATEOAS?
**Answer**: Hypermedia As The Engine Of Application State. A constraint of Uniform Interface where the server returns hypermedia links along with data, guiding the client on what actions or related resources are available next.

---

## Section 8: Finora Project Architecture Questions

### Q35: How does Finora implement Stateless REST?
**Answer**: Finora’s frontend attaches a Supabase JWT in the `Authorization: Bearer <token>` header of every API request. The backend validates the token statelessly using cryptographic signatures and extracts the user’s identity without maintaining session tables or memory on the server.

### Q36: Why does Finora stream bank statement CSV uploads?
**Answer**: Bank statements can contain thousands of transaction rows. Reading the entire file into memory as a monolithic string risks memory spikes and DoS. Streaming reads and parses data chunk-by-chunk with low memory overhead.

### Q37: How does Finora’s edge proxy (`proxy.ts`) relate to Express middleware?
**Answer**: `proxy.ts` acts as application-level middleware at the network edge. It intercepts incoming HTTP requests before routing to pages, verifies session cookie validity, and transparently refreshes expired auth tokens.
