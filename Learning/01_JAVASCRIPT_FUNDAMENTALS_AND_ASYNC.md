# Module 01: JavaScript Deep Dive & Asynchronous Programming

> **Course**: Advanced Programming (AP) — Newton School of Technology  
> **Topic**: JavaScript Fundamentals, Execution Context, Scopes, Closures, Async JS & Event Loop  
> **Evaluation Relevance**: High (Viva theory questions + Pen & Paper polyfill coding drills)

---

## 1. Variables, Scopes & Memory

### 1.1 `var` vs `let` vs `const`

| Feature | `var` | `let` | `const` |
| :--- | :--- | :--- | :--- |
| **Scope** | Function-scoped | Block-scoped (`{ ... }`) | Block-scoped (`{ ... }`) |
| **Hoisting** | Hoisted with `undefined` initialization | Hoisted in **Temporal Dead Zone (TDZ)** | Hoisted in **Temporal Dead Zone (TDZ)** |
| **Re-declaration** | Allowed in same scope | SyntaxError | SyntaxError |
| **Re-assignment** | Allowed | Allowed | TypeError (immutable binding) |
| **Window/Global object** | Attaches as property | Does NOT attach | Does NOT attach |

### 1.2 Hoisting & Temporal Dead Zone (TDZ)
- **Hoisting**: JavaScript engine scans the code before execution and allocates memory for variable declarations and function declarations during the **Creation Phase** of the Execution Context.
- **Temporal Dead Zone (TDZ)**: The time between entering a scope and the variable declaration being evaluated for `let` and `const`. Accessing the variable in the TDZ throws a `ReferenceError: Cannot access 'x' before initialization`.

```javascript
// Example of Hoisting & TDZ
console.log(a); // Output: undefined (hoisted and initialized)
// console.log(b); // Throws ReferenceError: Cannot access 'b' before initialization (in TDZ)

var a = 10;
let b = 20;
```

---

## 2. Execution Context & The Call Stack

Every piece of JavaScript runs inside an **Execution Context**.
There are two primary types:
1. **Global Execution Context (GEC)**: Created when the script begins.
2. **Function Execution Context (FEC)**: Created whenever a function is invoked.

### Each Execution Context Has Two Phases:
1. **Creation Phase**:
   - `this` binding is established.
   - Memory space allocated for variables (`var` initialized to `undefined`, `let`/`const` uninitialized).
   - Functions are placed in memory in their entirety.
2. **Execution Phase**:
   - Code executed line by line.
   - Values assigned to variables.

```
       CALL STACK (LIFO - Last In, First Out)
      ┌───────────────────────────────┐
      │   bar() Execution Context     │  <-- Top of stack (currently running)
      ├───────────────────────────────┤
      │   foo() Execution Context     │
      ├───────────────────────────────┤
      │   Global Execution Context    │  <-- Base
      └───────────────────────────────┘
```

---

## 3. Closures & Lexical Scoping

> **Definition**: A **closure** is the combination of a function bundled together with references to its surrounding state (its **lexical environment**). A closure gives an inner function access to an outer function's scope even after the outer function has returned.

### Real-World Use Case: Data Encapsulation / Private State
```javascript
function createCounter(initialValue = 0) {
  let count = initialValue; // Private variable encapsulated in closure
  
  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getValue() {
      return count;
    }
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.getValue());  // 11
// count is NOT accessible directly from outside! (Data privacy)
```

---

## 4. Higher-Order Functions & Array Polyfills

Teachers frequently ask students to **write array polyfills manually on paper**.

### 4.1 `Array.prototype.myMap`
```javascript
Array.prototype.myMap = function(callback) {
  if (typeof callback !== 'function') throw new TypeError('Callback must be a function');
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) { // Handles sparse arrays
      result.push(callback(this[i], i, this));
    }
  }
  return result;
};

// Usage:
const nums = [1, 2, 3];
const doubled = nums.myMap(x => x * 2); // [2, 4, 6]
```

### 4.2 `Array.prototype.myFilter`
```javascript
Array.prototype.myFilter = function(callback) {
  if (typeof callback !== 'function') throw new TypeError('Callback must be a function');
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback(this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};

// Usage:
const evens = [1, 2, 3, 4].myFilter(x => x % 2 === 0); // [2, 4]
```

