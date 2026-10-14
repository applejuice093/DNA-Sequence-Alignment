const { sanitizeSeq } = require("./shared");

function bruteForceDemo(seqA, seqB, match, mismatch, gap) {
  const a = sanitizeSeq(seqA);
  const b = sanitizeSeq(seqB);

  if (a.length > 6 || b.length > 6) {
    throw new Error("Brute force demo supports sequences up to length 6.");
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

module.exports = { bruteForceDemo };
