import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAlignment } from "../context/AlignmentContext";

function buildAlignmentRows(alignmentA, alignmentB) {
  const top = [];
  const middle = [];
  const bottom = [];

  let matches = 0;
  let mismatches = 0;
  let gaps = 0;

  const length = Math.max(alignmentA.length, alignmentB.length);
  for (let i = 0; i < length; i += 1) {
    const a = alignmentA[i] || "-";
    const b = alignmentB[i] || "-";
    const isGap = a === "-" || b === "-";
    const isMatch = !isGap && a === b;

    if (isGap) gaps += 1;
    else if (isMatch) matches += 1;
    else mismatches += 1;

    const color = isGap ? "#555" : isMatch ? "#00ff9d" : "#ff4d4d";
    top.push({ char: a, color });
    middle.push({ char: isGap ? " " : isMatch ? "|" : "X", color });
    bottom.push({ char: b, color });
  }

  return { top, middle, bottom, matches, mismatches, gaps };
}

function MetricCard({ label, value, suffix = "" }) {
  return (
    <motion.article
      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,157,0.22)" }}
      className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4"
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#00ff9d]">
        {value}
        {suffix}
      </p>
    </motion.article>
  );
}

function CharLine({ chars }) {
  return (
    <div className="whitespace-nowrap">
      {chars.map((item, index) => (
        <span key={`${item.char}-${index}`} style={{ color: item.color }} className="inline-block min-w-[0.65rem]">
          {item.char}
        </span>
      ))}
    </div>
  );
}

export default function AlignmentResult() {
  const { result, algorithm, seqA, seqB } = useAlignment();
  const hasResult = result && typeof result.score === "number" && result.alignmentA && result.alignmentB;

  if (!hasResult) {
    return <Navigate to="/" replace />;
  }

  const similarity = Number(result.similarity || 0).toFixed(2);
  const identity = Number(result.identity || 0).toFixed(2);
  const { top, middle, bottom, matches, mismatches, gaps } = buildAlignmentRows(
    result.alignmentA,
    result.alignmentB
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Alignment Score" value={result.score} />
        <MetricCard label="Similarity" value={similarity} suffix="%" />
        <MetricCard label="Identity" value={identity} suffix="%" />
      </div>

      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Aligned Sequences</h2>
        <div className="overflow-x-auto rounded-md border border-[#2b2f45] bg-[#0f1117] p-3 font-mono text-lg leading-7">
          <CharLine chars={top} />
          <CharLine chars={middle} />
          <CharLine chars={bottom} />
        </div>
      </section>

      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#2b2f45] text-left text-slate-400">
                <th className="px-2 py-2">Algorithm used</th>
                <th className="px-2 py-2">Sequence lengths</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Gaps count</th>
                <th className="px-2 py-2">Matches</th>
                <th className="px-2 py-2">Mismatches</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-100">
                <td className="px-2 py-3">{algorithm === "global" ? "Global (Needleman–Wunsch)" : "Local (Smith–Waterman)"}</td>
                <td className="px-2 py-3">
                  {seqA.length} / {seqB.length}
                </td>
                <td className="px-2 py-3">{result.score}</td>
                <td className="px-2 py-3">{gaps}</td>
                <td className="px-2 py-3">{matches}</td>
                <td className="px-2 py-3">{mismatches}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="pt-1">
        <Link
          to="/dp-matrix"
          className="inline-flex items-center rounded-md border border-[#00ff9d] bg-[#00ff9d]/10 px-4 py-2 font-medium text-[#00ff9d] transition hover:bg-[#00ff9d]/20"
        >
          Proceed to DP Matrix →
        </Link>
      </div>
    </motion.section>
  );
}
