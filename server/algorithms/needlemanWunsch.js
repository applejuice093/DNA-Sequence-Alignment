const { sanitizeSeq, buildMetrics } = require("./shared");

function alignGlobal(seqA, seqB, match, mismatch, gap) {
  const a = sanitizeSeq(seqA);
  const b = sanitizeSeq(seqB);
  const rows = a.length + 1;
  const cols = b.length + 1;

  const dpTable = Array.from({ length: rows }, () => Array(cols).fill(0));
  const traceTable = Array.from({ length: rows }, () => Array(cols).fill(null));
  const steps = [];

  // Initialize first column: aligning prefix of A with empty B requires gap penalties.
  for (let i = 1; i < rows; i += 1) {
    dpTable[i][0] = dpTable[i - 1][0] + gap;
    traceTable[i][0] = "up";
  }

  // Initialize first row: aligning empty A with prefix of B requires gap penalties.
  for (let j = 1; j < cols; j += 1) {
    dpTable[0][j] = dpTable[0][j - 1] + gap;
    traceTable[0][j] = "left";
  }

  // Fill DP table: each cell chooses best of diag(match/mismatch), up(gap), left(gap).
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const isMatch = a[i - 1] === b[j - 1];
      const diag = dpTable[i - 1][j - 1] + (isMatch ? match : mismatch);
      const up = dpTable[i - 1][j] + gap;
      const left = dpTable[i][j - 1] + gap;

      let chosen = "diag";
      let best = diag;

      if (up > best) {
        best = up;
        chosen = "up";
      }
      if (left > best) {
        best = left;
        chosen = "left";
      }

      dpTable[i][j] = best;
      traceTable[i][j] = chosen;
      steps.push({ i, j, diag, up, left, chosen });
    }
  }

  // Trace back from bottom-right to top-left to reconstruct one optimal global alignment.
  let i = a.length;
  let j = b.length;
  let alignmentA = "";
  let alignmentB = "";

  while (i > 0 || j > 0) {
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
    } else {
      alignmentA = "-" + alignmentA;
      alignmentB = b[j - 1] + alignmentB;
      j -= 1;
    }
  }

  const { similarity, identity } = buildMetrics(alignmentA, alignmentB);

  return {
    score: dpTable[a.length][b.length],
    alignmentA,
    alignmentB,
    dpTable,
    traceTable,
    steps,
    similarity,
    identity,
  };
}

module.exports = { alignGlobal };
