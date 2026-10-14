/**
 * Helpers shared by the alignment algorithms.
 */

/**
 * Normalise raw user input into an uppercase sequence with no surrounding whitespace.
 * Non-string values (undefined, null, numbers) are coerced so callers never crash.
 */
function sanitizeSeq(seq) {
  return String(seq || "").toUpperCase().trim();
}

/**
 * Compute summary statistics for a finished alignment.
 *
 * - similarity: matching columns / total alignment length (gaps count against it)
 * - identity:   matching columns / columns where neither side is a gap
 *
 * Both values are percentages in the range 0–100.
 */
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
    if (a !== "-" && b !== "-") {
      nonGapComparisons += 1;
      if (a === b) {
        matches += 1;
      }
    }
  }

  const similarity = (matches / length) * 100;
  const identity = nonGapComparisons === 0 ? 0 : (matches / nonGapComparisons) * 100;
  return { similarity, identity };
}

module.exports = { sanitizeSeq, buildMetrics };
