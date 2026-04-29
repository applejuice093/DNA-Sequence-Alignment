const express = require("express");
const mongoose = require("mongoose");
const Alignment = require("../models/alignment.model");

const router = express.Router();

router.get("/history", async (_req, res) => {
  try {
    const history = await Alignment.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Could not fetch history." });
  }
});

router.delete("/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid history id." });
    }

    const deleted = await Alignment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Record not found." });
    }

    return res.json({ message: "Record deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Could not delete record." });
  }
});

module.exports = router;
