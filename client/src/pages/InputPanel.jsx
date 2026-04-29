import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAlignment } from "../context/AlignmentContext";

const MAX_LEN = 20;
const VALID_PATTERN = /^[ATGCU]*$/;

function cleanSequence(value) {
  return String(value || "").toUpperCase().slice(0, MAX_LEN);
}

function isValidSequence(value) {
  return VALID_PATTERN.test(value);
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <label className="block text-sm text-slate-200">
      <div className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-[#00ff9d]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#00ff9d]"
      />
    </label>
  );
}

export default function InputPanel() {
  const navigate = useNavigate();
  const {
    seqA,
    seqB,
    algorithm,
    params,
    loading,
    error,
    setSeqA,
    setSeqB,
    setAlgorithm,
    setParams,
    runAlignment,
  } = useAlignment();

  const normalizedA = cleanSequence(seqA);
  const normalizedB = cleanSequence(seqB);
  const isAValid = isValidSequence(normalizedA);
  const isBValid = isValidSequence(normalizedB);
  const hasInput = normalizedA.length > 0 && normalizedB.length > 0;
  const canRun = hasInput && isAValid && isBValid && !loading;

  const onRunAlignment = async () => {
    try {
      await runAlignment();
      navigate("/result");
    } catch {
      // Error is already stored in context and shown in UI.
    }
  };

  const onLoadExample = () => {
    setSeqA("AGTACG");
    setSeqB("ACATCG");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Sequence Input</h2>
          <div className="space-y-4">
            <label className="block text-sm text-slate-200">
              <div className="mb-1 flex items-center justify-between">
                <span>Sequence A</span>
                <span className="font-mono text-xs text-slate-400">{normalizedA.length}/{MAX_LEN}</span>
              </div>
              <textarea
                rows={4}
                value={normalizedA}
                onChange={(e) => setSeqA(cleanSequence(e.target.value))}
                placeholder="e.g. AGTACG"
                className={`w-full resize-none rounded-md border bg-[#0f1117] px-3 py-2 font-mono text-[#00ff9d] outline-none ring-[#00ff9d] focus:ring ${
                  isAValid ? "border-[#2b2f45]" : "border-red-500"
                }`}
              />
              {!isAValid ? (
                <p className="mt-1 text-xs text-red-400">Only A, T, G, C, U characters are allowed.</p>
              ) : null}
            </label>

            <label className="block text-sm text-slate-200">
              <div className="mb-1 flex items-center justify-between">
                <span>Sequence B</span>
                <span className="font-mono text-xs text-slate-400">{normalizedB.length}/{MAX_LEN}</span>
              </div>
              <textarea
                rows={4}
                value={normalizedB}
                onChange={(e) => setSeqB(cleanSequence(e.target.value))}
                placeholder="e.g. ACATCG"
                className={`w-full resize-none rounded-md border bg-[#0f1117] px-3 py-2 font-mono text-[#00ff9d] outline-none ring-[#00ff9d] focus:ring ${
                  isBValid ? "border-[#2b2f45]" : "border-red-500"
                }`}
              />
              {!isBValid ? (
                <p className="mt-1 text-xs text-red-400">Only A, T, G, C, U characters are allowed.</p>
              ) : null}
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-[#2b2f45] bg-[#1e2130] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#00ff9d]">Parameters</h2>
          <div className="space-y-4">
            <label className="block text-sm text-slate-200">
              <span className="mb-1 block">Algorithm</span>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full rounded-md border border-[#2b2f45] bg-[#0f1117] px-3 py-2 text-slate-100 outline-none ring-[#00ff9d] focus:ring"
              >
                <option value="global">Global (Needleman–Wunsch)</option>
                <option value="local">Local (Smith–Waterman)</option>
              </select>
            </label>

            <Slider
              label="Match Score"
              min={1}
              max={5}
              value={params.match}
              onChange={(next) => setParams((prev) => ({ ...prev, match: next }))}
            />
            <Slider
              label="Mismatch Penalty"
              min={-5}
              max={-1}
              value={params.mismatch}
              onChange={(next) => setParams((prev) => ({ ...prev, mismatch: next }))}
            />
            <Slider
              label="Gap Penalty"
              min={-5}
              max={-1}
              value={params.gap}
              onChange={(next) => setParams((prev) => ({ ...prev, gap: next }))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: "0 0 18px rgba(0,255,157,0.35)" }}
          whileTap={{ scale: 0.99 }}
          animate={canRun ? { opacity: [1, 0.92, 1] } : { opacity: 1 }}
          transition={canRun ? { duration: 1.4, repeat: Infinity } : { duration: 0 }}
          onClick={onRunAlignment}
          disabled={!canRun}
          className="w-full rounded-md border border-[#00ff9d] bg-[#00ff9d]/10 px-4 py-3 font-medium text-[#00ff9d] transition hover:bg-[#00ff9d]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Alignment"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onLoadExample}
          className="w-full rounded-md border border-[#3b405a] bg-[#1e2130] px-4 py-3 font-medium text-slate-200 transition hover:border-[#00ff9d] hover:text-[#00ff9d]"
        >
          Demo: Load Example
        </motion.button>

        {loading ? (
          <div className="flex items-center justify-center gap-2 pt-1 text-sm text-slate-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#00ff9d] border-t-transparent" />
            <span>Computing alignment...</span>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </motion.section>
  );
}
