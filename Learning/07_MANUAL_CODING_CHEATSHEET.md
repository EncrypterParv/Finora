# Module 07: Manual Coding Cheatsheet (Pen & Paper Drills)

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Purpose**: Memorize and practice writing these 15 exact snippets by hand for lab exams, written tests, and blackboard coding evaluations.

---

## Drill 1: Pure Node.js HTTP Server (Without Express)
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  const { method, url } = req;
  res.setHeader('Content-Type', 'application/json');

  if (method === 'GET' && url === '/api/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(3000, () => console.log('Listening on port 3000'));
```

---

## Drill 2: Express CRUD REST API
```javascript
const express = require('express');
const app = express();
app.use(express.json());

let items = [];

app.get('/api/items', (req, res) => res.status(200).json(items));

app.post('/api/items', (req, res) => {
  const item = { id: Date.now(), ...req.body };
  items.push(item);
  res.status(201).json(item);
});

app.put('/api/items/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  items[index] = { id, ...req.body };
  res.status(200).json(items[index]);
});

app.delete('/api/items/:id', (req, res) => {
  const id = Number(req.params.id);
  items = items.filter(i => i.id !== id);
  res.status(204).send();
});

app.listen(3000);
```

---

## Drill 3: Express Bearer-Token Auth Middleware
```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== 'secret123') {
    return res.status(403).json({ error: 'Forbidden. Invalid token.' });
  }

  req.user = { id: 'u_1', role: 'admin' };
  next();
}
```

---

## Drill 4: Express Global Error Handler (4 Parameters!)
```javascript
// MUST have all 4 arguments (err, req, res, next)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    status,
    message: err.message || 'Internal Server Error'
  });
});
```

---

## Drill 5: `Array.prototype.myMap` Polyfill
```javascript
Array.prototype.myMap = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      result.push(callback(this[i], i, this));
    }
  }
  return result;
};
```

---

## Drill 6: `Array.prototype.myFilter` Polyfill
```javascript
Array.prototype.myFilter = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback(this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};
```

---

## Drill 7: `Array.prototype.myReduce` Polyfill
```javascript
Array.prototype.myReduce = function(callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;

  if (accumulator === undefined) {
    if (this.length === 0) throw new TypeError('Empty array with no initial value');
    accumulator = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    if (i in this) {
      accumulator = callback(accumulator, this[i], i, this);
    }
  }
  return accumulator;
};
```

---

## Drill 8: Custom EventEmitter From Scratch
```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(name, listener) {
    if (!this.events[name]) this.events[name] = [];
    this.events[name].push(listener);
  }

  emit(name, ...args) {
    if (this.events[name]) {
      this.events[name].forEach(fn => fn(...args));
    }
  }

  removeListener(name, listenerToRemove) {
    if (this.events[name]) {
      this.events[name] = this.events[name].filter(fn => fn !== listenerToRemove);
    }
  }
}
```

---

## Drill 9: JSON File Read/Write with `fs.promises`
```javascript
const fs = require('fs').promises;

async function updateFile(filePath, newRecord) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const list = JSON.parse(data);
    list.push(newRecord);
    await fs.writeFile(filePath, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('File Error:', err.message);
  }
}
```

---

## Drill 10: File Copy Using Streams and `pipeline`
```javascript
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function streamCopy(src, dest) {
  const read = fs.createReadStream(src);
  const write = fs.createWriteStream(dest);
  await pipeline(read, write);
  console.log('Stream copy complete with backpressure handling');
}
```

---

## Drill 11: Asynchronous `fetch` with `try / catch / finally`
```javascript
async function loadData(url) {
  let loading = true;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error.message);
    throw error;
  } finally {
    loading = false;
  }
}
```

---

## Drill 12: Custom `Promise.all` Polyfill
```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    if (promises.length === 0) return resolve(results);

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then(val => {
          results[index] = val;
          completed++;
          if (completed === promises.length) resolve(results);
        })
        .catch(reject);
    });
  });
}
```

---

## Drill 13: Command-Line Argument Parser (`process.argv`)
```javascript
function parseCLI() {
  const args = process.argv.slice(2);
  const flags = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      flags[key] = val !== undefined ? val : true;
    }
  });
  return flags;
}
// node script.js --env=prod --port=8080 => { env: 'prod', port: '8080' }
```

---

## Drill 14: Dynamic Route with Params and Query Handling
```javascript
app.get('/api/users/:userId/orders', (req, res) => {
  const { userId } = req.params;
  const { status, limit = 10 } = req.query;

  res.status(200).json({
    user: userId,
    statusFilter: status || 'all',
    limit: Number(limit)
  });
});
```

---

## Drill 15: Modular Router Pattern (`express.Router()`)
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ users: ['Alice', 'Bob'] }));
router.get('/:id', (req, res) => res.json({ user: req.params.id }));

module.exports = router;

// app.js
const express = require('express');
const app = express();
const userRouter = require('./routes/users');

app.use('/api/v1/users', userRouter);
app.listen(3000);
```