### 4.3 `Array.prototype.myReduce`
```javascript
Array.prototype.myReduce = function(callback, initialValue) {
  if (typeof callback !== 'function') throw new TypeError('Callback must be a function');
  let accumulator = initialValue;
  let startIndex = 0;

  if (accumulator === undefined) {
    if (this.length === 0) throw new TypeError('Reduce of empty array with no initial value');
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

// Usage:
const sum = [1, 2, 3, 4].myReduce((acc, curr) => acc + curr, 0); // 10
```

---

## 5. Asynchronous JavaScript & Promises

### 5.1 Callback Hell & Inversion of Control
- **Callback Hell (Pyramid of Doom)**: Deeply nested callbacks make code unreadable and fragile.
- **Inversion of Control**: Trusting an external function to call your callback function with the right arguments and exactly once.

### 5.2 Promises
A `Promise` is an object representing the eventual completion or failure of an asynchronous operation.
- **3 States**:
  1. `pending`: Initial state, neither fulfilled nor rejected.
  2. `fulfilled`: Operation completed successfully (`resolve()`).
  3. `rejected`: Operation failed (`reject()`).

```javascript
// Creating a Promise
function fetchUserData(userId) {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("User ID is required"));
      return;
    }
    setTimeout(() => {
      resolve({ id: userId, name: "Student", balance: 5000 });
    }, 100);
  });
}
```

### 5.3 `Promise.all` vs `Promise.allSettled` vs `Promise.race`
- `Promise.all([p1, p2])`: Rejects immediately if **any** promise rejects (**fail-fast**).
- `Promise.allSettled([p1, p2])`: Waits for all promises to settle (either fulfilled or rejected) and returns array of `{ status, value/reason }`.
- `Promise.race([p1, p2])`: Settles with the outcome of the **first** settled promise.

### 5.4 Manual Polyfill for `Promise.all`
```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Arguments must be an array"));
    }
    const results = [];
    let completedCount = 0;

    if (promises.length === 0) {
      return resolve(results);
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((value) => {
          results[index] = value;
          completedCount++;
          if (completedCount === promises.length) {
            resolve(results);
          }
        })
        .catch(reject); // Fail-fast on first rejection
    });
  });
}
```

---

## 6. The JavaScript Event Loop & Concurrency

JavaScript is **single-threaded** (one call stack, one memory heap), but it achieves non-blocking asynchronous execution via the **Event Loop**.

```
                           THE JAVASCRIPT EVENT LOOP
                           
    ┌──────────────────────┐          ┌──────────────────────┐
    │      CALL STACK      │          │     Web APIs / C++   │
    │  (Single Threaded)   │          │  (Timer, HTTP, File) │
    │                      │          └──────────┬───────────┘
    │  [ console.log ]     │                     │
    │  [ execute script ]  │                     │ Callbacks ready
    └──────────▲───────────┘                     ▼
               │                   ┌───────────────────────────┐
               │                   │   MICROTASKS QUEUE (High) │
               ├───────────────────┤  - Promises (.then/.catch)│
               │  Pushes next      │  - process.nextTick       │
               │  when stack empty │  - queueMicrotask         │
               │                   └───────────────────────────┘
               │                                 │ (Only when empty)
               │                   ┌─────────────▼─────────────┐
               └───────────────────┤   MACROTASKS QUEUE (Low)  │
                                   │  - setTimeout / Interval  │
                                   │  - setImmediate (Node.js) │
                                   │  - I/O polling            │
                                   └───────────────────────────┘
```

### Critical Execution Order Rule:
1. Synchronous code executes completely on the **Call Stack**.
2. When the Call Stack is empty, the Event Loop checks the **Microtask Queue**.
3. **ALL** microtasks are drained to empty before moving on.
4. The Event Loop picks **ONE** task from the **Macrotask Queue**.
5. After that macrotask runs, the Event Loop checks and drains the Microtask Queue again!

### Classic Exam Tracing Problem:
```javascript
console.log("1 - Start");

setTimeout(() => {
  console.log("2 - Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("3 - Promise");
});

queueMicrotask(() => {
  console.log("4 - Microtask");
});

console.log("5 - End");

// EXACT OUTPUT ORDER:
// 1 - Start
// 5 - End
// 3 - Promise
// 4 - Microtask
// 2 - Timeout
```
**Explanation**:
- `"1 - Start"` and `"5 - End"` run synchronously.
- Promise callback and `queueMicrotask` are pushed to the **Microtask Queue**.
- `setTimeout` is pushed to the **Macrotask Queue**.
- Call stack empties $\rightarrow$ Microtasks run first (`"3 - Promise"`, `"4 - Microtask"`).
- Then Macrotask runs (`"2 - Timeout"`).
