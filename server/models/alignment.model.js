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
    // Not `required`: Mongoose treats "" as missing, but a local alignment with
    // no positive-scoring region (e.g. "AAA" vs "TTT") legitimately yields "".
    alignmentA: { type: String, default: "" },
    alignmentB: { type: String, default: "" },
    similarity: { type: Number, required: true },
    identity: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Alignment", alignmentSchema);
