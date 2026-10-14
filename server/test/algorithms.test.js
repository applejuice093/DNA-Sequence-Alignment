const test = require("node:test");
const assert = require("node:assert/strict");

const { alignGlobal } = require("../algorithms/needlemanWunsch");
const { alignLocal } = require("../algorithms/smithWaterman");
const { bruteForceDemo, MAX_BRUTE_FORCE_LENGTH } = require("../algorithms/bruteForce");
const { sanitizeSeq, buildMetrics } = require("../algorithms/shared");

const SCHEME = [1, -1, -2]; // match, mismatch, gap (the UI defaults)

/** Re-score an alignment column by column with a linear gap penalty. */
function scoreAlignment(alignmentA, alignmentB, match, mismatch, gap) {
  let score = 0;
  for (let k = 0; k < alignmentA.length; k += 1) {
    const a = alignmentA[k];
    const b = alignmentB[k];
    if (a === "-" || b === "-") score += gap;
    else score += a === b ? match : mismatch;
  }
  return score;
}

test("sanitizeSeq uppercases, trims and tolerates non-strings", () => {
  assert.equal(sanitizeSeq("  acgt \n"), "ACGT");
  assert.equal(sanitizeSeq(undefined), "");
  assert.equal(sanitizeSeq(null), "");
});

test("buildMetrics counts gaps against similarity but not identity", () => {
  const { similarity, identity } = buildMetrics("AC-T", "ACGA");
  assert.equal(similarity, 50); // 2 matches / 4 columns
  assert.equal(identity, (2 / 3) * 100); // 2 matches / 3 gap-free columns
  assert.deepEqual(buildMetrics("", ""), { similarity: 0, identity: 0 });
});

test("alignGlobal aligns identical sequences without gaps", () => {
  const result = alignGlobal("GATTACA", "GATTACA", ...SCHEME);
  assert.equal(result.score, 7);
  assert.equal(result.alignmentA, "GATTACA");
  assert.equal(result.alignmentB, "GATTACA");
  assert.equal(result.similarity, 100);
});

test("alignGlobal initialises the first row and column with gap penalties", () => {
  const { dpTable, traceTable } = alignGlobal("AC", "ACG", ...SCHEME);
  assert.deepEqual(dpTable[0], [0, -2, -4, -6]);
  assert.deepEqual(dpTable.map((row) => row[0]), [0, -2, -4]);
  assert.equal(traceTable[0][2], "left");
  assert.equal(traceTable[2][0], "up");
});

test("alignGlobal returns an alignment whose columns add up to the score", () => {
  const cases = [
    ["AGTACG", "ACATCG"],
    ["GATTACA", "GCATGCU"],
    ["ACGT", "A"],
    ["A", "TTTT"],
  ];
  for (const [a, b] of cases) {
    const result = alignGlobal(a, b, ...SCHEME);
    assert.equal(result.alignmentA.length, result.alignmentB.length);
    assert.equal(result.alignmentA.replace(/-/g, ""), a);
    assert.equal(result.alignmentB.replace(/-/g, ""), b);
    assert.equal(scoreAlignment(result.alignmentA, result.alignmentB, ...SCHEME), result.score);
    assert.equal(result.score, result.dpTable[a.length][b.length]);
  }
});

test("alignGlobal records one step per inner cell", () => {
  const { steps } = alignGlobal("ACG", "AG", ...SCHEME);
  assert.equal(steps.length, 3 * 2);
  assert.deepEqual(
    steps.map(({ i, j }) => [i, j]),
    [[1, 1], [1, 2], [2, 1], [2, 2], [3, 1], [3, 2]]
  );
});

test("alignLocal finds the best shared substring", () => {
  const result = alignLocal("TTTACGTTT", "GGACGGG", ...SCHEME);
  assert.equal(result.score, 3);
  assert.equal(result.alignmentA, "ACG");
  assert.equal(result.alignmentB, "ACG");
});

test("alignLocal never stores negative scores", () => {
  const { dpTable } = alignLocal("GATTACA", "GCATGCU", ...SCHEME);
  for (const row of dpTable) {
    for (const value of row) assert.ok(value >= 0);
  }
});

test("alignLocal returns an empty alignment when nothing matches", () => {
  const result = alignLocal("AAA", "TTT", ...SCHEME);
  assert.equal(result.score, 0);
  assert.equal(result.alignmentA, "");
  assert.equal(result.alignmentB, "");
  assert.ok(result.steps.every((step) => step.chosen === "stop"));
});

test("bruteForceDemo matches the Needleman-Wunsch score", () => {
  const cases = [
    ["AGT", "ACT"],
    ["GATT", "GAT"],
    ["AC", "TTGA"],
    ["AGTACG", "ACATCG"],
  ];
  for (const [a, b] of cases) {
    const brute = bruteForceDemo(a, b, ...SCHEME);
    assert.equal(brute.score, alignGlobal(a, b, ...SCHEME).score, `${a} vs ${b}`);
  }
});

test("bruteForceDemo counts repeated subproblems", () => {
  const { callCount, recomputations, recursionTree } = bruteForceDemo("AG", "AC", ...SCHEME);
  // (n+1)*(m+1) distinct subproblems; every extra call is a recomputation.
  assert.equal(callCount - recomputations, 9);
  assert.ok(recomputations > 0);
  assert.equal(recursionTree.i, 0);
  assert.equal(recursionTree.j, 0);
  assert.equal(recursionTree.isDuplicate, false);
});

test("bruteForceDemo rejects sequences above the demo limit", () => {
  const tooLong = "A".repeat(MAX_BRUTE_FORCE_LENGTH + 1);
  assert.throws(() => bruteForceDemo(tooLong, "A", ...SCHEME), /up to length/);
});
