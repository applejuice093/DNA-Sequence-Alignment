const mongoose = require("mongoose");

const alignmentSchema = new mongoose.Schema(
  {
    seqA: { type: String, required: true, trim: true, uppercase: true },
    seqB: { type: String, required: true, trim: true, uppercase: true },
    algorithm: { type: String, required: true, enum: ["global", "local"] },
    match: { type: Number, required: true },
    mismatch: { type: Number, required: true },
    gap: { type: Number, required: true },
    score: { type: Number, required: true },
    alignmentA: { type: String, required: true },
    alignmentB: { type: String, required: true },
    similarity: { type: Number, required: true },
    identity: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Alignment", alignmentSchema);
