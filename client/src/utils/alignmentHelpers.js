export function buildMatchLine(alignmentA = "", alignmentB = "") {
  const len = Math.max(alignmentA.length, alignmentB.length);
  let line = "";
  for (let i = 0; i < len; i += 1) {
    const a = alignmentA[i] || " ";
    const b = alignmentB[i] || " ";
    if (a === "-" || b === "-") line += " ";
    else if (a === b) line += "|";
    else line += "X";
  }
  return line;
}

export function getHeatmapColor(value, min, max) {
  if (typeof value !== "number") return "#131827";
  if (min === max) return "#00ff9d66";
  const ratio = (value - min) / (max - min);
  if (ratio < 0.2) return "#1e3a8a99";
  if (ratio < 0.4) return "#1d4ed899";
  if (ratio < 0.6) return "#0891b299";
  if (ratio < 0.8) return "#05966999";
  return "#10b98199";
}

export function formatSimilarity(value) {
  const n = Number(value || 0);
  return `${n.toFixed(1)}%`;
}

export function relativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (!Number.isFinite(diffSec)) return "";
  if (diffSec < 60) return "just now";
  const units = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
  ];
  for (const unit of units) {
    const value = Math.floor(diffSec / unit.secs);
    if (value >= 1) {
      return `${value} ${unit.label}${value > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}
