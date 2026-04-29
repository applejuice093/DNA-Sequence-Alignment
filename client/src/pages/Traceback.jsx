import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAlignment } from "../context/AlignmentContext";

function buildPath(dpTable, traceTable, algorithm) {
  if (!dpTable?.length || !traceTable?.length) return [];
  let i = dpTable.length - 1;
  let j = dpTable[0].length - 1;
  if (algorithm === "local") {
    let maxVal = Number.NEGATIVE_INFINITY;
    for (let r = 0; r < dpTable.length; r += 1) {
      for (let c = 0; c < dpTable[r].length; c += 1) {
        if (dpTable[r][c] > maxVal) {
          maxVal = dpTable[r][c];
          i = r;
          j = c;
        }
      }
    }
  }

  const out = [];
  while (i >= 0 && j >= 0) {
    const dir = traceTable[i]?.[j];
    out.push({ i, j, dir });
    if (!dir) break;
    if (algorithm === "local" && dpTable[i][j] === 0) break;
    if (dir === "diag") {
      i -= 1;
      j -= 1;
    } else if (dir === "up") {
      i -= 1;
    } else if (dir === "left") {
      j -= 1;
    } else {
      break;
    }
  }
  return out;
}

export default function Traceback() {
  const { result, seqA, seqB, algorithm } = useAlignment();
  const [playing, setPlaying] = useState(false);
  const [traceIndex, setTraceIndex] = useState(0);
  const [speed, setSpeed] = useState(320);

  const path = useMemo(
    () => buildPath(result.dpTable, result.traceTable, algorithm),
    [result.dpTable, result.traceTable, algorithm]
  );

  useEffect(() => {
    setPlaying(false);
    setTraceIndex(0);
  }, [path.length, seqA, seqB]);

  useEffect(() => {
    if (!playing || !path.length) return undefined;
    const timer = setInterval(() => {
      setTraceIndex((prev) => {
        if (prev >= path.length) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [playing, speed, path.length]);

  if (!result.dpTable?.length || !result.traceTable?.length) {
    return (
      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <p className="text-slate-300">Run alignment first to animate traceback.</p>
      </section>
    );
  }

  const activePath = path.slice(0, traceIndex);
  const activeSet = new Set(activePath.map((p) => `${p.i}-${p.j}`));

  let builtA = "";
  let builtB = "";
  const logLines = [];
  activePath.forEach((step) => {
    const { i, j, dir } = step;
    if (dir === "diag") {
      const a = seqA[i - 1] || "-";
      const b = seqB[j - 1] || "-";
      builtA += a;
      builtB += b;
      logLines.push(`↖ ${a === b ? "Match" : "Mismatch"}: ${a} ↔ ${b} → seqA: ${builtA}, seqB: ${builtB}`);
    } else if (dir === "up") {
      const a = seqA[i - 1] || "-";
      builtA += a;
      builtB += "-";
      logLines.push(`↑ Gap: ${a} ↔ _ → seqA: ${builtA}, seqB: ${builtB}`);
    } else if (dir === "left") {
      const b = seqB[j - 1] || "-";
      builtA += "-";
      builtB += b;
      logLines.push(`← Gap: _ ↔ ${b} → seqA: ${builtA}, seqB: ${builtB}`);
    }
  });

  const finalA = builtA.split("").reverse().join("");
  const finalB = builtB.split("").reverse().join("");

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setPlaying(true)} className="rounded-md border border-[#00ff9d] bg-[#00ff9d]/10 px-3 py-2 text-sm text-[#00ff9d]">▶ Play</button>
          <button onClick={() => setPlaying(false)} className="rounded-md border border-[#3b4366] bg-[#151a2b] px-3 py-2 text-sm text-slate-200">⏸ Pause</button>
          <button onClick={() => { setPlaying(false); setTraceIndex(0); }} className="rounded-md border border-[#3b4366] bg-[#151a2b] px-3 py-2 text-sm text-slate-200">⏪ Reset</button>
          <span className="ml-2 text-xs text-slate-400">Slow</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(((800 - speed) / 720) * 100)}
            onChange={(e) => setSpeed(Math.round(800 - (Number(e.target.value) / 100) * 720))}
            className="w-36 accent-[#00ff9d]"
          />
          <span className="text-xs text-slate-400">Fast</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Traceback Matrix</h2>
          <div className="overflow-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${seqB.length + 2}, minmax(3rem, 3rem))` }}>
              <div className="flex h-12 w-12 items-center justify-center rounded border border-[#2b2f45] bg-[#121827] text-xs text-slate-400">∅</div>
              <div className="flex h-12 w-12 items-center justify-center rounded border border-[#2b2f45] bg-[#121827] text-xs text-slate-200">-</div>
              {seqB.split("").map((c, idx) => <div key={`h-${idx}`} className="flex h-12 w-12 items-center justify-center rounded border border-[#2b2f45] bg-[#121827] font-mono text-slate-100">{c}</div>)}
              {result.dpTable.map((row, i) => (
                <div key={`row-${i}`} className="contents">
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-[#2b2f45] bg-[#121827] font-mono text-slate-100">{i === 0 ? "-" : seqA[i - 1]}</div>
                  {row.map((cell, j) => {
                    const key = `${i}-${j}`;
                    const inPath = activeSet.has(key);
                    const dir = result.traceTable[i]?.[j];
                    const arrow = dir === "diag" ? "↖" : dir === "up" ? "↑" : dir === "left" ? "←" : "";
                    return (
                      <motion.div
                        key={key}
                        animate={inPath ? { scale: [1, 1.06, 1], boxShadow: "0 0 14px rgba(245,158,11,0.45)" } : { scale: 1, boxShadow: "0 0 0px rgba(0,0,0,0)" }}
                        transition={inPath ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
                        className={`flex h-12 w-12 flex-col items-center justify-center rounded border font-mono text-xs ${
                          inPath ? "border-amber-400 bg-amber-300/20 text-amber-200" : "border-[#2b2f45] bg-[#131827] text-slate-200"
                        }`}
                      >
                        <span>{cell}</span>
                        <span className={inPath ? "text-amber-200" : "text-slate-500"}>{arrow}</span>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Alignment Build Log</h2>
          <div className="max-h-[320px] overflow-auto rounded border border-[#2b2f45] bg-[#0f1117] p-2 text-xs text-slate-200">
            {logLines.length ? (
              <ul className="space-y-1">
                {logLines.map((line, idx) => (
                  <motion.li key={`${line}-${idx}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    {line}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">Press Play to follow traceback decisions.</p>
            )}
          </div>

          <div className="mt-3 rounded border border-[#2b2f45] bg-[#0f1117] p-3">
            <p className="text-xs text-slate-400">Final aligned strings</p>
            <p className="seq-mono mt-1 text-[#00ff9d]">
              {finalA.split("").map((c, idx) => (
                <motion.span key={`a-${idx}-${c}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                  {c}
                </motion.span>
              ))}
            </p>
            <p className="seq-mono mt-1 text-[#00ff9d]">
              {finalB.split("").map((c, idx) => (
                <motion.span key={`b-${idx}-${c}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                  {c}
                </motion.span>
              ))}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
