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

## API Reference

All endpoints are served under `http://localhost:5000/api` and exchange JSON. Errors always come back as `{ "message": "..." }` with a 4xx/5xx status.

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/` (no `/api` prefix) | — | `{ message }` health check |
| `POST` | `/api/align` | `seqA`, `seqB`, `algorithm` (`"global"` or `"local"`), optional `match` (default `1`), `mismatch` (`-1`), `gap` (`-2`) | `score`, `alignmentA`, `alignmentB`, `similarity`, `identity`, `dpTable`, `traceTable`, `steps`; the run is also saved to history |
| `POST` | `/api/bruteforce-demo` | `seqA`, `seqB` (each ≤ 6 chars), optional `match`, `mismatch`, `gap` | `score`, `callCount`, `recomputations`, `recursionTree` |
| `GET` | `/api/history` | — | The 20 most recent saved alignments, newest first |
| `DELETE` | `/api/history/:id` | — | `{ message }`; `400` for a malformed id, `404` if not found |

The API accepts sequences of up to 100 characters (`A`, `C`, `G`, `T`, `U`, case-insensitive).

Example:

```bash
curl -s http://localhost:5000/api/align \
  -H "Content-Type: application/json" \
  -d '{"seqA":"AGTACG","seqB":"ACATCG","algorithm":"global"}'
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

## Helper Scripts

Run from the repository root:

| Command | Script | What it does |
|---|---|---|
| `npm run dev` | `scripts/stop-dev-ports.js` + `concurrently` | Frees ports 5000 and 5173–5177, then starts server and client |
| `npm run dev:parallel` | `concurrently` | Same, without freeing ports first |
| `npm run dev:node` | `scripts/dev.js` | Starts both apps with plain Node (no `concurrently` needed) |
| `npm run stop` | `scripts/stop-dev-ports.js` | Stops whatever is listening on those ports (uses `lsof` on macOS/Linux, `netstat`/`taskkill` on Windows) |
| `npm run install:all` | — | `npm install` in root, client and server |
| `npm test` | — | Runs the server test suite |
| `npm run push -- "message"` | `scripts/autopush.js` | `git add .`, commits with the message (or a timestamp) and pushes to `origin main` |
| — | `node scripts/setup-git.js` | Interactive one-time setup: `git init`, set `origin`, user name/email, first commit and push to `main` |

> **Note:** `npm run stop` / `npm run dev` kill *any* process on those ports, not only this project. `npm run push` stages every change in the working tree and pushes straight to `main`; review `git status` first.
