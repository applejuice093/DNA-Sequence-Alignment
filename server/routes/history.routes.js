const express = require("express");
const mongoose = require("mongoose");
const Alignment = require("../models/alignment.model");

const router = express.Router();

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

// Without a live connection Mongoose buffers queries for 10 s before failing;
// answer straight away so the History tab can say the database is offline.
function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "History is unavailable: the database is not connected." });
  }
  return next();
}

router.get("/history", requireDatabase, async (req, res) => {
  try {
    let limit = DEFAULT_HISTORY_LIMIT;
    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_HISTORY_LIMIT) {
        return res.status(400).json({ message: `limit must be an integer from 1 to ${MAX_HISTORY_LIMIT}.` });
      }
    }
    const history = await Alignment.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json(history);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not fetch history." });
  }
});

router.delete("/history/:id", (req, res, next) => {
  // Validate the id before checking the database so bad input is always a 400.
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid history id." });
  }
  return next();
}, requireDatabase, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Alignment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Record not found." });
    }

    return res.json({ message: "Record deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not delete record." });
  }
});

module.exports = router;
