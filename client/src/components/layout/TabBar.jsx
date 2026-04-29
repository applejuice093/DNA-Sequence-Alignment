import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Input", icon: "🧬", end: true },
  { to: "/result", label: "Result", icon: "📊" },
  { to: "/dp-matrix", label: "DP Matrix", icon: "🔢" },
  { to: "/comparison", label: "DP vs Brute", icon: "⚔️" },
  { to: "/traceback", label: "Traceback", icon: "🔙" },
  { to: "/history", label: "History", icon: "📂" },
];

export default function TabBar() {
  return (
    <nav className="border-b border-[#1e2130] bg-[#121520]">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md border px-3 py-2 text-sm transition ${
                isActive
                  ? "border-[#00ff9d] bg-[#00ff9d]/10 text-[#00ff9d]"
                  : "border-[#2b2f45] bg-[#1e2130] text-slate-300 hover:border-[#00ff9d]/60 hover:text-[#00ff9d]"
              }`
            }
          >
            <span className="mr-2" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
