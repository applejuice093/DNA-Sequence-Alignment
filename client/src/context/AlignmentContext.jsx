import { createContext, useContext, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AlignmentContext = createContext(null);

const initialResult = {
  score: null,
  alignmentA: "",
  alignmentB: "",
  dpTable: [],
  traceTable: [],
  steps: [],
  similarity: 0,
  identity: 0,
};

const initialBrute = {
  callCount: 0,
  recomputations: 0,
  recursionTree: null,
  score: null,
};

export function AlignmentProvider({ children }) {
  const [seqA, setSeqA] = useState("");
  const [seqB, setSeqB] = useState("");
  const [algorithm, setAlgorithm] = useState("global");
  const [params, setParams] = useState({ match: 1, mismatch: -1, gap: -2 });
  const [result, setResult] = useState(initialResult);
  const [bruteResult, setBruteResult] = useState(initialBrute);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runAlignment = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/align`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seqA, seqB, algorithm, ...params }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Alignment request failed.");

      setResult({
        score: data.score,
        alignmentA: data.alignmentA,
        alignmentB: data.alignmentB,
        dpTable: data.dpTable || [],
        traceTable: data.traceTable || [],
        steps: data.steps || [],
        similarity: data.similarity ?? 0,
        identity: data.identity ?? 0,
      });
      return data;
    } catch (err) {
      setError(err.message || "Something went wrong.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runBruteForce = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/bruteforce-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seqA, seqB, ...params }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Brute force request failed.");

      setBruteResult({
        callCount: data.callCount ?? 0,
        recomputations: data.recomputations ?? 0,
        recursionTree: data.recursionTree || null,
        score: data.score ?? null,
      });
      return data;
    } catch (err) {
      setError(err.message || "Something went wrong.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSeqA("");
    setSeqB("");
    setAlgorithm("global");
    setParams({ match: 1, mismatch: -1, gap: -2 });
    setResult(initialResult);
    setBruteResult(initialBrute);
    setError("");
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      seqA,
      seqB,
      algorithm,
      params,
      result,
      bruteResult,
      loading,
      error,
      setError,
      setSeqA,
      setSeqB,
      setAlgorithm,
      setParams,
      runAlignment,
      runBruteForce,
      resetAll,
    }),
    [seqA, seqB, algorithm, params, result, bruteResult, loading, error]
  );

  return <AlignmentContext.Provider value={value}>{children}</AlignmentContext.Provider>;
}

export function useAlignment() {
  const context = useContext(AlignmentContext);
  if (!context) {
    throw new Error("useAlignment must be used inside AlignmentProvider");
  }
  return context;
}
