const { sanitizeSeq } = require("./shared");

// The recursion tree grows roughly as 3^(n+m); beyond 6x6 the tree returned to
// the client becomes too large to render or even serialise comfortably.
const MAX_BRUTE_FORCE_LENGTH = 6;

/**
 * Naive recursive global alignment, used to show why DP is needed.
 *
 * solve(i, j) returns the best score for aligning the suffixes A[i..] and B[j..]
 * by trying the same three moves as Needleman–Wunsch (diag / up / left) with no
 * memoisation. It therefore returns the same optimal score as alignGlobal(), but
 * revisits the same (i, j) subproblem many times.
 *
 * Returned counters:
 *   - callCount:      total number of solve() calls
 *   - recomputations: calls whose (i, j) had already been solved before —
 *                     exactly the work a DP table would have saved
 *   - recursionTree:  every call as a node ({ id, i, j, value, children, isDuplicate })
 */
function bruteForceDemo(seqA, seqB, match, mismatch, gap) {
  const a = sanitizeSeq(seqA);
  const b = sanitizeSeq(seqB);

  if (a.length > MAX_BRUTE_FORCE_LENGTH || b.length > MAX_BRUTE_FORCE_LENGTH) {
    throw new Error(`Brute force demo supports sequences up to length ${MAX_BRUTE_FORCE_LENGTH}.`);
  }

  let callCount = 0;
  let recomputations = 0;
  let nodeId = 0;
  const seen = new Set();

  function solve(i, j) {
    callCount += 1;
    const key = `${i},${j}`;
    const isDuplicate = seen.has(key);
    if (isDuplicate) {
      recomputations += 1;
    } else {
      seen.add(key);
    }

    const node = {
      id: nodeId++,
      i,
      j,
      value: 0,
      children: [],
      isDuplicate,
    };

    if (i === a.length && j === b.length) {
      node.value = 0;
      return { value: 0, node };
    }

    let best = Number.NEGATIVE_INFINITY;

    if (i < a.length && j < b.length) {
      const diagResult = solve(i + 1, j + 1);
      node.children.push(diagResult.node);
      const scoreDelta = a[i] === b[j] ? match : mismatch;
      best = Math.max(best, diagResult.value + scoreDelta);
    }

    if (i < a.length) {
      const upResult = solve(i + 1, j);
      node.children.push(upResult.node);
      best = Math.max(best, upResult.value + gap);
    }

    if (j < b.length) {
      const leftResult = solve(i, j + 1);
      node.children.push(leftResult.node);
      best = Math.max(best, leftResult.value + gap);
    }

    node.value = best;
    return { value: best, node };
  }

  const result = solve(0, 0);

  return {
    callCount,
    recomputations,
    recursionTree: result.node,
    score: result.value,
  };
}

module.exports = { bruteForceDemo, MAX_BRUTE_FORCE_LENGTH };
