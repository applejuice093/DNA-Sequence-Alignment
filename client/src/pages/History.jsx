import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlignment } from "../context/AlignmentContext";
import { formatSimilarity, relativeTime } from "../utils/alignmentHelpers";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function History() {
  const navigate = useNavigate();
  const { setSeqA, setSeqB, setAlgorithm, setParams, setError } = useAlignment();
  const [items, setItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE}/history`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch history.");
      setItems(data);
    } catch (error) {
      setError(error.message || "Failed to fetch history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onDelete = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed.");
      await loadHistory();
    } catch (error) {
      setError(error.message || "Delete failed.");
    } finally {
      setDeletingId("");
    }
  };

  const onRerun = (item) => {
    setSeqA(item.seqA || "");
    setSeqB(item.seqB || "");
    setAlgorithm(item.algorithm === "local" ? "local" : "global");
    setParams({
      match: Number(item.match ?? 1),
      mismatch: Number(item.mismatch ?? -1),
      gap: Number(item.gap ?? -2),
    });
    navigate("/");
  };

  if (!loadingHistory && items.length === 0) {
    return (
      <section className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-6 text-center">
        <p className="text-slate-300">No alignments yet. Run your first alignment →</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {loadingHistory ? <p className="text-sm text-slate-400">Loading history...</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item._id} className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
            <p className="seq-mono text-[#00ff9d]">
              {item.seqA} vs {item.seqB}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  item.algorithm === "local" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {item.algorithm === "local" ? "Local" : "Global"}
              </span>
              <span className="text-xs text-slate-400">{relativeTime(item.createdAt)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded border border-[#2b2f45] bg-[#0f1117] p-2">
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-slate-100">{item.score}</p>
              </div>
              <div className="rounded border border-[#2b2f45] bg-[#0f1117] p-2">
                <p className="text-xs text-slate-400">Similarity</p>
                <p className="text-slate-100">{formatSimilarity(item.similarity)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => onRerun(item)} className="rounded-md border border-[#00ff9d] bg-[#00ff9d]/10 px-3 py-2 text-xs text-[#00ff9d]">
                Re-run
              </button>
              <button
                onClick={() => onDelete(item._id)}
                disabled={deletingId === item._id}
                className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300 disabled:opacity-50"
              >
                {deletingId === item._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
