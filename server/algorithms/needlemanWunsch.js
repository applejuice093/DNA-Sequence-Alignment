const { sanitizeSeq, buildMetrics } = require("./shared");

/**
 * Needleman–Wunsch global alignment.
 *
 * dpTable[i][j] holds the best score for aligning the first i characters of A
 * with the first j characters of B. Each cell is filled from three neighbours:
 *
 *   diag = dpTable[i-1][j-1] + (A[i-1] === B[j-1] ? match : mismatch)
 *   up   = dpTable[i-1][j]   + gap   (A[i-1] aligned against a gap in B)
 *   left = dpTable[i][j-1]   + gap   (B[j-1] aligned against a gap in A)
 *
 * The answer is dpTable[n][m]. Ties are broken in the order diag > up > left,
 * so when several optimal alignments exist, traceback (which walks from the
 * end) prefers match/mismatch columns and pushes gaps toward the start.
 *
 * Time and space are both O(n * m).
 *
 * @param {string} seqA
 * @param {string} seqB
 * @param {number} match    score added for identical characters (usually > 0)
 * @param {number} mismatch score added for different characters (usually < 0)
 * @param {number} gap      linear gap penalty per gap character (usually < 0)
 * @returns {{score:number, alignmentA:string, alignmentB:string, dpTable:number[][],
 *   traceTable:(string|null)[][], steps:object[], similarity:number, identity:number}}
 *   `steps` lists every filled cell in row-major order for the client animation.
 */
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

      // Strict ">" comparisons keep the earlier direction on ties (diag > up > left).
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
  // Row 0 and column 0 always point "left"/"up", so the loop is guaranteed to reach (0, 0).
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
