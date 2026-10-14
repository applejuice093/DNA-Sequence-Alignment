const { sanitizeSeq } = require("../algorithms/shared");

// Same alphabet the client accepts: DNA (A, C, G, T) plus RNA uracil (U).
const VALID_SEQUENCE = /^[ACGTU]+$/;

// The UI caps input at 20 characters. The API allows a little more for scripted
// use, but the response contains the full DP table plus one step per cell, so
// the payload grows with n * m and needs an upper bound.
const MAX_SEQUENCE_LENGTH = 100;

/**
 * Clean and validate the two sequences from a request body.
 * @returns {{ seqA: string, seqB: string, error: string | null }}
 */
function readSequences(body) {
  const seqA = sanitizeSeq(body.seqA);
  const seqB = sanitizeSeq(body.seqB);

  if (!seqA || !seqB) {
    return { seqA, seqB, error: "seqA and seqB are required." };
  }
  if (!VALID_SEQUENCE.test(seqA) || !VALID_SEQUENCE.test(seqB)) {
    return { seqA, seqB, error: "Sequences may only contain the characters A, C, G, T and U." };
  }
  if (seqA.length > MAX_SEQUENCE_LENGTH || seqB.length > MAX_SEQUENCE_LENGTH) {
    return { seqA, seqB, error: `Sequences must be at most ${MAX_SEQUENCE_LENGTH} characters long.` };
  }
  return { seqA, seqB, error: null };
}

module.exports = { readSequences, VALID_SEQUENCE, MAX_SEQUENCE_LENGTH };
