import { mockLeaderboard } from "./arena-data";
import { panelFrameClass, panelNoiseClass, tableHeaderClass, tableCellClass } from "../../components/uiClasses";

const rankColors = [
  "text-yellow-300",  // 1st
  "text-slate-200",   // 2nd
  "text-amber-500",   // 3rd
];

const rankBgColors = [
  "bg-[rgba(250,204,21,0.12)] shadow-[inset_0_0_0_1px_rgba(250,204,21,0.28),0_0_40px_rgba(250,204,21,0.08)]",  // 1st
  "bg-[rgba(209,213,219,0.08)]",  // 2nd
  "bg-[rgba(217,119,6,0.08)]",    // 3rd
];

const medals = ["🥇", "🥈", "🥉"];

export function LeaderboardTab() {
  return (
    <div className="space-y-4">
      <section className={`${panelFrameClass} arena-stagger p-5`}>
        <div className={panelNoiseClass} />
        <div className="relative z-1">
          <div className="mb-4">
            <p className="font-(--font-mono) text-[0.72rem] tracking-[0.24em] text-(--primary) uppercase">
              Diamond League Leaderboard
            </p>
            <p className="mt-1 text-xs text-[rgba(241,243,252,0.5)]">
              Global rankings for your league
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(241,243,252,0.08)]">
                  <th className={tableHeaderClass}>Rank</th>
                  <th className={tableHeaderClass}>Player</th>
                  <th className={tableHeaderClass}>ELO</th>
                  <th className={tableHeaderClass}>Win Rate</th>
                  <th className={tableHeaderClass}>League</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry, index) => (
                  <tr
                    key={entry.rank}
                    className={`border-b border-l-2 border-[rgba(241,243,252,0.04)] transition ${
                      entry.isCurrentUser
                        ? "border-l-(--arena-accent) bg-[rgba(0,229,204,0.1)]"
                        : index < 3
                          ? rankBgColors[index]
                          : "border-l-transparent hover:bg-[rgba(255,255,255,0.02)]"
                    }`}
                  >
                    <td className={tableCellClass}>
                      <div className="inline-flex items-center gap-2">
                        {index < 3 && <span className="text-base">{medals[index]}</span>}
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index < 3
                              ? rankColors[index]
                              : "text-[rgba(241,243,252,0.6)]"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <span
                        className={`text-sm font-semibold ${
                          entry.isCurrentUser
                            ? "text-(--primary)"
                            : "text-(--on-background)"
                        }`}
                      >
                        {entry.username}
                        {entry.isCurrentUser && (
                          <span className="ml-2 rounded-full border border-[rgba(224,141,255,0.3)] bg-[rgba(224,141,255,0.1)] px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em]">
                            You
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <span className="font-semibold text-(--on-background)">
                        {entry.elo.toLocaleString()}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <span className="text-sm text-[rgba(241,243,252,0.7)]">
                        {entry.winRate}%
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <span className="inline-flex items-center rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2.5 py-1 text-xs font-medium text-(--primary)">
                        {entry.league}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
