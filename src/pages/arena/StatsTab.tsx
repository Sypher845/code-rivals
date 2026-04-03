import { useEffect, useState } from "react";
import { ExternalLink, Play, Target, Trophy, Zap } from "lucide-react";
import { mockStats, mockMatches } from "./arena-data";
import { panelFrameClass, panelNoiseClass } from "../../components/uiClasses";

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
  const { kdRatio, eloRating, kdTrend, eloTrend } = mockStats;
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
  const matchesPlayed = mockMatches.length;

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

  const getLeagueTierStyle = (leagueName: string) => {
    const lower = leagueName.toLowerCase();
    if (lower.includes("diamond")) {
      return "border-[oklch(0.82_0.18_175/0.35)] bg-[oklch(0.82_0.18_175/0.1)] text-[oklch(0.82_0.18_175)]";
    }
    if (lower.includes("platinum")) {
      return "border-[oklch(0.75_0.08_230/0.35)] bg-[oklch(0.75_0.08_230/0.1)] text-[oklch(0.75_0.08_230)]";
    }
    if (lower.includes("gold")) {
      return "border-[oklch(0.78_0.15_85/0.35)] bg-[oklch(0.78_0.15_85/0.1)] text-[oklch(0.78_0.15_85)]";
    }
    return "border-[rgba(241,243,252,0.22)] bg-[rgba(241,243,252,0.08)] text-[rgba(241,243,252,0.84)]";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <article
          className="group relative min-h-[140px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] px-5 py-4 transition-all duration-300 hover:border-[rgba(0,229,204,0.3)]"
          style={{ animationDelay: "40ms" }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[rgba(241,243,252,0.56)] uppercase">
              K/D Ratio
              </p>
              <p className="text-5xl font-bold tracking-tight text-(--on-background)">{kdRatio.toFixed(2)}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-(--signal-success)">▲</span>
                <span className="text-(--signal-success)">+{kdTrend}%</span>
                <span className="text-[rgba(241,243,252,0.52)]">this week</span>
              </div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(241,243,252,0.06)] text-[rgba(241,243,252,0.42)] transition group-hover:bg-[rgba(0,229,204,0.12)] group-hover:text-(--arena-accent)">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_8%,rgba(0,229,204,0.08),transparent_45%)] opacity-0 transition-opacity group-hover:opacity-100" />
        </article>

        <article
          className="group relative min-h-[140px] overflow-hidden rounded-xl border border-[rgba(0,229,204,0.35)] bg-[rgba(0,229,204,0.08)] px-5 py-4 transition-all duration-300 hover:border-[rgba(0,229,204,0.55)]"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[rgba(241,243,252,0.56)] uppercase">
                ELO Rating
              </p>
              <p className="text-5xl font-bold tracking-tight text-(--arena-accent)">{animatedElo.toLocaleString()}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-(--signal-success)">▲</span>
                <span className="text-(--signal-success)">+{eloTrend}</span>
                <span className="text-[rgba(241,243,252,0.52)]">this week</span>
              </div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(0,229,204,0.12)] text-(--arena-accent)">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        </article>

        <article
          className="group relative min-h-[140px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] px-5 py-4 transition-all duration-300 hover:border-[rgba(0,229,204,0.3)]"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[rgba(241,243,252,0.56)] uppercase">
                Matches Played
              </p>
              <p className="text-5xl font-bold tracking-tight text-(--on-background)">{matchesPlayed}</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-(--signal-success)">▲</span>
                <span className="text-(--signal-success)">+8%</span>
                <span className="text-[rgba(241,243,252,0.52)]">this week</span>
              </div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(241,243,252,0.06)] text-[rgba(241,243,252,0.42)] transition group-hover:bg-[rgba(0,229,204,0.12)] group-hover:text-(--arena-accent)">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </article>
      </div>

      <section className={`${panelFrameClass} arena-stagger p-5`} style={{ animationDelay: "220ms" }}>
        <div className={panelNoiseClass} />
        <div className="relative z-[1] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-[0.14em] text-[rgba(241,243,252,0.6)] uppercase">
              Recent Battles
            </p>
            <button
              type="button"
              className="text-xs text-(--arena-accent) transition hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {mockMatches.map((match) => {
              const isVictory = match.winner === "user";
              return (
                <article
                  key={match.id}
                  className={`group relative overflow-hidden rounded-xl border bg-[rgba(6,11,18,0.72)] p-4 transition hover:border-[rgba(0,229,204,0.28)] ${
                    isVictory
                      ? "border-l-2 border-l-(--signal-success) border-[rgba(255,255,255,0.08)]"
                      : "border-l-2 border-l-(--signal-danger) border-[rgba(255,255,255,0.08)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-lg text-lg font-bold ${
                          isVictory
                            ? "bg-[rgba(74,222,128,0.12)] text-(--signal-success)"
                            : "bg-[rgba(255,112,112,0.12)] text-(--signal-danger)"
                        }`}
                      >
                        {match.opponentName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold tracking-[0.1em] uppercase ${
                              isVictory ? "text-(--signal-success)" : "text-(--signal-danger)"
                            }`}
                          >
                            {isVictory ? "Victory" : "Defeat"}
                          </span>
                          <span className="text-sm text-[rgba(241,243,252,0.5)]">vs</span>
                          <span className="text-sm font-semibold text-(--on-background)">{match.opponentName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase ${getLeagueTierStyle(match.opponentLeague)}`}>
                            {match.opponentLeague}
                          </span>
                          <span className="text-xs text-[rgba(241,243,252,0.56)]">{match.pointsScored}/20 pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${match.deltaRating > 0 ? "text-(--signal-success)" : "text-(--signal-danger)"}`}>
                          {match.deltaRating > 0 ? "+" : ""}
                          {match.deltaRating}
                        </p>
                        <p className="text-xs text-[rgba(241,243,252,0.52)]">{formatTimeAgo(match.timestamp)}</p>
                      </div>

                      <div className="hidden gap-1 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 sm:flex sm:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[rgba(255,255,255,0.12)] text-[rgba(241,243,252,0.68)] transition hover:text-(--on-background)"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[rgba(255,255,255,0.12)] text-[rgba(241,243,252,0.68)] transition hover:text-(--on-background)"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
