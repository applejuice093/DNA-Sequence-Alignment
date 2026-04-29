import { Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./components/layout/Navbar";
import TabBar from "./components/layout/TabBar";
import ErrorBanner from "./components/ui/ErrorBanner";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { useAlignment } from "./context/AlignmentContext";
import InputPanel from "./pages/InputPanel";
import AlignmentResult from "./pages/AlignmentResult";
import DPMatrix from "./pages/DPMatrix";
import DPvsBrute from "./pages/DPvsBrute";
import Traceback from "./pages/Traceback";
import History from "./pages/History";

export default function App() {
  const { loading } = useAlignment();

  return (
    <div className="min-h-screen bg-[#0f1117] font-sans text-slate-100">
      <Navbar />
      <div className="border-b border-[#1e2130] bg-[#101421]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <p className="seq-mono text-xs text-[#00ff9d]">ATCG - GCTA - DP - TRACEBACK - SCORE</p>
          <div className="flex items-center gap-3">
            <p className="seq-mono text-xs text-slate-500">DNA MATRIX</p>
            {loading ? <LoadingSpinner label="Computing..." /> : null}
          </div>
        </div>
      </div>
      <TabBar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ErrorBanner />
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Routes>
            <Route path="/" element={<InputPanel />} />
            <Route path="/result" element={<AlignmentResult />} />
            <Route path="/dp-matrix" element={<DPMatrix />} />
            <Route path="/comparison" element={<DPvsBrute />} />
            <Route path="/traceback" element={<Traceback />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}
