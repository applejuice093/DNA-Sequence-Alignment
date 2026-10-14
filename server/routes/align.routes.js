const express = require("express");
const Alignment = require("../models/alignment.model");
const { alignGlobal } = require("../algorithms/needlemanWunsch");
const { alignLocal } = require("../algorithms/smithWaterman");
const { bruteForceDemo } = require("../algorithms/bruteForce");
const { readSequences, readScoring } = require("./validation");

const router = express.Router();

router.post("/align", async (req, res) => {
  try {
    const body = req.body || {};
    const { seqA, seqB, error } = readSequences(body);
    const { algorithm } = body;
    const { scoring, error: scoringError } = readScoring(body);
    const { match, mismatch, gap } = scoring;

    if (error || scoringError) {
      return res.status(400).json({ message: error || scoringError });
    }

    if (!["global", "local"].includes(algorithm)) {
      return res.status(400).json({ message: "algorithm must be 'global' or 'local'." });
    }

    const result =
      algorithm === "global"
        ? alignGlobal(seqA, seqB, match, mismatch, gap)
        : alignLocal(seqA, seqB, match, mismatch, gap);

    await Alignment.create({
      seqA,
      seqB,
      algorithm,
      match,
      mismatch,
      gap,
      score: result.score,
      alignmentA: result.alignmentA,
      alignmentB: result.alignmentB,
      similarity: result.similarity,
      identity: result.identity,
    });

    return res.json({
      seqA,
      seqB,
      algorithm,
      match,
      mismatch,
      gap,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Alignment failed." });
  }
});

router.post("/bruteforce-demo", (req, res) => {
  try {
    const body = req.body || {};
    const { seqA, seqB, error } = readSequences(body);
    const { scoring, error: scoringError } = readScoring(body);
    const { match, mismatch, gap } = scoring;

    if (error || scoringError) {
      return res.status(400).json({ message: error || scoringError });
    }

    const result = bruteForceDemo(seqA, seqB, match, mismatch, gap);
    return res.json({ seqA, seqB, match, mismatch, gap, ...result });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Brute force demo failed." });
  }
});

module.exports = router;
