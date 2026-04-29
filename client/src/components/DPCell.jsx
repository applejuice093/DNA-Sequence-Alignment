import { motion } from "framer-motion";

function getHeatColor(value, min, max) {
  if (typeof value !== "number") return "bg-[#131827]";
  if (min === max) return "bg-emerald-500/25";
  const ratio = (value - min) / (max - min);
  if (ratio < 0.2) return "bg-blue-900/45";
  if (ratio < 0.4) return "bg-blue-700/45";
  if (ratio < 0.6) return "bg-cyan-700/45";
  if (ratio < 0.8) return "bg-emerald-700/45";
  return "bg-emerald-500/40";
}

export default function DPCell({ value, arrow, state, tooltip, minValue, maxValue }) {
  const baseClass =
    "group relative flex h-14 w-14 flex-col items-center justify-center rounded-md border text-xs font-mono";

  const stateClass =
    state === "active"
      ? "border-[#00ff9d] bg-[#00ff9d]/15 text-[#00ff9d]"
      : state === "traceback"
      ? "border-amber-400 bg-amber-400/15 text-amber-200"
      : state === "filled"
      ? `border-[#2f3858] ${getHeatColor(value, minValue, maxValue)} text-slate-100`
      : "border-[#2b2f45] bg-[#131827] text-slate-600";

  const arrowText = arrow === "diag" ? "↖" : arrow === "up" ? "↑" : arrow === "left" ? "←" : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0.6 }}
      animate={
        state === "active"
          ? {
              scale: 1.18,
              boxShadow: "0 0 18px rgba(0,255,157,0.45)",
              opacity: 1,
            }
          : state === "traceback"
          ? {
              scale: [1, 1.05, 1],
              boxShadow: "0 0 14px rgba(245,158,11,0.38)",
              opacity: 1,
            }
          : { scale: 1, boxShadow: "0 0 0px rgba(0,0,0,0)", opacity: 1 }
      }
      transition={state === "traceback" ? { duration: 1.1, repeat: Infinity } : { duration: 0.2 }}
      className={`${baseClass} ${stateClass}`}
    >
      {state === "filled" || state === "active" || state === "traceback" ? (
        <>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold">
            {typeof value === "number" ? value : ""}
          </motion.span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px]">
            {arrowText}
          </motion.span>
        </>
      ) : null}

      {(state === "filled" || state === "active" || state === "traceback") && tooltip ? (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-20 hidden w-64 -translate-x-1/2 -translate-y-full rounded-md border border-[#2b2f45] bg-[#0f1117] p-2 text-left text-[11px] leading-relaxed text-slate-200 shadow-xl group-hover:block">
          {tooltip}
        </div>
      ) : null}
    </motion.div>
  );
}
