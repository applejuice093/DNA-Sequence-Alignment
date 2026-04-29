import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { useAlignment } from "../../context/AlignmentContext";

export default function Navbar() {
  const { loading } = useAlignment();

  return (
    <header className="border-b border-[#1e2130] bg-[#0f1117]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <motion.div initial={{ rotate: -10, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }} transition={{ duration: 0.4 }} className="text-2xl" aria-hidden="true">
            🧬
          </motion.div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#00ff9d]">SequenceDP</h1>
            <p className="text-xs text-slate-400">Dynamic Programming Visualizer</p>
          </div>
          {loading ? (
            <div className="ml-2 inline-flex items-center gap-2 rounded-full border border-[#00ff9d]/40 bg-[#00ff9d]/10 px-2 py-1 text-xs text-[#00ff9d]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00ff9d]" />
              <span>Live</span>
            </div>
          ) : null}
        </div>

        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-[#2b2f45] bg-[#1e2130] px-3 py-2 text-sm text-slate-200 transition hover:border-[#00ff9d] hover:text-[#00ff9d]"
          aria-label="GitHub repository"
        >
          <Github size={16} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}
