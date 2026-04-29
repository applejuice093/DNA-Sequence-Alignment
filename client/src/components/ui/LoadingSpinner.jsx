export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-md border border-[#2b2f45] bg-[#141a29] px-3 py-2 text-sm text-slate-200">
      <div className="relative h-6 w-6">
        <span className="helix-dot helix-dot-a" />
        <span className="helix-dot helix-dot-b" />
      </div>
      <span>{label}</span>
    </div>
  );
}
