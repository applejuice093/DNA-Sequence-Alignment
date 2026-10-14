# DNA-Sequence-Alignment (Coding Skills DP)

Project assigned by Coding Skills 2

This project demonstrates how **Dynamic Programming (DP)** solves sequence alignment efficiently, and why brute-force recursion becomes infeasible.

It is a MERN app: a React + Vite client visualises the DP table, traceback and recursion tree, and an Express + MongoDB server runs the algorithms and keeps a history of recent alignments.

## What This Project Demonstrates

- Global alignment (Needleman-Wunsch) and local alignment (Smith-Waterman)
- DP table construction with recurrence decisions (`diag`, `up`, `left`)
- Traceback reconstruction of aligned sequences
- Direct comparison between brute-force recursion vs DP
- Visualization of overlapping subproblems, optimal substructure, and memoization

## Prerequisites

- **Node.js 18 or newer** (and npm)
- **MongoDB** — a local `mongod` on port 27017 or a MongoDB Atlas connection string.
  The server refuses to start without a reachable database.

## Quick Start

From the repository root:

```bash
npm run install:all                     # installs root, client and server dependencies
cp server/.env.example server/.env      # then edit MONGO_URI if needed
cp client/.env.example client/.env
npm run dev                             # starts API (port 5000) and client (port 5173)
```

Open: `http://localhost:5173`

`npm run dev` first frees ports 5000 and 5173–5177 (see [Helper scripts](#helper-scripts)) and then runs both apps with `concurrently`.

## Running the Apps Separately

### 1) Server

```bash
cd server
npm install
cp .env.example .env
npm run dev        # nodemon, restarts on change; use `npm start` for plain node
```

### 2) Client

```bash
cd client
npm install
cp .env.example .env
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build into client/dist
```

## Environment Variables

| File | Variable | Default in example | Purpose |
|---|---|---|---|
| `server/.env` | `PORT` | `5000` | Port the API listens on |
| `server/.env` | `MONGO_URI` | `mongodb://127.0.0.1:27017/sequence_alignment_db` | MongoDB connection string, including the database name (required) |
| `client/.env` | `VITE_API_URL` | `http://localhost:5000/api` | API base URL, **including** `/api`. Restart Vite after changing it |

The API only accepts browser requests from `http://localhost:<port>` and `http://127.0.0.1:<port>` origins.

## Tests

The server has unit tests for the three algorithms and HTTP tests for request validation. They use Node's built-in test runner and do **not** need MongoDB:

```bash
npm test             # from the repo root
# or
cd server && npm test
```

## Project Structure

```text
.
├── client/                     React + Vite + Tailwind front end
│   └── src/
│       ├── pages/              One component per tab (Input, Result, DP Matrix, ...)
│       ├── components/         DP cell, navbar/tab bar, spinner, error banner
│       ├── context/            AlignmentContext: shared state and API calls
│       └── utils/              Formatting helpers (match line, heatmap colours, ...)
├── server/                     Express + Mongoose API
│   ├── algorithms/             needlemanWunsch.js, smithWaterman.js, bruteForce.js, shared.js
│   ├── models/                 Alignment history schema
│   ├── routes/                 /api/align, /api/bruteforce-demo, /api/history + validation
│   ├── test/                   node:test suites
│   ├── app.js                  Builds the Express app (CORS, JSON, routes, error handling)
│   └── server.js               Loads .env, connects to MongoDB, starts listening
└── scripts/                    Dev and git helper scripts used by the root package.json
```

## Tab Guide (DP Concepts by View)

- **Input**: Set sequences and scoring scheme; launch alignment/brute-force demos.
- **Result**: Inspect alignment score, aligned strings, similarity, and identity.
- **DP Matrix**: Watch cell-by-cell DP fill; visualize recurrence choice per step.
- **DP vs Brute**: Compare recursion tree recomputation vs DP one-pass table fill.
- **Traceback**: Follow reverse path through `traceTable` to build final alignment.
- **History**: Review, re-run, and delete recent persisted alignments.

Input rules: sequences may only contain `A`, `C`, `G`, `T` and `U`. The UI limits them to 20 characters (6 for the brute-force demo).

## Complexity Analysis

| Metric | Brute Force | Dynamic Programming |
|---|---|---|
| Time complexity | `O(3^(n+m))` | `O(n*m)` |
| Space complexity | `O(n+m)` stack | `O(n*m)` table |
| Recomputations | Many | `0` (each cell once) |
| Practical for length ~20 | No | Yes |
