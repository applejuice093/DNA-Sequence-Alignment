import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAlignment } from "../context/AlignmentContext";

const MAX_LEVELS = 4;
const VALID_SEQ = /^[ATGCU]*$/;

function buildGraph(root, maxLevels = 4) {
  if (!root) return { nodes: [], edges: [], levelCount: 0, duplicatesInGraph: 0 };
  const queue = [{ node: root, level: 0, parentId: null }];
  const levels = [];
  const nodes = [];
  const edges = [];
  let duplicatesInGraph = 0;

  while (queue.length) {
    const item = queue.shift();
    const { node, level, parentId } = item;
    if (!levels[level]) levels[level] = [];
    levels[level].push({ ...node, level, parentId });

    if (node.isDuplicate) duplicatesInGraph += 1;
    if (parentId !== null) edges.push({ from: parentId, to: node.id });

    if (level < maxLevels - 1) {
      node.children.forEach((child) => queue.push({ node: child, level: level + 1, parentId: node.id }));
    } else if (node.children?.length) {
      const ellipsisId = `ellipsis-${node.id}`;
      levels[level + 1] = levels[level + 1] || [];
      levels[level + 1].push({ id: ellipsisId, i: "...", j: "...", value: "...", isDuplicate: false, isEllipsis: true });
      edges.push({ from: node.id, to: ellipsisId });
    }
  }

  const width = 760;
  const levelGap = 120;
  levels.forEach((levelNodes, level) => {
    const count = levelNodes.length;
    levelNodes.forEach((node, index) => {
      const x = ((index + 1) * width) / (count + 1);
      const y = 70 + level * levelGap;
      nodes.push({ ...node, x, y, level });
    });
  });

  return { nodes, edges, levelCount: levels.length, duplicatesInGraph };
}

