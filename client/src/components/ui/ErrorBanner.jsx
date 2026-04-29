import { useAlignment } from "../../context/AlignmentContext";

export default function ErrorBanner() {
  const { error, setError } = useAlignment();
  if (!error) return null;

  return (
    <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <div className="flex items-start justify-between gap-3">
        <p>{error}</p>
        <button
          onClick={() => setError("")}
          className="rounded border border-red-400/60 px-2 py-0.5 text-xs text-red-200 hover:bg-red-500/20"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
