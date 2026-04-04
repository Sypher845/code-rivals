import { ChevronDown, Minus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";
import { getLeagueFromElo, getLeagueTierStyle } from "../../lib/ranking";
import { tables } from "../../module_bindings";

type LeagueFilter = "All Leagues" | "Bronze" | "Silver" | "Gold" | "Diamond";

type LeaderboardEntry = {
  rank: number;
  username: string;
  elo: number;
  winRate: number;
  league: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  isCurrentUser: boolean;
  rankChange: number;
};

function getLeagueTier(league: string) {
  const [tier = "Diamond", division = "II"] = league.split(" ");
  return { tier, division };
}

function PodiumCard({
  rank,
  username,
  elo,
  winRate,
  league,
  isCurrentUser,
  standHeight,
}: {
  rank: number;
  username: string;
  elo: number;
  winRate: number;
  league: string;
  isCurrentUser?: boolean;
  standHeight: string;
}) {
  const badgeLabel: Record<number, string> = { 1: "#1", 2: "#2", 3: "#3" };
  const avatarTone =
    rank === 1
      ? "bg-[rgba(250,204,21,0.2)] text-yellow-300"
      : rank === 2
        ? "bg-[rgba(209,213,219,0.16)] text-slate-200"
        : "bg-[rgba(245,158,11,0.18)] text-amber-500";
  const standTone =
    rank === 1
      ? "border-t-yellow-300/50 from-[rgba(250,204,21,0.3)] to-[rgba(250,204,21,0.1)]"
      : rank === 2
        ? "border-t-slate-300/40 from-[rgba(209,213,219,0.24)] to-[rgba(209,213,219,0.08)]"
        : "border-t-amber-500/50 from-[rgba(245,158,11,0.24)] to-[rgba(245,158,11,0.08)]";

  return (
    <article className="group flex flex-col items-center">
      <div
        className={`mb-3 w-32 rounded-xl border bg-[rgba(6,11,18,0.72)] p-4 text-center transition sm:w-40 ${
          isCurrentUser
            ? "border-(--arena-accent)/50 bg-[rgba(0,229,204,0.08)]"
            : "border-[rgba(255,255,255,0.08)]"
        }`}
      >
        <div className="mb-2 text-sm font-bold tracking-[0.12em] text-[rgba(241,243,252,0.6)]">
          {badgeLabel[rank]}
        </div>
        <div
          className={`mx-auto mb-2 grid h-14 w-14 place-items-center rounded-xl text-lg font-bold ${avatarTone}`}
        >
          {username.slice(0, 2).toUpperCase()}
        </div>
        <p
          className={`truncate text-sm font-semibold ${
            isCurrentUser ? "text-(--arena-accent)" : "text-(--on-background)"
          }`}
        >
          {username}
        </p>
        <p className="text-lg font-bold text-(--arena-accent)">
          {elo.toLocaleString()}
        </p>
        <p className="text-xs text-[rgba(241,243,252,0.56)]">{winRate}% WR</p>
        <div
          className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase ${getLeagueTierStyle(league)}`}
        >
          {league}
        </div>
      </div>
      <div
        className={`flex w-full items-end justify-center rounded-t-lg border-t-2 bg-gradient-to-t ${standTone} ${standHeight}`}
      >
        <span className="mb-2 text-xl font-bold text-[rgba(241,243,252,0.45)]">
          {rank}
        </span>
      </div>
    </article>
  );
}

export function LeaderboardTab() {
  const { identity } = useSpacetimeDB();
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("All Leagues");
  const [sessionRows] = useTable(tables.authSession);
  const [playerProfileRows] = useTable(tables.playerProfile);
  const [matchSummaryRows] = useTable(tables.arenaMatchSummary);

  const session = sessionRows.find((row) =>
    identity ? row.sessionIdentity.isEqual(identity) : false,
  );

  const latestDeltaByPlayer = useMemo(() => {
    const byPlayer = new Map<string, number>();

    [...matchSummaryRows]
      .sort(
        (a, b) =>
          Number(b.createdAt.microsSinceUnixEpoch - a.createdAt.microsSinceUnixEpoch),
      )
      .forEach((match) => {
        if (!byPlayer.has(match.playerUsernameKey)) {
          byPlayer.set(match.playerUsernameKey, Number(match.deltaRating));
        }
      });

    return byPlayer;
  }, [matchSummaryRows]);

  const rankedEntries = useMemo(() => {
    const baseEntries = playerProfileRows.map((profile) => {
        const wins = Number(profile.wins);
        const losses = Number(profile.losses);
        const total = wins + losses;
        const elo = Number(profile.eloRating);
        const league = getLeagueFromElo(elo);
        const { tier } = getLeagueTier(league);

        return {
          usernameKey: profile.usernameKey,
          username: profile.username,
          elo,
          previousElo: elo - (latestDeltaByPlayer.get(profile.usernameKey) ?? 0),
          winRate: total === 0 ? 0 : Math.round((wins / total) * 100),
          league,
          tier: tier as LeaderboardEntry["tier"],
          isCurrentUser: profile.username === session?.username,
        };
      });

    const currentRanks = new Map(
      [...baseEntries]
        .sort((a, b) => {
          if (b.elo !== a.elo) {
            return b.elo - a.elo;
          }

          return a.username.localeCompare(b.username);
        })
        .map((entry, index) => [entry.usernameKey, index + 1]),
    );

    const previousRanks = new Map(
      [...baseEntries]
        .sort((a, b) => {
          if (b.previousElo !== a.previousElo) {
            return b.previousElo - a.previousElo;
          }

          return a.username.localeCompare(b.username);
        })
        .map((entry, index) => [entry.usernameKey, index + 1]),
    );

    return baseEntries
      .sort((a, b) => {
        if (b.elo !== a.elo) {
          return b.elo - a.elo;
        }

        return a.username.localeCompare(b.username);
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        rankChange:
          (previousRanks.get(entry.usernameKey) ?? index + 1) -
          (currentRanks.get(entry.usernameKey) ?? index + 1),
      }));
  }, [latestDeltaByPlayer, playerProfileRows, session?.username]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return rankedEntries.filter((entry) => {
      const matchesLeague =
        leagueFilter === "All Leagues" || entry.tier === leagueFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        entry.username.toLowerCase().includes(normalizedQuery);

      return matchesLeague && matchesSearch;
    });
  }, [leagueFilter, rankedEntries, searchQuery]);

  const topThree = filteredEntries.slice(0, 3);
  const rest = filteredEntries.slice(3);
  const displayTopThree =
    topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : [];
  const leagueHeader = leagueFilter === "All Leagues" ? "All Leagues" : leagueFilter;

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          <span className="text-(--arena-accent)">
            {leagueHeader === "All Leagues" ? "All Leagues" : `${leagueHeader} League`}
          </span>{" "}
          Rankings
        </h2>
        <p className="mt-2 text-sm text-[rgba(241,243,252,0.58)]">
          Global rankings based on live Elo. Climb the ladder and prove your worth.
        </p>
      </div>

      {displayTopThree.length === 3 ? (
        <div className="flex items-end justify-center gap-4">
          <PodiumCard
            rank={displayTopThree[0].rank}
            username={displayTopThree[0].username}
            elo={displayTopThree[0].elo}
            winRate={displayTopThree[0].winRate}
            league={displayTopThree[0].league}
            isCurrentUser={displayTopThree[0].isCurrentUser}
            standHeight="h-28"
          />
          <PodiumCard
            rank={displayTopThree[1].rank}
            username={displayTopThree[1].username}
            elo={displayTopThree[1].elo}
            winRate={displayTopThree[1].winRate}
            league={displayTopThree[1].league}
            isCurrentUser={displayTopThree[1].isCurrentUser}
            standHeight="h-36"
          />
          <PodiumCard
            rank={displayTopThree[2].rank}
            username={displayTopThree[2].username}
            elo={displayTopThree[2].elo}
            winRate={displayTopThree[2].winRate}
            league={displayTopThree[2].league}
            isCurrentUser={displayTopThree[2].isCurrentUser}
            standHeight="h-24"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="group relative inline-flex h-11 min-w-[11.5rem] items-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(241,243,252,0.08),rgba(241,243,252,0.03))] px-3 shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition focus-within:border-[rgba(0,229,204,0.42)] focus-within:bg-[linear-gradient(180deg,rgba(0,229,204,0.12),rgba(241,243,252,0.04))] hover:border-[rgba(255,255,255,0.18)]">
            <span className="pointer-events-none mr-8 text-sm font-medium text-(--on-background)">
              {leagueFilter}
            </span>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(241,243,252,0.56)] transition group-focus-within:text-(--arena-accent)" />
            <select
              value={leagueFilter}
              onChange={(event) => setLeagueFilter(event.target.value as LeagueFilter)}
              className="absolute inset-0 cursor-pointer appearance-none bg-transparent px-3 text-sm text-transparent outline-none scheme-dark"
            >
              <option
                value="All Leagues"
                className="bg-[rgb(15,23,42)] text-[rgb(241,245,249)]"
              >
                All Leagues
              </option>
              <option
                value="Bronze"
                className="bg-[rgb(15,23,42)] text-[rgb(241,245,249)]"
              >
                Bronze
              </option>
              <option
                value="Silver"
                className="bg-[rgb(15,23,42)] text-[rgb(241,245,249)]"
              >
                Silver
              </option>
              <option
                value="Gold"
                className="bg-[rgb(15,23,42)] text-[rgb(241,245,249)]"
              >
                Gold
              </option>
              <option
                value="Diamond"
                className="bg-[rgb(15,23,42)] text-[rgb(241,245,249)]"
              >
                Diamond
              </option>
            </select>
          </label>
        </div>

        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(241,243,252,0.45)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search player..."
            className="h-10 w-52 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(241,243,252,0.06)] pl-9 pr-3 text-sm text-(--on-background) outline-none placeholder:text-[rgba(241,243,252,0.45)]"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)]">
        <div className="grid grid-cols-[60px_1fr_100px_80px_120px_80px] gap-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(241,243,252,0.05)] px-4 py-3 text-[0.68rem] font-semibold tracking-[0.12em] text-[rgba(241,243,252,0.58)] uppercase">
          <div>#</div>
          <div>Player</div>
          <div>ELO</div>
          <div>Win %</div>
          <div>League</div>
          <div className="text-right">Trend</div>
        </div>

        <div className="divide-y divide-[rgba(255,255,255,0.06)]">
          {filteredEntries.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[rgba(241,243,252,0.56)]">
              No players match the current leaderboard filters.
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const trend = entry.rankChange;
              const trendColor =
                trend > 0
                  ? "text-(--signal-success)"
                  : trend < 0
                    ? "text-(--signal-danger)"
                    : "text-[rgba(241,243,252,0.52)]";
              const league = getLeagueTier(entry.league);

              return (
                <div
                  key={entry.username}
                  className={`grid grid-cols-[60px_1fr_100px_80px_120px_80px] gap-4 px-4 py-3 transition hover:bg-[rgba(241,243,252,0.03)] ${
                    entry.isCurrentUser
                      ? "border-l-2 border-l-(--arena-accent) bg-[rgba(0,229,204,0.08)]"
                      : "border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`font-(--font-mono) text-lg ${
                        entry.isCurrentUser
                          ? "text-(--arena-accent)"
                          : "text-[rgba(241,243,252,0.78)]"
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-lg bg-[rgba(241,243,252,0.08)] text-sm font-bold ${
                        entry.isCurrentUser
                          ? "text-(--arena-accent)"
                          : "text-(--on-background)"
                      }`}
                    >
                      {entry.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          entry.isCurrentUser
                            ? "text-(--arena-accent)"
                            : "text-(--on-background)"
                        }`}
                      >
                        {entry.username}
                      </span>
                      {entry.isCurrentUser ? (
                        <span className="rounded bg-[rgba(0,229,204,0.18)] px-1.5 py-0.5 text-[10px] font-bold text-(--arena-accent)">
                          YOU
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="font-(--font-mono) text-sm text-(--on-background)">
                      {entry.elo.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm text-[rgba(241,243,252,0.68)]">
                      {entry.winRate}%
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase ${getLeagueTierStyle(entry.league)}`}
                    >
                      {league.tier} {league.division}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {trend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-(--signal-success)" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-4 w-4 text-(--signal-danger)" />
                    ) : (
                      <Minus className="h-4 w-4 text-[rgba(241,243,252,0.52)]" />
                    )}
                    <span className={`text-sm font-medium ${trendColor}`}>
                      {trend > 0 ? "+" : ""}
                      {trend}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