export default function DPvsBrute() {
  const {
    seqA,
    seqB,
    result,
    bruteResult,
    loading,
    error,
    setSeqA,
    setSeqB,
    runBruteForce,
    runAlignment,
  } = useAlignment();

  const [demoA, setDemoA] = useState("ACGT");
  const [demoB, setDemoB] = useState("ACG");
  const [pendingRun, setPendingRun] = useState(null);
  const [runDone, setRunDone] = useState(false);
  const [runningComparison, setRunningComparison] = useState(false);
  const [visibleTreeNodes, setVisibleTreeNodes] = useState(0);
  const [dpFillStep, setDpFillStep] = useState(0);

  const cleanA = demoA.toUpperCase().slice(0, 6);
  const cleanB = demoB.toUpperCase().slice(0, 6);
  const demoValid = VALID_SEQ.test(cleanA) && VALID_SEQ.test(cleanB) && cleanA.length > 0 && cleanB.length > 0;

  const graph = useMemo(() => buildGraph(bruteResult.recursionTree, MAX_LEVELS), [bruteResult.recursionTree]);
  const nodesById = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [String(n.id), n])),
    [graph.nodes]
  );

  useEffect(() => {
    if (!pendingRun) return;
    const same = seqA === pendingRun.a && seqB === pendingRun.b;
    if (!same) return;

    const execute = async () => {
      try {
        await runBruteForce();
        await runAlignment();
        setRunDone(true);
      } finally {
        setRunningComparison(false);
        setPendingRun(null);
      }
    };
    execute();
  }, [pendingRun, seqA, seqB, runBruteForce, runAlignment]);

  useEffect(() => {
    setVisibleTreeNodes(0);
    if (!graph.nodes.length || !runDone) return;
    const timer = setInterval(() => {
      setVisibleTreeNodes((prev) => {
        if (prev >= graph.nodes.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 130);
    return () => clearInterval(timer);
  }, [graph.nodes.length, runDone]);

  useEffect(() => {
    setDpFillStep(0);
    if (!result.steps?.length || !runDone) return;
    const timer = setInterval(() => {
      setDpFillStep((prev) => {
        if (prev >= result.steps.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 70);
    return () => clearInterval(timer);
  }, [result.steps, runDone]);

  const runComparison = () => {
    if (!demoValid || cleanA.length > 6 || cleanB.length > 6) return;
    setRunDone(false);
    setRunningComparison(true);
    setSeqA(cleanA);
    setSeqB(cleanB);
    setPendingRun({ a: cleanA, b: cleanB });
  };

  const visibleNodeList = graph.nodes.slice(0, visibleTreeNodes);
  const visibleIdSet = new Set(visibleNodeList.map((n) => String(n.id)));
  const visibleDup = visibleNodeList.filter((n) => n.isDuplicate).length;
  const animatedCalls = Math.round((bruteResult.callCount || 0) * (graph.nodes.length ? visibleNodeList.length / graph.nodes.length : 0));
  const animatedRecomps = Math.round((bruteResult.recomputations || 0) * (graph.duplicatesInGraph ? visibleDup / graph.duplicatesInGraph : 0));

  const dpRows = result.dpTable?.length || 0;
  const dpCols = result.dpTable?.[0]?.length || 0;
  const dpComputations = Math.max((dpRows - 1) * (dpCols - 1), 0);
  const chartData = Array.from({ length: 10 }, (_, idx) => {
    const n = idx + 1;
    return { n, brute: 3 ** n, dp: n * n };
  });

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <p>⚠️ Brute Force demo limited to sequences ≤ 6 chars. For longer sequences, exponential growth makes it infeasible.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={demoA}
            onChange={(e) => setDemoA(e.target.value.toUpperCase().slice(0, 6))}
            className="rounded-md border border-[#2b2f45] bg-[#0f1117] px-3 py-2 font-mono text-slate-100"
            placeholder="ACGT"
          />
          <input
            value={demoB}
            onChange={(e) => setDemoB(e.target.value.toUpperCase().slice(0, 6))}
            className="rounded-md border border-[#2b2f45] bg-[#0f1117] px-3 py-2 font-mono text-slate-100"
            placeholder="ACG"
          />
          <button
            onClick={runComparison}
            disabled={!demoValid || runningComparison || loading}
            className="rounded-md border border-[#00ff9d] bg-[#00ff9d]/15 px-4 py-2 font-medium text-[#00ff9d] disabled:opacity-50"
          >
            Run Comparison
          </button>
        </div>
        {!demoValid ? <p className="mt-2 text-xs text-red-300">Use only A/T/G/C/U, non-empty, max 6 chars.</p> : null}
        {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-[#3b2d33] bg-[#23161b] p-4">
          <h2 className="text-lg font-semibold text-red-300">🌳 Brute Force (Recursive)</h2>
          <p className="text-sm text-red-200/80">Recomputes the same subproblems repeatedly</p>
          <div className="mt-3 overflow-auto rounded-md border border-[#4b2a35] bg-[#180f13] p-2">
            <svg width="760" height={Math.max(240, graph.levelCount * 120)}>
              {graph.edges.map((edge) => {
                if (!visibleIdSet.has(String(edge.from)) || !visibleIdSet.has(String(edge.to))) return null;
                const from = nodesById[String(edge.from)];
                const to = nodesById[String(edge.to)];
                if (!from || !to) return null;
                return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#6b2d3b" strokeWidth="1.5" />;
              })}
              {visibleNodeList.map((node) => (
                <g key={String(node.id)} transform={`translate(${node.x}, ${node.y})`}>
                  <circle r="26" fill={node.isDuplicate ? "#7f1d1d" : "#1f2937"} stroke={node.isDuplicate ? "#ef4444" : "#9ca3af"} strokeWidth="2" />
                  <text textAnchor="middle" y="-2" fill="#e5e7eb" fontSize="10" fontFamily="monospace">
                    ({node.i},{node.j})
                  </text>
                  <text textAnchor="middle" y="12" fill="#d1d5db" fontSize="10" fontFamily="monospace">
                    {node.value}
                  </text>
                  {node.isDuplicate ? <text textAnchor="middle" y="40" fill="#fca5a5" fontSize="9">♻ Recomputed</text> : null}
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border border-[#4b2a35] bg-[#180f13] p-3">
              <p className="text-red-200">Total Calls</p>
              <p className="font-mono text-2xl text-red-300">{animatedCalls}</p>
            </div>
            <div className="rounded-md border border-[#4b2a35] bg-[#180f13] p-3">
              <p className="text-red-200">Recomputations</p>
              <p className="font-mono text-2xl text-red-400">{animatedRecomps}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-[#2b4b40] bg-[#10211c] p-4">
          <h2 className="text-lg font-semibold text-[#00ff9d]">⚡ Dynamic Programming</h2>
          <p className="text-sm text-emerald-200/80">Each subproblem solved exactly once</p>
          <div className="mt-3 overflow-auto rounded-md border border-[#214638] bg-[#0d1714] p-3">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${(result.dpTable?.[0]?.length || 0) + 1}, minmax(2.1rem, 2.1rem))` }}
            >
              <div />
              {seqB.split("").map((c, idx) => (
                <div key={`h-${idx}`} className="text-center font-mono text-xs text-emerald-200">{c}</div>
              ))}
              {result.dpTable?.map((row, i) => (
                <div key={`r-${i}`} className="contents">
                  <div key={`l-${i}`} className="text-center font-mono text-xs text-emerald-200">{i === 0 ? "-" : seqA[i - 1]}</div>
                  {row.map((val, j) => {
                    const stepIndex = result.steps?.findIndex((s) => s.i === i && s.j === j);
                    const visible = i === 0 || j === 0 || (stepIndex >= 0 && stepIndex < dpFillStep);
                    return (
                      <motion.div
                        key={`${i}-${j}`}
                        initial={{ opacity: 0.25, scale: 0.96 }}
                        animate={visible ? { opacity: 1, scale: 1, backgroundColor: "rgba(0,255,157,0.25)" } : { opacity: 0.25, scale: 0.96 }}
                        className="flex h-8 w-8 items-center justify-center rounded border border-[#2b4b40] font-mono text-[11px] text-emerald-100"
                      >
                        {visible ? val : ""}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border border-[#214638] bg-[#0d1714] p-3">
              <p className="text-emerald-200">Total Computations</p>
              <p className="font-mono text-2xl text-[#00ff9d]">{dpComputations}</p>
            </div>
            <div className="rounded-md border border-[#214638] bg-[#0d1714] p-3">
              <p className="text-emerald-200">Recomputations</p>
              <p className="font-mono text-2xl text-[#00ff9d]">0</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Growth Comparison</h3>
        {!runDone ? (
          <p className="mb-2 text-xs text-slate-400">
            Placeholder trend preview. Run comparison to animate real brute-force and DP counters above.
          </p>
        ) : null}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="n" stroke="#9ca3af" label={{ value: "Sequence Length", position: "insideBottom", fill: "#9ca3af" }} />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="brute" stroke="#ff4d4d" strokeWidth={2} name="Brute Force (3^n)" dot={false} />
              <Line type="monotone" dataKey="dp" stroke="#00ff9d" strokeWidth={2} name="Dynamic Programming (n^2)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2b2f45] text-left text-slate-300">
              <th className="px-3 py-2">Metric</th>
              <th className="bg-red-950/30 px-3 py-2 text-red-300">Brute Force</th>
              <th className="bg-emerald-950/30 px-3 py-2 text-[#00ff9d]">Dynamic Programming</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#2b2f45]"><td className="px-3 py-2">Total calls</td><td className="bg-red-950/20 px-3 py-2">{bruteResult.callCount || 0}</td><td className="bg-emerald-950/20 px-3 py-2">{dpComputations}</td></tr>
            <tr className="border-b border-[#2b2f45]"><td className="px-3 py-2">Recomputations</td><td className="bg-red-950/20 px-3 py-2">{bruteResult.recomputations || 0}</td><td className="bg-emerald-950/20 px-3 py-2">0</td></tr>
            <tr className="border-b border-[#2b2f45]"><td className="px-3 py-2">Time complexity</td><td className="bg-red-950/20 px-3 py-2">O(3^(n+m))</td><td className="bg-emerald-950/20 px-3 py-2">O(n×m)</td></tr>
            <tr className="border-b border-[#2b2f45]"><td className="px-3 py-2">Space complexity</td><td className="bg-red-950/20 px-3 py-2">O(n+m) stack</td><td className="bg-emerald-950/20 px-3 py-2">O(n×m)</td></tr>
            <tr><td className="px-3 py-2">Feasible for n=20?</td><td className="bg-red-950/20 px-3 py-2">❌ No</td><td className="bg-emerald-950/20 px-3 py-2">✅ Yes</td></tr>
          </tbody>
        </table>
      </section>

      {runDone ? (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#00ff9d]/50 bg-[#00ff9d]/10 p-5 text-center"
        >
          <p className="text-xl font-semibold text-[#00ff9d]">
            DP stores each subproblem result → eliminates {bruteResult.recomputations || 0} redundant computations
          </p>
        </motion.section>
      ) : null}
    </div>
  );
}
