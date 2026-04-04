import { useEffect, useMemo, useState } from "react";
import { Target, Trophy, Zap } from "lucide-react";
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

  const winRate =
    matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="group relative min-h-[164px] overflow-hidden rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(7,11,18,0.9),rgba(5,9,15,0.94))] px-5 py-5 shadow-[0_18px_38px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,229,204,0.2)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.3)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_24%)] opacity-80" />
          <div className="relative z-[1] flex h-full items-start justify-between">
            <div className="space-y-2.5">
              <p className="font-[var(--font-mono)] text-[0.72rem] font-medium tracking-[0.2em] text-[rgba(241,243,252,0.52)] uppercase">Win Streak</p>
              <p className="text-[clamp(3rem,4vw,3.5rem)] font-semibold leading-none tracking-[-0.05em] text-(--on-background)">{winStreak}</p>
              <p className={`text-[0.72rem] uppercase tracking-[0.18em] ${winStreak > 0 ? "text-(--signal-success)" : "text-[rgba(241,243,252,0.52)]"}`}>
                straight wins
              </p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(241,243,252,0.42)] transition group-hover:border-[rgba(0,229,204,0.2)] group-hover:bg-[rgba(0,229,204,0.12)] group-hover:text-(--arena-accent)"><Target className="h-5 w-5" /></div>
          </div>
        </article>
        <article className="group relative min-h-[164px] overflow-hidden rounded-[1.35rem] border border-[rgba(0,229,204,0.32)] bg-[linear-gradient(135deg,rgba(0,229,204,0.12),rgba(4,32,36,0.92))] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,229,204,0.48)] hover:shadow-[0_24px_54px_rgba(0,0,0,0.32)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,255,0.16),transparent_28%)]" />
          <div className="relative z-[1] flex h-full items-start justify-between">
            <div className="space-y-2.5">
              <p className="font-[var(--font-mono)] text-[0.72rem] font-medium tracking-[0.2em] text-[rgba(214,255,249,0.7)] uppercase">ELO Rating</p>
              <p className="text-[clamp(3rem,4vw,3.5rem)] font-semibold leading-none tracking-[-0.05em] text-(--arena-accent)">{animatedElo.toLocaleString()}</p>
              <div className="flex items-center gap-1.5 text-[0.82rem]">
                {eloTrend !== 0 ? (
                  <span className={eloTrend > 0 ? "text-(--signal-success)" : "text-(--signal-danger)"}>
                    {eloTrend > 0 ? "+" : ""}
                    {eloTrend}
                  </span>
                ) : null}
                <span className="text-[rgba(241,243,252,0.66)]">{league}</span>
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(0,229,204,0.16)] bg-[rgba(0,229,204,0.12)] text-(--arena-accent)"><Trophy className="h-5 w-5" /></div>
          </div>
        </article>
        <article className="group relative min-h-[164px] overflow-hidden rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(7,11,18,0.9),rgba(5,9,15,0.94))] px-5 py-5 shadow-[0_18px_38px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,229,204,0.2)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.3)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,87,255,0.08),transparent_22%)] opacity-90" />
          <div className="relative z-[1] flex h-full items-start justify-between">
            <div className="space-y-2.5">
              <p className="font-[var(--font-mono)] text-[0.72rem] font-medium tracking-[0.2em] text-[rgba(241,243,252,0.52)] uppercase">Matches Played</p>
              <p className="text-[clamp(3rem,4vw,3.5rem)] font-semibold leading-none tracking-[-0.05em] text-(--on-background)">{matchesPlayed}</p>
              <div className="flex items-center gap-2 text-[0.82rem] text-[rgba(241,243,252,0.62)]">
                <span>{wins}W</span>
                <span className="text-[rgba(241,243,252,0.24)]">/</span>
                <span>{losses}L</span>
                <span className="ml-1 rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 font-[var(--font-mono)] text-[0.62rem] tracking-[0.14em] uppercase text-[rgba(241,243,252,0.54)]">
                  {winRate}% WR
                </span>
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[rgba(241,243,252,0.42)] transition group-hover:border-[rgba(0,229,204,0.2)] group-hover:bg-[rgba(0,229,204,0.12)] group-hover:text-(--arena-accent)"><Zap className="h-5 w-5" /></div>
          </div>
        </article>
      </div>

      <section className={`${panelFrameClass} arena-stagger p-5`} style={{ animationDelay: "220ms" }}>
        <div className={panelNoiseClass} />
        <div className="relative z-[1] space-y-4">
          <div>
            <div>
              <p className="font-[var(--font-mono)] text-[0.78rem] font-medium tracking-[0.22em] text-(--arena-accent) uppercase">Match History</p>
              <p className="mt-2 text-sm text-[rgba(241,243,252,0.46)]">
                Your last arena duels, rating shifts, and opponent snapshots.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <div className="overflow-hidden rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(7,11,18,0.72),rgba(5,9,15,0.88))]">
                <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(0,229,204,0.18)] bg-[rgba(0,229,204,0.08)] text-(--arena-accent)">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-lg font-medium text-(--on-background)">
                    No finished duels yet
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-7 text-[rgba(241,243,252,0.54)]">
                    Your completed arena matches, rating swings, and rival results
                    will start filling this command log once your first duel ends.
                  </p>
                </div>
              </div>
            ) : recentMatches.map((match) => {
              const isVictory = match.winner === "user";
              return (
                <article key={match.summaryKey} className={`group relative overflow-hidden rounded-[1.15rem] border bg-[linear-gradient(180deg,rgba(7,11,18,0.78),rgba(5,9,15,0.9))] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(0,229,204,0.28)] ${isVictory ? "border-l-2 border-l-(--signal-success) border-[rgba(255,255,255,0.08)]" : "border-l-2 border-l-(--signal-danger) border-[rgba(255,255,255,0.08)]"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`grid h-12 w-12 place-items-center rounded-xl text-lg font-bold ${isVictory ? "bg-[rgba(74,222,128,0.12)] text-(--signal-success)" : "bg-[rgba(255,112,112,0.12)] text-(--signal-danger)"}`}>{match.opponentUsername.slice(0, 2).toUpperCase()}</div>
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
