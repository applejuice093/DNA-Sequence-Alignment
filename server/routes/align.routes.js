const express = require("express");
const Alignment = require("../models/alignment.model");
const { alignGlobal } = require("../algorithms/needlemanWunsch");
const { alignLocal } = require("../algorithms/smithWaterman");
const { bruteForceDemo } = require("../algorithms/bruteForce");

const router = express.Router();

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

router.post("/align", async (req, res) => {
  try {
    const seqA = String(req.body.seqA || "").toUpperCase().trim();
    const seqB = String(req.body.seqB || "").toUpperCase().trim();
    const algorithm = req.body.algorithm;
    const match = parseNumber(req.body.match, 1);
    const mismatch = parseNumber(req.body.mismatch, -1);
    const gap = parseNumber(req.body.gap, -2);

    if (!seqA || !seqB) {
      return res.status(400).json({ message: "seqA and seqB are required." });
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
    const seqA = String(req.body.seqA || "").toUpperCase().trim();
    const seqB = String(req.body.seqB || "").toUpperCase().trim();
    const match = parseNumber(req.body.match, 1);
    const mismatch = parseNumber(req.body.mismatch, -1);
    const gap = parseNumber(req.body.gap, -2);

    if (!seqA || !seqB) {
      return res.status(400).json({ message: "seqA and seqB are required." });
    }

    const result = bruteForceDemo(seqA, seqB, match, mismatch, gap);
    return res.json({ seqA, seqB, match, mismatch, gap, ...result });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Brute force demo failed." });
  }
});

module.exports = router;
