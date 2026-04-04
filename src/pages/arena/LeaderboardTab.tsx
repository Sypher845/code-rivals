import { Filter, Minus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";
import { getLeagueFromElo } from "../../lib/ranking";
import { tables } from "../../module_bindings";

function getLeagueTier(league: string) {
  const [tier = "Diamond", division = "II"] = league.split(" ");
  return { tier, division };
}

function getTrendFromEntry(wins: number, losses: number) {
  const total = wins + losses;
  if (total === 0) return 0;
  const winRate = Math.round((wins / total) * 100);
  if (winRate >= 60) return Math.max(4, winRate - 50);
  if (winRate <= 45) return -Math.max(4, 50 - winRate);
  return 0;
}

function PodiumCard({ rank, username, elo, winRate, league, isCurrentUser, standHeight }: { rank: number; username: string; elo: number; winRate: number; league: string; isCurrentUser?: boolean; standHeight: string }) {
  const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const avatarTone = rank === 1 ? "bg-[rgba(250,204,21,0.2)] text-yellow-300" : rank === 2 ? "bg-[rgba(209,213,219,0.16)] text-slate-200" : "bg-[rgba(245,158,11,0.18)] text-amber-500";
  const standTone = rank === 1 ? "border-t-yellow-300/50 from-[rgba(250,204,21,0.3)] to-[rgba(250,204,21,0.1)]" : rank === 2 ? "border-t-slate-300/40 from-[rgba(209,213,219,0.24)] to-[rgba(209,213,219,0.08)]" : "border-t-amber-500/50 from-[rgba(245,158,11,0.24)] to-[rgba(245,158,11,0.08)]";
  return <article className="group flex flex-col items-center"><div className={`mb-3 w-32 rounded-xl border bg-[rgba(6,11,18,0.72)] p-4 text-center transition sm:w-40 ${isCurrentUser ? "border-(--arena-accent)/50 bg-[rgba(0,229,204,0.08)]" : "border-[rgba(255,255,255,0.08)]"}`}><div className="mb-2 text-3xl">{medals[rank]}</div><div className={`mx-auto mb-2 grid h-14 w-14 place-items-center rounded-xl text-lg font-bold ${avatarTone}`}>{username.slice(0, 2).toUpperCase()}</div><p className={`truncate text-sm font-semibold ${isCurrentUser ? "text-(--arena-accent)" : "text-(--on-background)"}`}>{username}</p><p className="text-lg font-bold text-(--arena-accent)">{elo.toLocaleString()}</p><p className="text-xs text-[rgba(241,243,252,0.56)]">{winRate}% WR</p><div className="mt-2 inline-flex items-center rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] text-(--primary) uppercase">{league}</div></div><div className={`w-full rounded-t-lg border-t-2 bg-gradient-to-t ${standTone} ${standHeight} flex items-end justify-center`}><span className="mb-2 text-xl font-bold text-[rgba(241,243,252,0.45)]">{rank}</span></div></article>;
}

export function LeaderboardTab() {
  const { identity } = useSpacetimeDB();
  const [sessionRows] = useTable(tables.authSession);
  const [playerProfileRows] = useTable(tables.playerProfile);
  const session = sessionRows.find((row) => (identity ? row.sessionIdentity.isEqual(identity) : false));
  const entries = useMemo(() => playerProfileRows.map((profile) => {
    const wins = Number(profile.wins);
    const losses = Number(profile.losses);
    const total = wins + losses;
    return {
      username: profile.username,
      elo: Number(profile.eloRating),
      winRate: total === 0 ? 0 : Math.round((wins / total) * 100),
      league: getLeagueFromElo(Number(profile.eloRating)),
      isCurrentUser: profile.username === session?.username,
      wins,
      losses,
    };
  }).sort((a, b) => b.elo - a.elo).map((entry, index) => ({ ...entry, rank: index + 1 })), [playerProfileRows, session?.username]);
  const topThree = entries.filter((entry) => entry.rank <= 3);
  const rest = entries.filter((entry) => entry.rank > 3);
  const displayTopThree = topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : [];
  const leagueHeader = session ? getLeagueFromElo(Number(entries.find((entry) => entry.isCurrentUser)?.elo ?? 400)).split(" ")[0] : "Bronze";

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold sm:text-4xl"><span className="text-(--arena-accent)">{leagueHeader} League</span> Rankings</h2>
        <p className="mt-2 text-sm text-[rgba(241,243,252,0.58)]">Global rankings based on live Elo. Climb the ladder and prove your worth.</p>
      </div>
      {displayTopThree.length === 3 ? <div className="flex items-end justify-center gap-4"><PodiumCard rank={displayTopThree[0].rank} username={displayTopThree[0].username} elo={displayTopThree[0].elo} winRate={displayTopThree[0].winRate} league={displayTopThree[0].league} isCurrentUser={displayTopThree[0].isCurrentUser} standHeight="h-28" /><PodiumCard rank={displayTopThree[1].rank} username={displayTopThree[1].username} elo={displayTopThree[1].elo} winRate={displayTopThree[1].winRate} league={displayTopThree[1].league} isCurrentUser={displayTopThree[1].isCurrentUser} standHeight="h-36" /><PodiumCard rank={displayTopThree[2].rank} username={displayTopThree[2].username} elo={displayTopThree[2].elo} winRate={displayTopThree[2].winRate} league={displayTopThree[2].league} isCurrentUser={displayTopThree[2].isCurrentUser} standHeight="h-24" /></div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-3"><select className="h-10 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(241,243,252,0.06)] px-3 text-sm text-(--on-background) outline-none scheme-dark"><option className="bg-[rgb(15,23,42)] text-[rgb(241,245,249)]">All Leagues</option></select></div><div className="flex gap-3"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(241,243,252,0.45)]" /><input type="text" placeholder="Search player..." className="h-10 w-52 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(241,243,252,0.06)] pl-9 pr-3 text-sm text-(--on-background) outline-none placeholder:text-[rgba(241,243,252,0.45)]" /></label><button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(241,243,252,0.06)] text-[rgba(241,243,252,0.72)] transition hover:text-(--on-background)"><Filter className="h-4 w-4" /></button></div></div>
      <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)]"><div className="grid grid-cols-[60px_1fr_100px_80px_120px_80px] gap-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(241,243,252,0.05)] px-4 py-3 text-[0.68rem] font-semibold tracking-[0.12em] text-[rgba(241,243,252,0.58)] uppercase"><div>#</div><div>Player</div><div>ELO</div><div>Win %</div><div>League</div><div className="text-right">Trend</div></div><div className="divide-y divide-[rgba(255,255,255,0.06)]">{rest.map((entry) => { const trend = getTrendFromEntry(entry.wins, entry.losses); const trendColor = trend > 0 ? "text-(--signal-success)" : trend < 0 ? "text-(--signal-danger)" : "text-[rgba(241,243,252,0.52)]"; const league = getLeagueTier(entry.league); return <div key={entry.rank} className={`grid grid-cols-[60px_1fr_100px_80px_120px_80px] gap-4 px-4 py-3 transition hover:bg-[rgba(241,243,252,0.03)] ${entry.isCurrentUser ? "border-l-2 border-l-(--arena-accent) bg-[rgba(0,229,204,0.08)]" : "border-l-2 border-l-transparent"}`}><div className="flex items-center"><span className={`font-(--font-mono) text-lg ${entry.isCurrentUser ? "text-(--arena-accent)" : "text-[rgba(241,243,252,0.78)]"}`}>{entry.rank}</span></div><div className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-lg bg-[rgba(241,243,252,0.08)] text-sm font-bold ${entry.isCurrentUser ? "text-(--arena-accent)" : "text-(--on-background)"}`}>{entry.username.slice(0, 2).toUpperCase()}</div><div className="flex items-center gap-2"><span className={`text-sm font-medium ${entry.isCurrentUser ? "text-(--arena-accent)" : "text-(--on-background)"}`}>{entry.username}</span>{entry.isCurrentUser ? <span className="rounded bg-[rgba(0,229,204,0.18)] px-1.5 py-0.5 text-[10px] font-bold text-(--arena-accent)">YOU</span> : null}</div></div><div className="flex items-center"><span className="font-(--font-mono) text-sm text-(--on-background)">{entry.elo.toLocaleString()}</span></div><div className="flex items-center"><span className="text-sm text-[rgba(241,243,252,0.68)]">{entry.winRate}%</span></div><div className="flex items-center"><span className="inline-flex items-center rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] text-(--primary) uppercase">{league.tier} {league.division}</span></div><div className="flex items-center justify-end gap-1">{trend > 0 ? <TrendingUp className="h-4 w-4 text-(--signal-success)" /> : trend < 0 ? <TrendingDown className="h-4 w-4 text-(--signal-danger)" /> : <Minus className="h-4 w-4 text-[rgba(241,243,252,0.52)]" />}<span className={`text-sm font-medium ${trendColor}`}>{trend > 0 ? "+" : ""}{trend}</span></div></div>; })}</div></div>
      <div className="flex justify-center"><button type="button" className="rounded-lg border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-[rgba(241,243,252,0.72)] transition hover:border-[rgba(0,229,204,0.35)] hover:bg-[rgba(0,229,204,0.08)] hover:text-(--on-background)">Live Rankings</button></div>
    </section>
  );
}
