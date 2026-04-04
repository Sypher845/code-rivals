import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Play, Target, Trophy, Zap } from "lucide-react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";
import { panelFrameClass, panelNoiseClass } from "../../components/uiClasses";
import { getLeagueFromElo, getLeagueTierStyle } from "../../lib/ranking";
import { tables } from "../../module_bindings";

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function StatsTab() {
  const { identity } = useSpacetimeDB();
  const [animatedElo, setAnimatedElo] = useState(0);
  const [sessionRows] = useTable(tables.authSession);
  const [playerProfileRows] = useTable(tables.playerProfile);
  const [matchSummaryRows] = useTable(tables.arenaMatchSummary);

  const session = sessionRows.find((row) =>
    identity ? row.sessionIdentity.isEqual(identity) : false,
  );
  const profile = playerProfileRows.find(
    (row) => row.username === session?.username,
  );
  const eloRating = Number(profile?.eloRating ?? 400n);
  const league = getLeagueFromElo(eloRating);
  const recentMatches = useMemo(
    () =>
      matchSummaryRows
        .filter((row) => row.playerUsername === session?.username)
        .sort(
          (left, right) =>
            Number(right.createdAt.microsSinceUnixEpoch - left.createdAt.microsSinceUnixEpoch),
        )
        .slice(0, 7),
    [matchSummaryRows, session?.username],
  );
  const matchesPlayed = Number(profile?.matchesPlayed ?? 0n);
  const wins = Number(profile?.wins ?? 0n);
  const losses = Number(profile?.losses ?? 0n);
  const eloTrend = recentMatches.reduce(
    (sum, match) => sum + Number(match.deltaRating),
    0,
  );
  const winStreak = useMemo(() => {
    let streak = 0;
    for (const match of recentMatches) {
      if (match.winner !== "user") {
        break;
      }
      streak += 1;
    }
    return streak;
  }, [recentMatches]);

  useEffect(() => {
    const duration = 900;
    const steps = 28;
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      setAnimatedElo(Math.round((eloRating * frame) / steps));
      if (frame >= steps) {
        window.clearInterval(timer);
      }
    }, duration / steps);

    return () => window.clearInterval(timer);
  }, [eloRating]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="group relative min-h-[140px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] px-5 py-4 transition-all duration-300 hover:border-[rgba(0,229,204,0.3)]">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[rgba(241,243,252,0.56)] uppercase">Win Streak</p>
              <p className="text-5xl font-bold tracking-tight text-(--on-background)">{winStreak}</p>
              <p className={`text-xs uppercase tracking-[0.14em] ${winStreak > 0 ? "text-(--signal-success)" : "text-[rgba(241,243,252,0.52)]"}`}>
                straight wins
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(241,243,252,0.06)] text-[rgba(241,243,252,0.42)] transition group-hover:bg-[rgba(0,229,204,0.12)] group-hover:text-(--arena-accent)"><Target className="h-5 w-5" /></div>
          </div>
        </article>
        <article className="group relative min-h-[140px] overflow-hidden rounded-xl border border-[rgba(0,229,204,0.35)] bg-[rgba(0,229,204,0.08)] px-5 py-4 transition-all duration-300 hover:border-[rgba(0,229,204,0.55)]">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[rgba(241,243,252,0.56)] uppercase">ELO Rating</p>
              <p className="text-5xl font-bold tracking-tight text-(--arena-accent)">{animatedElo.toLocaleString()}</p>
              <div className="flex items-center gap-1.5 text-xs">
                {eloTrend !== 0 ? (
                  <span className={eloTrend > 0 ? "text-(--signal-success)" : "text-(--signal-danger)"}>
                    {eloTrend > 0 ? "+" : ""}
                    {eloTrend}
                  </span>
                ) : null}
                <span className="text-[rgba(241,243,252,0.52)]">{league}</span>
              </div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(0,229,204,0.12)] text-(--arena-accent)"><Trophy className="h-5 w-5" /></div>
          </div>
        </article>
        <article className="group relative min-h-[140px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] px-5 py-4 transition-all duration-300 hover:border-[rgba(0,229,204,0.3)]">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-medium tracking-[0.14em] text-[rgba(241,243,252,0.56)] uppercase">Matches Played</p>
              <p className="text-5xl font-bold tracking-tight text-(--on-background)">{matchesPlayed}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(241,243,252,0.06)] text-[rgba(241,243,252,0.42)] transition group-hover:bg-[rgba(0,229,204,0.12)] group-hover:text-(--arena-accent)"><Zap className="h-5 w-5" /></div>
          </div>
        </article>
      </div>

      <section className={`${panelFrameClass} arena-stagger p-5`} style={{ animationDelay: "220ms" }}>
        <div className={panelNoiseClass} />
        <div className="relative z-[1] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-[0.14em] text-[rgba(241,243,252,0.6)] uppercase">Match History</p>
          </div>
          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.56)] px-4 py-8 text-center text-sm text-[rgba(241,243,252,0.56)]">
                Your finished arena matches will show up here.
              </div>
            ) : recentMatches.map((match) => {
              const isVictory = match.winner === "user";
              return (
                <article key={match.summaryKey} className={`group relative overflow-hidden rounded-xl border bg-[rgba(6,11,18,0.72)] p-4 transition hover:border-[rgba(0,229,204,0.28)] ${isVictory ? "border-l-2 border-l-(--signal-success) border-[rgba(255,255,255,0.08)]" : "border-l-2 border-l-(--signal-danger) border-[rgba(255,255,255,0.08)]"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`grid h-12 w-12 place-items-center rounded-lg text-lg font-bold ${isVictory ? "bg-[rgba(74,222,128,0.12)] text-(--signal-success)" : "bg-[rgba(255,112,112,0.12)] text-(--signal-danger)"}`}>{match.opponentUsername.slice(0, 2).toUpperCase()}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold tracking-[0.1em] uppercase ${isVictory ? "text-(--signal-success)" : "text-(--signal-danger)"}`}>{isVictory ? "Victory" : "Defeat"}</span>
                          <span className="text-sm text-[rgba(241,243,252,0.5)]">vs</span>
                          <span className="text-sm font-semibold text-(--on-background)">{match.opponentUsername}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase ${getLeagueTierStyle(match.opponentLeague)}`}>{match.opponentLeague}</span>
                          <span className="text-xs text-[rgba(241,243,252,0.56)]">{Number(match.pointsScored)} pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${Number(match.deltaRating) > 0 ? "text-(--signal-success)" : "text-(--signal-danger)"}`}>{Number(match.deltaRating) > 0 ? "+" : ""}{Number(match.deltaRating)}</p>
                        <p className="text-xs text-[rgba(241,243,252,0.52)]">{formatTimeAgo(match.createdAt.toDate())}</p>
                      </div>
                      <div className="hidden gap-1 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 sm:flex sm:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-[rgba(255,255,255,0.12)] text-[rgba(241,243,252,0.68)] transition hover:text-(--on-background)"><Play className="h-4 w-4" /></button>
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-[rgba(255,255,255,0.12)] text-[rgba(241,243,252,0.68)] transition hover:text-(--on-background)"><ExternalLink className="h-4 w-4" /></button>
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
