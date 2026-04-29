# DNA-Sequence-Alignment (Coding Skills DP)

Project assigned by Coding Skills 2

This project demonstrates how **Dynamic Programming (DP)** solves sequence alignment efficiently, and why brute-force recursion becomes infeasible.

## What This Project Demonstrates

- Global alignment (Needleman-Wunsch) and local alignment (Smith-Waterman)
- DP table construction with recurrence decisions (`diag`, `up`, `left`)
- Traceback reconstruction of aligned sequences
- Direct comparison between brute-force recursion vs DP
- Visualization of overlapping subproblems, optimal substructure, and memoization

## Setup

## 1) Server

```bash
cd server
npm install
```

Create `.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sequence_alignment_db
```

Run server:

```bash
npm run dev
```

## 2) Client

```bash
cd client
npm install
```

Create `.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run client:

```bash
npm run dev
```

Open: `http://localhost:5173`

## Tab Guide (DP Concepts by View)

- **Input**: Set sequences and scoring scheme; launch alignment/brute-force demos.
- **Result**: Inspect alignment score, aligned strings, similarity, and identity.
- **DP Matrix**: Watch cell-by-cell DP fill; visualize recurrence choice per step.
- **DP vs Brute**: Compare recursion tree recomputation vs DP one-pass table fill.
- **Traceback**: Follow reverse path through `traceTable` to build final alignment.
- **History**: Review, re-run, and delete recent persisted alignments.

## Complexity Analysis

| Metric | Brute Force | Dynamic Programming |
|---|---|---|
| Time complexity | `O(3^(n+m))` | `O(n*m)` |
| Space complexity | `O(n+m)` stack | `O(n*m)` table |
| Recomputations | Many | `0` (each cell once) |
| Practical for length ~20 | No | Yes |

