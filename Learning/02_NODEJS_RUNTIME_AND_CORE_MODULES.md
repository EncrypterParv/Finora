# Module 02: Node.js Runtime Architecture & Core Modules

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Topic**: Node.js Architecture, libuv, CommonJS, Core Modules (`fs`, `path`, `events`, `streams`, `readline`)  
> **Evaluation Relevance**: High (Viva theory questions + Pen & Paper code writing drills)

---

## 1. Node.js Runtime & Architecture

Node.js is an open-source, cross-platform **JavaScript runtime environment** that executes JavaScript code outside a web browser.

```
┌─────────────────────────────────────────────────────────────┐
│                       Your Application                      │
│                  (JavaScript / TypeScript)                  │
├─────────────────────────────────────────────────────────────┤
│                    Node.js Core API                         │
│           (fs, path, http, stream, events, crypto)          │
├──────────────────────────────┬──────────────────────────────┤
│       V8 JavaScript Engine   │          libuv               │
│  - Written in C++            │  - Written in C              │
│  - Compiles JS to machine    │  - Event loop                │
│    code (JIT compiler)       │  - Thread pool (4 threads)   │
│  - Memory allocation & GC    │  - Non-blocking async I/O    │
├──────────────────────────────┴──────────────────────────────┤
│               Operating System (macOS, Linux, Windows)       │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 Key Architecture Components
1. **Google V8 Engine**: Written in C++, converts JS directly into native machine code using Just-In-Time (JIT) compilation.
2. **libuv**: A multi-platform C library that provides the event loop, asynchronous file I/O, network sockets, child processes, and a worker thread pool.
3. **Single-Threaded Event Loop**: JS execution runs on a single main thread.
4. **libuv Thread Pool**: Heavy operations that the OS kernel cannot perform asynchronously (such as file I/O `fs`, DNS lookups, compression `zlib`, and cryptography `crypto`) are delegated to libuv's **worker thread pool** (default 4 threads, configurable via `process.env.UV_THREADPOOL_SIZE`).

---

## 2. Module Systems: CommonJS (CJS) vs ECMAScript Modules (ESM)

| Aspect | CommonJS (`.cjs` or default in Node) | ES Modules (`.mjs` or `"type": "module"`) |
| :--- | :--- | :--- |
| **Syntax** | `require()` and `module.exports` | `import` and `export` |
| **Loading Mechanism** | Synchronous, runtime evaluation | Asynchronous, static compile-time parsing |
| **Tree-Shaking** | Hard (dynamic dependencies) | Built-in (static dependency graph) |
| **Top-Level `await`** | Not supported (until recent Node) | Supported natively |
| **File extensions** | `.js`, `.cjs` | `.js`, `.mjs` |
| **`__dirname` / `__filename`** | Available natively | Must be derived from `import.meta.url` |

### 2.1 CommonJS Pattern
```javascript
// mathUtils.js
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }

module.exports = { add, subtract };

// app.js
const { add, subtract } = require('./mathUtils');
console.log(add(5, 3)); // 8
```

### 2.2 CommonJS Trap: `exports` vs `module.exports`
- `exports` is simply a reference pointing to `module.exports`.
- If you reassign `exports = { ... }`, you break the reference, and nothing gets exported!
- Safe rule: Always use `module.exports = { ... }`.

---

## 3. The `process` Global Object

`process` is a global object providing information about, and control over, the current Node.js process.

### 3.1 `process.argv` (Command-Line Arguments)
`process.argv` returns an array where:
- `process.argv[0]`: Absolute path to `node` executable.
- `process.argv[1]`: Absolute path to the executing script.
- `process.argv[2...]`: Custom command-line arguments passed by user.

```javascript
// run: node script.js --user=john --port=8080
const args = process.argv.slice(2);
console.log(args); // ['--user=john', '--port=8080']

// Simple argument parser:
const parsedArgs = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    parsedArgs[key] = value || true;
  }
});
console.log(parsedArgs); // { user: 'john', port: '8080' }
```

### 3.2 `process.env` (Environment Variables)
Stores environment configuration (e.g. database URLs, secret keys, ports):
```javascript
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

---

## 4. `path` Core Module

