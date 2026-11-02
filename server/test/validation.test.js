// Unit tests for request-body validation helpers.
const test = require("node:test");
const assert = require("node:assert/strict");

const { readSequences, readScoring, DEFAULT_SCORING } = require("../routes/validation");

test("readScoring falls back to defaults for missing values", () => {
  assert.deepEqual(readScoring({}), { scoring: DEFAULT_SCORING, error: null });
  assert.deepEqual(readScoring({ match: "", gap: null }).scoring, DEFAULT_SCORING);
});

test("readScoring accepts numeric strings", () => {
  assert.deepEqual(readScoring({ match: "2", mismatch: "-3", gap: "-1" }), {
    scoring: { match: 2, mismatch: -3, gap: -1 },
    error: null,
  });
});

test("readScoring rejects out-of-range values", () => {
  assert.match(readScoring({ match: 1e300 }).error, /match must be between/);
  assert.match(readScoring({ mismatch: -101 }).error, /mismatch must be between/);
});

test("readScoring rejects a positive gap penalty", () => {
  assert.match(readScoring({ gap: 1 }).error, /gap must be zero or negative/);
  assert.equal(readScoring({ gap: 0 }).error, null);
});

test("readSequences accepts mixed case and surrounding whitespace", () => {
  assert.deepEqual(readSequences({ seqA: " gatTaca ", seqB: "acgu" }), {
    seqA: "GATTACA",
    seqB: "ACGU",
    error: null,
  });
});
