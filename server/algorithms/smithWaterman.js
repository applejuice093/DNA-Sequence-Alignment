function sanitizeSeq(seq) {
  return String(seq || "").toUpperCase().trim();
}

function buildMetrics(alignmentA, alignmentB) {
  const length = alignmentA.length;
  if (length === 0) {
    return { similarity: 0, identity: 0 };
  }

  let matches = 0;
  let nonGapComparisons = 0;

  for (let k = 0; k < length; k += 1) {
    const a = alignmentA[k];
    const b = alignmentB[k];
    if (a === b && a !== "-" && b !== "-") {
      matches += 1;
    }
    if (a !== "-" && b !== "-") {
      nonGapComparisons += 1;
    }
  }

  const similarity = (matches / length) * 100;
  const identity = nonGapComparisons === 0 ? 0 : (matches / nonGapComparisons) * 100;
  return { similarity, identity };
}

function alignLocal(seqA, seqB, match, mismatch, gap) {
  const a = sanitizeSeq(seqA);
  const b = sanitizeSeq(seqB);
  const rows = a.length + 1;
  const cols = b.length + 1;

  const dpTable = Array.from({ length: rows }, () => Array(cols).fill(0));
  const traceTable = Array.from({ length: rows }, () => Array(cols).fill(null));
  const steps = [];

  let maxScore = 0;
  let maxI = 0;
  let maxJ = 0;

  // Fill DP table for local alignment:
  // each cell is max(0, diag, up, left), so negative paths are discarded.
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const isMatch = a[i - 1] === b[j - 1];
      const diag = dpTable[i - 1][j - 1] + (isMatch ? match : mismatch);
      const up = dpTable[i - 1][j] + gap;
      const left = dpTable[i][j - 1] + gap;

      let chosen = null;
      let best = 0;

      if (diag > best) {
        best = diag;
        chosen = "diag";
      }
      if (up > best) {
        best = up;
        chosen = "up";
      }
      if (left > best) {
        best = left;
        chosen = "left";
      }

      dpTable[i][j] = best;
      traceTable[i][j] = best === 0 ? null : chosen;
      steps.push({ i, j, diag, up, left, chosen: best === 0 ? "stop" : chosen });

      if (best > maxScore) {
        maxScore = best;
        maxI = i;
        maxJ = j;
      }
    }
  }

  // Trace back from the highest-scoring cell until score hits 0.
  let i = maxI;
  let j = maxJ;
  let alignmentA = "";
  let alignmentB = "";

  while (i > 0 && j > 0 && dpTable[i][j] > 0) {
    const direction = traceTable[i][j];
    if (direction === "diag") {
      alignmentA = a[i - 1] + alignmentA;
      alignmentB = b[j - 1] + alignmentB;
      i -= 1;
      j -= 1;
    } else if (direction === "up") {
      alignmentA = a[i - 1] + alignmentA;
      alignmentB = "-" + alignmentB;
      i -= 1;
    } else if (direction === "left") {
      alignmentA = "-" + alignmentA;
      alignmentB = b[j - 1] + alignmentB;
      j -= 1;
    } else {
      break;
    }
  }

  const { similarity, identity } = buildMetrics(alignmentA, alignmentB);

  return {
    score: maxScore,
    alignmentA,
    alignmentB,
    dpTable,
    traceTable,
    steps,
    similarity,
    identity,
  };
}

module.exports = { alignLocal };
