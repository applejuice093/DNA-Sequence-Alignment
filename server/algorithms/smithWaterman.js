const { sanitizeSeq, buildMetrics } = require("./shared");

/**
 * Smith–Waterman local alignment.
 *
 * Same recurrence as Needleman–Wunsch, with two differences:
 *
 *   1. Every cell is clamped at 0: dpTable[i][j] = max(0, diag, up, left).
 *      A 0 means "start a fresh alignment here", so poorly matching prefixes
 *      are discarded instead of dragging the score down.
 *   2. Row 0 and column 0 stay 0 (no leading gap penalties), and the result is
 *      the single highest cell anywhere in the table, not the bottom-right one.
 *
 * Traceback starts at that highest cell and stops at the first 0, yielding the
 * best-scoring pair of substrings. If no cell is positive (e.g. "AAA" vs
 * "TTT"), the score is 0 and both aligned strings are empty.
 *
 * In traceTable a null entry marks a 0-cell; the matching entry in `steps`
 * uses "stop" so the client can show where local paths restart.
 *
 * @param {string} seqA
 * @param {string} seqB
 * @param {number} match
 * @param {number} mismatch
 * @param {number} gap
 * @returns same shape as alignGlobal()
 */
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

      // Strict ">" keeps the first maximum found in row-major order.
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
