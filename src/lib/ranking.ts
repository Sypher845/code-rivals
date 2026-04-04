export type LeagueInfo = {
  league: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  faction: "I" | "II" | "III";
  minElo: number;
  maxElo: number;
};

export function getLeagueFromElo(eloRating: number) {
  return getLeagueInfoFromElo(eloRating).league;
}

export function getLeagueInfoFromElo(eloRating: number): LeagueInfo {
  if (eloRating <= 200) {
    return { league: "Bronze I", tier: "Bronze", faction: "I", minElo: 0, maxElo: 200 };
  }

  if (eloRating <= 400) {
    return { league: "Bronze II", tier: "Bronze", faction: "II", minElo: 201, maxElo: 400 };
  }

  if (eloRating <= 500) {
    return { league: "Bronze III", tier: "Bronze", faction: "III", minElo: 401, maxElo: 500 };
  }

  if (eloRating <= 700) {
    return { league: "Silver I", tier: "Silver", faction: "I", minElo: 501, maxElo: 700 };
  }

  if (eloRating <= 900) {
    return { league: "Silver II", tier: "Silver", faction: "II", minElo: 701, maxElo: 900 };
  }

  if (eloRating <= 1000) {
    return { league: "Silver III", tier: "Silver", faction: "III", minElo: 901, maxElo: 1000 };
  }

  if (eloRating <= 1200) {
    return { league: "Gold I", tier: "Gold", faction: "I", minElo: 1001, maxElo: 1200 };
  }

  if (eloRating <= 1400) {
    return { league: "Gold II", tier: "Gold", faction: "II", minElo: 1201, maxElo: 1400 };
  }

  if (eloRating <= 1500) {
    return { league: "Gold III", tier: "Gold", faction: "III", minElo: 1401, maxElo: 1500 };
  }

  if (eloRating <= 1700) {
    return { league: "Diamond I", tier: "Diamond", faction: "I", minElo: 1501, maxElo: 1700 };
  }

  if (eloRating <= 1900) {
    return { league: "Diamond II", tier: "Diamond", faction: "II", minElo: 1701, maxElo: 1900 };
  }

  return { league: "Diamond III", tier: "Diamond", faction: "III", minElo: 1901, maxElo: 2100 };
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
