import { useEffect, useState } from "react";
import { mockStats, mockMatches } from "./arena-data";
import { panelFrameClass, panelNoiseClass, glassCardClass, statValueClass, tableHeaderClass, tableCellClass } from "../../components/uiClasses";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function StatsTab() {
  const { kdRatio, eloRating, league, leaguePercentile, kdTrend, eloTrend } = mockStats;
  const [animatedElo, setAnimatedElo] = useState(0);

  useEffect(() => {
    const duration = 900;
    const steps = 28;
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.round((eloRating * frame) / steps);
      setAnimatedElo(next);
      if (frame >= steps) {
        window.clearInterval(timer);
      }
    }, duration / steps);

    return () => {
      window.clearInterval(timer);
    };
  }, [eloRating]);

  const kdSeries = [1.8, 1.95, 2.0, 2.12, 2.16, 2.31, 2.45];
  const eloSeries = [1710, 1735, 1768, 1788, 1815, 1830, eloRating];
  const leagueSeries = [62, 66, 69, 74, 78, 82, leaguePercentile];

  const buildSparkline = (values: number[]) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(1, max - min);
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* K/D Ratio Card */}
        <article className={`${glassCardClass} arena-stagger p-5`} style={{ animationDelay: "40ms" }}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1]">
            <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
              K/D Ratio
            </p>
            <p className={`${statValueClass} arena-number-ticker mt-3 text-[var(--on-background)]`}>
              {kdRatio.toFixed(2)}
            </p>
            <svg className="mt-3 h-8 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgba(241,243,252,0.55)"
                strokeWidth="3"
                points={buildSparkline(kdSeries)}
              />
            </svg>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-medium text-green-400">▲</span>
              <span className="text-xs text-[rgba(241,243,252,0.62)]">
                {kdTrend}% this week
              </span>
            </div>
          </div>
        </article>

        {/* ELO Rating Card */}
        <article className={`${glassCardClass} arena-stagger p-5`} style={{ animationDelay: "100ms" }}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1]">
            <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
              ELO Rating
            </p>
            <p className={`${statValueClass} arena-number-ticker mt-3 text-[var(--arena-accent)]`}>
              {animatedElo.toLocaleString()}
            </p>
            <svg className="mt-3 h-8 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgba(0,229,204,0.85)"
                strokeWidth="3"
                points={buildSparkline(eloSeries)}
              />
            </svg>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-medium text-green-400">▲</span>
              <span className="text-xs text-[rgba(241,243,252,0.62)]">
                +{eloTrend} this week
              </span>
            </div>
          </div>
        </article>

        {/* League Card */}
        <article className={`${glassCardClass} arena-stagger p-5`} style={{ animationDelay: "160ms" }}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1]">
            <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
              League
            </p>
            <p className={`${statValueClass} mt-3 text-[var(--tertiary)]`}>
              {league}
            </p>
            <svg className="mt-3 h-8 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgba(77,143,255,0.85)"
                strokeWidth="3"
                points={buildSparkline(leagueSeries)}
              />
            </svg>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.08)]">
              <div
                className="h-full rounded-full bg-[var(--arena-accent)]"
                style={{ width: `${leaguePercentile}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs text-[rgba(241,243,252,0.62)]">
                Top {100 - leaguePercentile}%
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* Match History Table */}
      <section className={`${panelFrameClass} arena-stagger p-5`} style={{ animationDelay: "220ms" }}>
        <div className={panelNoiseClass} />
        <div className="relative z-[1]">
          <p className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.24em] text-[var(--primary)] uppercase mb-4">
            Recent Matches
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(241,243,252,0.08)]">
                  <th className={tableHeaderClass}>Opponent</th>
                  <th className={tableHeaderClass}>Winner</th>
                  <th className={tableHeaderClass}>Points Scored</th>
                  <th className={tableHeaderClass}>Delta Rating</th>
                  <th className={tableHeaderClass}>Date</th>
                </tr>
              </thead>
              <tbody>
                {mockMatches.map((match) => (
                  <tr
                    key={match.id}
                    className={`border-b border-[rgba(241,243,252,0.04)] border-l-2 transition hover:bg-[rgba(255,255,255,0.02)] ${
                      match.winner === "user"
                        ? "border-l-[rgba(74,222,128,0.65)]"
                        : "border-l-transparent"
                    }`}
                  >
                    <td className={tableCellClass}>
                      <div>
                        <p className="text-sm font-semibold text-[var(--on-background)]">
                          {match.opponentName}
                        </p>
                        <p className="text-xs text-[rgba(241,243,252,0.5)]">
                          {match.opponentElo} · {match.opponentLeague}
                        </p>
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          match.winner === "user"
                            ? "bg-[rgba(74,222,128,0.12)] text-green-400"
                            : "bg-[rgba(255,112,112,0.12)] text-[var(--signal-danger)]"
                        }`}
                      >
                        {match.winner === "user" ? "You" : match.opponentName}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <span className="font-semibold text-[var(--on-background)]">
                        {match.pointsScored}/20
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <span
                        className={`font-semibold ${
                          match.deltaRating > 0
                            ? "text-green-400"
                            : "text-[var(--signal-danger)]"
                        }`}
                      >
                        {match.deltaRating > 0 ? "↑ +" : "↓ "}
                        {match.deltaRating}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <span className="text-xs text-[rgba(241,243,252,0.5)]">
                        {formatTimeAgo(match.timestamp)}
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
