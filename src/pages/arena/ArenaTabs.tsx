import { Link, useLocation } from "react-router-dom";
import { BarChart3, Users, Trophy } from "lucide-react";

type ArenaTabsProps = {
  username: string;
};

const tabs = [
  { label: "Stats", path: "", icon: BarChart3 },
  { label: "Friends", path: "/friends", icon: Users },
  { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

export function ArenaTabs({ username }: ArenaTabsProps) {
  const location = useLocation();

  const getTabPath = (tabPath: string) => {
    if (!tabPath) return `/${encodeURIComponent(username)}`;
    return `/${encodeURIComponent(username)}${tabPath}`;
  };

  const isActive = (tabPath: string) => {
    const fullPath = getTabPath(tabPath);
    if (tabPath === "") {
      return location.pathname === `/${encodeURIComponent(username)}`;
    }
    return location.pathname === fullPath;
  };

  return (
    <nav className="rounded-xl border border-(--arena-border) bg-(--arena-surface-1) p-2">
      <p className="px-2 pb-2 font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-(--text-tertiary) uppercase">
        Arena Sections
      </p>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <Link
            key={tab.label}
            to={getTabPath(tab.path)}
            className={`group mb-1 flex items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm transition ${
              active
                ? "border-l-(--arena-accent) bg-[rgba(0,229,204,0.12)] text-(--on-background)"
                : "border-l-transparent text-(--text-secondary) hover:bg-(--arena-surface-2) hover:text-(--on-background)"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
