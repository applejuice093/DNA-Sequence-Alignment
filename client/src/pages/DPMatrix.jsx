import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAlignment } from "../context/AlignmentContext";
import DPCell from "../components/DPCell";

const CONCEPTS = {
  overlap: {
    label: "📦 Overlapping Subproblems",
    body: "In sequence alignment, many paths need the same sub-alignments like dp[i-1][j] or dp[i][j-1]. Dynamic Programming stores each subproblem in the table and reuses it, instead of solving it again.",
  },
  optimal: {
    label: "🔁 Optimal Substructure",
    body: "The best alignment ending at cell (i, j) is built from the best of three smaller optimal alignments: diagonal, up, or left. This lets local best decisions compose into the global/local optimum.",
  },
  memo: {
    label: "💾 Memoization (each cell computed once)",
    body: "Each table cell is computed a single time and then treated as cached memory. Later cells read those values directly, eliminating brute-force style recalculation.",
  },
};

function getTracebackPath(dpTable, traceTable, isLocal) {
  if (!dpTable?.length || !traceTable?.length) return new Set();

  let i = dpTable.length - 1;
  let j = dpTable[0].length - 1;

  if (isLocal) {
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

  const path = new Set();
  while (i >= 0 && j >= 0) {
    path.add(`${i}-${j}`);
    const dir = traceTable[i]?.[j];
    if (!dir) break;
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

    if (isLocal && (i < 0 || j < 0 || (dpTable[i] && dpTable[i][j] === 0))) {
      if (i >= 0 && j >= 0) path.add(`${i}-${j}`);
      break;
    }
  }
  return path;
}

export default function DPMatrix() {
  const { result, seqA, seqB, algorithm } = useAlignment();
  const steps = result.steps || [];
  const dpTable = result.dpTable || [];
  const traceTable = result.traceTable || [];
  const rows = dpTable.length || seqA.length + 1;
  const cols = dpTable[0]?.length || seqB.length + 1;

  const [isPlaying, setIsPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [speedMs, setSpeedMs] = useState(360);
  const [activeCell, setActiveCell] = useState(null);
  const [filledCells, setFilledCells] = useState(new Set());
  const [conceptOpen, setConceptOpen] = useState(null);

  const baseFilled = useMemo(() => {
    const init = new Set();
    for (let i = 0; i < rows; i += 1) init.add(`${i}-0`);
    for (let j = 0; j < cols; j += 1) init.add(`0-${j}`);
    return init;
  }, [rows, cols]);

  const tracebackPath = useMemo(
    () => getTracebackPath(dpTable, traceTable, algorithm === "local"),
    [dpTable, traceTable, algorithm]
  );

  const allValues = useMemo(() => dpTable.flat().filter((v) => typeof v === "number"), [dpTable]);
  const minValue = allValues.length ? Math.min(...allValues) : 0;
  const maxValue = allValues.length ? Math.max(...allValues) : 0;

  useEffect(() => {
    setIsPlaying(false);
    setAnimStep(0);
    setActiveCell(null);
    setFilledCells(new Set(baseFilled));
  }, [steps.length, seqA, seqB, baseFilled]);

  useEffect(() => {
    if (!isPlaying || !steps.length) return undefined;
    const timer = setInterval(() => {
      setAnimStep((prev) => {
        if (prev >= steps.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMs, steps.length]);

  useEffect(() => {
    if (!steps.length || animStep === 0) {
      setActiveCell(null);
      return;
    }

    const step = steps[Math.min(animStep - 1, steps.length - 1)];
    setActiveCell(step);
    const key = `${step.i}-${step.j}`;
    const fillDelay = Math.max(50, Math.floor(speedMs * 0.5));
    const timeout = setTimeout(() => {
      setFilledCells((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    }, fillDelay);

    return () => clearTimeout(timeout);
  }, [animStep, steps, speedMs]);

  const handleStep = () => {
    if (!steps.length) return;
    setIsPlaying(false);
    setAnimStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimStep(0);
    setActiveCell(null);
    setFilledCells(new Set(baseFilled));
  };

  if (!dpTable.length || !steps.length) {
    return (
      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-5">
        <h2 className="text-lg font-semibold text-[#00ff9d]">DP Matrix Visualizer</h2>
        <p className="mt-2 text-sm text-slate-300">Run an alignment first to generate the DP table and step-by-step transitions.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-[#00ff9d]">Dynamic Programming Concepts</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CONCEPTS).map(([key, concept]) => (
            <button
              key={key}
              onClick={() => setConceptOpen(key)}
              className="rounded-full border border-[#3b4366] bg-[#151a2b] px-3 py-1 text-sm text-slate-100 transition hover:border-[#00ff9d] hover:text-[#00ff9d]"
            >
              {concept.label}
            </button>
          ))}
        </div>
      </section>

      {conceptOpen ? (
        <motion.section
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#2b2f45] bg-[#0f1117] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#00ff9d]">{CONCEPTS[conceptOpen].label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{CONCEPTS[conceptOpen].body}</p>
            </div>
            <button onClick={() => setConceptOpen(null)} className="text-sm text-slate-400 hover:text-white">
              Close
            </button>
          </div>
        </motion.section>
      ) : null}

      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsPlaying(true)} className="rounded-md border border-[#00ff9d] bg-[#00ff9d]/10 px-3 py-2 text-sm text-[#00ff9d]">
            ▶ Play
          </button>
          <button onClick={() => setIsPlaying(false)} className="rounded-md border border-[#3b4366] bg-[#151a2b] px-3 py-2 text-sm text-slate-200">
            ⏸ Pause
          </button>
          <button onClick={handleStep} className="rounded-md border border-[#3b4366] bg-[#151a2b] px-3 py-2 text-sm text-slate-200">
            ⏭ Step
          </button>
          <button onClick={handleReset} className="rounded-md border border-[#3b4366] bg-[#151a2b] px-3 py-2 text-sm text-slate-200">
            ⏪ Reset
          </button>
          <div className="ml-0 flex items-center gap-2 sm:ml-3">
            <span className="text-xs text-slate-400">Slow</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(((800 - speedMs) / 720) * 100)}
              onChange={(e) => {
                const ratio = Number(e.target.value) / 100;
                const mapped = Math.round(800 - ratio * (800 - 80));
                setSpeedMs(mapped);
              }}
              className="w-40 accent-[#00ff9d]"
            />
            <span className="text-xs text-slate-400">Fast</span>
          </div>
          <p className="ml-auto text-sm font-mono text-[#00ff9d]">
            Step {Math.min(animStep, steps.length)} / {steps.length}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">DP Matrix Grid</h2>
          <div className="overflow-auto">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(3.5rem, 3.5rem))` }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#2b2f45] bg-[#131827] text-sm text-slate-400">
                ∅
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#2b2f45] bg-[#131827] font-mono text-slate-300">
                -
              </div>
              {seqB.split("").map((char, idx) => (
                <div
                  key={`col-${idx}`}
                  className="flex h-14 w-14 items-center justify-center rounded-md border border-[#2b2f45] bg-[#131827] font-mono text-slate-100"
                >
                  {char}
                </div>
              ))}

              {Array.from({ length: rows }).map((_, i) => (
                <FragmentRow
                  key={`row-${i}`}
                  i={i}
                  cols={cols}
                  seqA={seqA}
                  dpTable={dpTable}
                  traceTable={traceTable}
                  filledCells={filledCells}
                  activeCell={activeCell}
                  tracebackPath={tracebackPath}
                  steps={steps}
                  minValue={minValue}
                  maxValue={maxValue}
                />
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Recurrence Relation</h2>
          <div className="rounded-md border border-[#2b2f45] bg-[#0f1117] p-3 font-mono text-xs leading-6 text-slate-200">
            <p>dp[i][j] = max(</p>
            <p className={activeCell?.chosen === "diag" ? "text-[#00ff9d]" : ""}>
              dp[i-1][j-1] + (match/mismatch)   {"<-"} diagonal
            </p>
            <p className={activeCell?.chosen === "up" ? "text-[#00ff9d]" : ""}>
              dp[i-1][j] + gap                  {"<-"} from above
            </p>
            <p className={activeCell?.chosen === "left" ? "text-[#00ff9d]" : ""}>
              dp[i][j-1] + gap                  {"<-"} from left
            </p>
            <p>)</p>
          </div>

          {activeCell ? (
            <div className="mt-3 rounded-md border border-[#2b2f45] bg-[#0f1117] p-3 text-sm text-slate-200">
              <p className="font-mono text-[#00ff9d]">
                Active Cell: ({activeCell.i}, {activeCell.j})
              </p>
              <p className="mt-1 font-mono">diag={activeCell.diag} up={activeCell.up} left={activeCell.left}</p>
              <p className="mt-1">
                Chosen branch: <span className="font-semibold text-[#00ff9d]">{activeCell.chosen}</span>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Press Play or Step to watch each recurrence decision in sequence.</p>
          )}
        </section>
      </section>
    </div>
  );
}

function FragmentRow({
  i,
  cols,
  seqA,
  dpTable,
  traceTable,
  filledCells,
  activeCell,
  tracebackPath,
  steps,
  minValue,
  maxValue,
}) {
  const rowLabel = i === 0 ? "-" : seqA[i - 1];

  return (
    <>
      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#2b2f45] bg-[#131827] font-mono text-slate-100">
        {rowLabel}
      </div>
      {Array.from({ length: cols }).map((_, j) => {
        const key = `${i}-${j}`;
        const isActive = activeCell && activeCell.i === i && activeCell.j === j;
        const isFilled = filledCells.has(key);
        const inTraceback = tracebackPath.has(key);
        const state = inTraceback ? "traceback" : isActive ? "active" : isFilled ? "filled" : "unvisited";
        const step = steps.find((s) => s.i === i && s.j === j);
        const tooltip =
          step && isFilled
            ? `Cell (${i},${j}): max(diag=${step.diag}, up=${step.up}, left=${step.left}) = ${dpTable[i][j]}\nDP reuses already-computed neighbors - no recalculation needed.`
            : "";
        return (
          <DPCell
            key={key}
            value={isFilled || isActive || inTraceback ? dpTable[i]?.[j] : ""}
            arrow={isFilled || isActive || inTraceback ? traceTable[i]?.[j] : ""}
            state={state}
            tooltip={tooltip}
            minValue={minValue}
            maxValue={maxValue}
          />
        );
      })}
    </>
  );
}