Handles cross-platform file and directory paths (Windows uses `\`, POSIX uses `/`).

```javascript
const path = require('path');

// 1. path.join(): Joins path segments using platform separator
const filePath = path.join(__dirname, 'data', 'users.json');

// 2. path.resolve(): Resolves to an absolute path from the current working directory
const absPath = path.resolve('data', 'users.json');

// 3. Extraction utilities
const fileName = path.basename('/docs/report.pdf');     // 'report.pdf'
const fileBase = path.basename('/docs/report.pdf', '.pdf'); // 'report'
const fileDir  = path.dirname('/docs/report.pdf');      // '/docs'
const fileExt  = path.extname('/docs/report.pdf');      // '.pdf'

// 4. path.parse(): Returns an object with root, dir, base, ext, name
console.log(path.parse('/docs/report.pdf'));
```

> **Viva Trap: `path.join()` vs `path.resolve()`**  
> `path.join()` simply concatenates paths with the separator.  
> `path.resolve()` treats paths as a sequence of `cd` commands and returns an **absolute** path from the filesystem root.

---

## 5. `fs` (File System) Core Module

Supports 3 programming styles:
1. **Synchronous** (`fs.readFileSync`): Blocks the entire main thread!
2. **Callback-based** (`fs.readFile`): Non-blocking asynchronous.
3. **Promise-based** (`fs.promises.readFile`): Preferred modern async approach.

### 5.1 Reading and Writing JSON Files
```javascript
const fs = require('fs').promises;
const path = require('path');

async function handleDatabase() {
  const filePath = path.join(__dirname, 'records.json');

  try {
    // 1. Read
    const rawData = await fs.readFile(filePath, 'utf-8');
    const records = JSON.parse(rawData);

    // 2. Mutate
    records.push({ id: Date.now(), title: "New Entry", amount: 1500 });

    // 3. Write back with formatting (null, 2)
    await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
    console.log("Record saved successfully!");
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File does not exist, initialize empty
      await fs.writeFile(filePath, JSON.stringify([]));
    } else {
      console.error("File error:", error.message);
    }
  }
}
```

---

## 6. Buffers & Streams (Memory Efficiency & Backpressure)

### 6.1 Buffers
A `Buffer` is a chunk of raw memory allocated outside V8's garbage-collected heap. Used to handle binary data (files, images, TCP streams).
```javascript
const buf = Buffer.from("Finora", "utf-8");
console.log(buf);               // <Buffer 46 69 6e 6f 72 61>
console.log(buf.toString());    // "Finora"
```

### 6.2 Streams
Streams are collections of data that might not be available all at once and don't have to fit into memory.
- **4 Stream Types**:
  1. `Readable`: Source from which data can be consumed (`fs.createReadStream`, `req`).
  2. `Writable`: Destination to which data can be written (`fs.createWriteStream`, `res`).
  3. `Duplex`: Both Readable and Writable (e.g. TCP Net Socket).
  4. `Transform`: Duplex stream that modifies data as it is written and read (e.g. `zlib.createGzip`).

### 6.3 Backpressure & Piping
- **Backpressure**: When the write speed of the writable stream is slower than the read speed of the readable stream, unconsumed chunks accumulate in memory.
- `pipe()` or `pipeline()` automatically manages backpressure by pausing the readable stream until the writable buffer drains.

```javascript
// Manual Coding Drill: Stream copy with pipeline
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function copyLargeFile(source, destination) {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(destination);

  // pipeline handles auto-cleanup and error handling
  await pipeline(readStream, writeStream);
  console.log("File streamed successfully without memory spikes!");
}
```

---

## 7. `events` Core Module & EventEmitter

Node.js uses an **event-driven architecture**. `EventEmitter` enables objects to emit named events that trigger registered listener functions.

### 7.1 Built-in Usage
```javascript
const EventEmitter = require('events');

class BankAccount extends EventEmitter {
  constructor(owner, initialBalance = 0) {
    super();
    this.owner = owner;
    this.balance = initialBalance;
  }

  deposit(amount) {
    this.balance += amount;
    this.emit('deposit', { owner: this.owner, amount, balance: this.balance });
  }

  withdraw(amount) {
    if (amount > this.balance) {
      this.emit('overdraft', { owner: this.owner, attempted: amount, balance: this.balance });
      return;
    }
    this.balance -= amount;
    this.emit('withdraw', { owner: this.owner, amount, balance: this.balance });
  }
}

// Subscribing to events:
const account = new BankAccount("Yash", 5000);

account.on('deposit', (data) => {
  console.log(`[ALERT] ₹${data.amount} deposited. Current Balance: ₹${data.balance}`);
});

account.on('overdraft', (data) => {
  console.error(`[REJECTED] Cannot withdraw ₹${data.attempted}. Balance is ₹${data.balance}`);
});

account.deposit(2000);  // Triggers deposit event
account.withdraw(10000); // Triggers overdraft event
```

### 7.2 Manual Polyfill: Build Custom EventEmitter from Scratch
*(Very common professor blackboard test question!)*

```javascript
class CustomEventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
    return this;
  }

  emit(eventName, ...args) {
    if (!this.events[eventName]) return false;
    this.events[eventName].forEach(listener => {
      listener(...args);
    });
    return true;
  }

  removeListener(eventName, listenerToRemove) {
    if (!this.events[eventName]) return this;
    this.events[eventName] = this.events[eventName].filter(
      listener => listener !== listenerToRemove
    );
    return this;
  }

  once(eventName, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.removeListener(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }
}
```

---

## 8. `readline` Core Module (Terminal I/O)

The `readline` module provides an interface for reading data from a Readable stream (such as `process.stdin`) line by line.

```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter your monthly budget: ₹", (answer) => {
  const budget = parseFloat(answer);
  if (isNaN(budget) || budget <= 0) {
    console.log("Invalid budget entered.");
  } else {
    console.log(`Monthly budget set to: ₹${budget.toLocaleString('en-IN')}`);
  }
  rl.close(); // Crucial to allow the process to terminate!
});
```
