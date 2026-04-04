export type LeagueInfo = {
  league: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  faction: "I" | "II" | "III";
  minElo: number;
  maxElo: number;
};

const LEAGUE_SEQUENCE: LeagueInfo[] = [
  { league: "Bronze I", tier: "Bronze", faction: "I", minElo: 0, maxElo: 200 },
  { league: "Bronze II", tier: "Bronze", faction: "II", minElo: 201, maxElo: 400 },
  { league: "Bronze III", tier: "Bronze", faction: "III", minElo: 401, maxElo: 500 },
  { league: "Silver I", tier: "Silver", faction: "I", minElo: 501, maxElo: 700 },
  { league: "Silver II", tier: "Silver", faction: "II", minElo: 701, maxElo: 900 },
  { league: "Silver III", tier: "Silver", faction: "III", minElo: 901, maxElo: 1000 },
  { league: "Gold I", tier: "Gold", faction: "I", minElo: 1001, maxElo: 1200 },
  { league: "Gold II", tier: "Gold", faction: "II", minElo: 1201, maxElo: 1400 },
  { league: "Gold III", tier: "Gold", faction: "III", minElo: 1401, maxElo: 1500 },
  { league: "Diamond I", tier: "Diamond", faction: "I", minElo: 1501, maxElo: 1700 },
  { league: "Diamond II", tier: "Diamond", faction: "II", minElo: 1701, maxElo: 1900 },
  { league: "Diamond III", tier: "Diamond", faction: "III", minElo: 1901, maxElo: 2100 },
];

export function getLeagueFromElo(eloRating: number) {
  return getLeagueInfoFromElo(eloRating).league;
}

export function getLeagueInfoFromElo(eloRating: number): LeagueInfo {
  if (eloRating <= 200) {
    return LEAGUE_SEQUENCE[0];
  }

  if (eloRating <= 400) {
    return LEAGUE_SEQUENCE[1];
  }

  if (eloRating <= 500) {
    return LEAGUE_SEQUENCE[2];
  }

  if (eloRating <= 700) {
    return LEAGUE_SEQUENCE[3];
  }

  if (eloRating <= 900) {
    return LEAGUE_SEQUENCE[4];
  }

  if (eloRating <= 1000) {
    return LEAGUE_SEQUENCE[5];
  }

  if (eloRating <= 1200) {
    return LEAGUE_SEQUENCE[6];
  }

  if (eloRating <= 1400) {
    return LEAGUE_SEQUENCE[7];
  }

  if (eloRating <= 1500) {
    return LEAGUE_SEQUENCE[8];
  }

  if (eloRating <= 1700) {
    return LEAGUE_SEQUENCE[9];
  }

  if (eloRating <= 1900) {
    return LEAGUE_SEQUENCE[10];
  }

  return LEAGUE_SEQUENCE[11];
}

export function getAdjacentLeaguesForElo(eloRating: number) {
  const currentLeague = getLeagueInfoFromElo(eloRating);
  const currentIndex = LEAGUE_SEQUENCE.findIndex(
    (league) => league.league === currentLeague.league,
  );

  return {
    previousLeague: LEAGUE_SEQUENCE[Math.max(0, currentIndex - 1)] ?? currentLeague,
    currentLeague,
    nextLeague:
      LEAGUE_SEQUENCE[Math.min(LEAGUE_SEQUENCE.length - 1, currentIndex + 1)] ??
      currentLeague,
  };
}

export function getLeagueTierStyle(leagueName: string) {
  const lower = leagueName.toLowerCase();
  if (lower.includes("diamond")) {
    return "border-[oklch(0.82_0.18_175/0.35)] bg-[oklch(0.82_0.18_175/0.1)] text-[oklch(0.82_0.18_175)]";
  }
  if (lower.includes("gold")) {
    return "border-[oklch(0.78_0.15_85/0.35)] bg-[oklch(0.78_0.15_85/0.1)] text-[oklch(0.78_0.15_85)]";
  }
  if (lower.includes("silver")) {
    return "border-[oklch(0.75_0.03_230/0.35)] bg-[oklch(0.75_0.03_230/0.1)] text-[oklch(0.85_0.02_230)]";
  }
  return "border-[oklch(0.65_0.08_70/0.35)] bg-[oklch(0.65_0.08_70/0.1)] text-[oklch(0.72_0.11_70)]";
}
