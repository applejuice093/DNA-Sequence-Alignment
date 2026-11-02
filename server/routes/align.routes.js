const express = require("express");
const mongoose = require("mongoose");
const Alignment = require("../models/alignment.model");
const { alignGlobal } = require("../algorithms/needlemanWunsch");
const { alignLocal } = require("../algorithms/smithWaterman");
const { bruteForceDemo } = require("../algorithms/bruteForce");
const { readSequences, readScoring } = require("./validation");

const router = express.Router();

/**
 * Store a finished alignment in the history collection.
 *
 * History is a convenience, so a database outage must not cost the user their
 * result: when MongoDB is not connected we skip the write immediately (instead
 * of letting Mongoose buffer it for 10 s), and a failed write is logged.
 * @returns {Promise<boolean>} whether the record was saved
 */
async function saveToHistory(record) {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }
  try {
    await Alignment.create(record);
    return true;
  } catch (error) {
    console.error("Could not save alignment to history:", error.message);
    return false;
  }
}

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

    const saved = await saveToHistory({
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
      saved,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Alignment failed." });
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
