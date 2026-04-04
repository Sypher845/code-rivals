import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Clock3, Share2, Swords, Target, TestTubeDiagonal } from "lucide-react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";
import { arenaActionClass, panelFrameClass, panelNoiseClass } from "../components/uiClasses";
import { tables } from "../module_bindings";

type ResultsPageProps = { userSlug?: string; username?: string };
type RoundStats = { duration: string; powerUsed: string; points: number; accuracy: number; testsPassed: number; totalTests: number };
type RoundResult = { roundNumber: number; title: string; user: RoundStats; opponent: RoundStats; verdict: "Won" | "Lost" };
type LeagueProgressConfig = { previousLeague: string; nextLeague: string; currentLeagueMinElo: number; currentLeagueMaxElo: number; previousRating: number; nextRating: number; delta: number; progressPercent: number };

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function metricBarClass(tone: "cyan" | "violet" | "blue") {
  if (tone === "violet") return "bg-[linear-gradient(90deg,rgba(217,120,255,0.95),rgba(168,85,247,0.75))]";
  if (tone === "blue") return "bg-[linear-gradient(90deg,rgba(0,112,255,0.95),rgba(96,165,250,0.78))]";
  return "bg-[linear-gradient(90deg,rgba(0,229,204,0.95),rgba(34,211,238,0.78))]";
}

function formatPowerName(powerId?: string) {
  if (!powerId) return "No Power";
  return powerId.replace(/Card$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function buildRoundStats(result?: { powerUsed: string; timeTakenSeconds: bigint; testcasesPassed: bigint; totalTestcases: bigint; pointsEarned: bigint }): RoundStats {
  if (!result) return { duration: "0:00", powerUsed: "No Power", points: 0, accuracy: 0, testsPassed: 0, totalTests: 0 };
  const testsPassed = Number(result.testcasesPassed);
  const totalTests = Number(result.totalTestcases);
  return { duration: formatDuration(Number(result.timeTakenSeconds)), powerUsed: formatPowerName(result.powerUsed), points: Number(result.pointsEarned), accuracy: totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0, testsPassed, totalTests };
}

function compareStats(left: RoundStats, right: RoundStats) {
  if (left.points !== right.points) return left.points - right.points;
  if (left.testsPassed !== right.testsPassed) return left.testsPassed - right.testsPassed;
  if (left.totalTests !== right.totalTests) return left.totalTests - right.totalTests;
  const [lm, ls] = left.duration.split(":").map(Number);
  const [rm, rs] = right.duration.split(":").map(Number);
  return rm * 60 + rs - (lm * 60 + ls);
}

export function ResultsPage({ userSlug: userSlugProp, username: usernameProp }: ResultsPageProps) {
  const { identity } = useSpacetimeDB();
  const { username: routeUsername, roomSegment } = useParams();
  const [searchParams] = useSearchParams();
  const username = usernameProp ?? routeUsername ?? "Player";
  const userSlug = userSlugProp ?? username;
  const roomId = roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? searchParams.get("room") ?? "A7X9Q2";
  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaRoomMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaRoundResultRows] = useTable(tables.arenaRoundResult);

  const roomMembers = useMemo(() => arenaRoomMemberRows.filter((member) => member.roomId === roomId), [arenaRoomMemberRows, roomId]);
  const playerMember = useMemo(() => {
    if (identity) {
      const match = roomMembers.find((member) => member.memberIdentity.isEqual(identity));
      if (match) return match;
    }
    return roomMembers.find((member) => member.memberName.toLowerCase() === username.toLowerCase()) ?? null;
  }, [identity, roomMembers, username]);
  const opponentMember = useMemo(() => {
    if (!playerMember) return roomMembers[0] ?? null;
    return roomMembers.find((member) => !member.memberIdentity.isEqual(playerMember.memberIdentity)) ?? null;
  }, [playerMember, roomMembers]);
  const opponentName = opponentMember?.memberName ?? searchParams.get("opponent") ?? "NODE_STRYKER";
  const playerName = playerMember?.memberName ?? username;

  const roundResults = useMemo<RoundResult[]>(() => {
    const roomResults = arenaRoundResultRows.filter((result) => result.roomId === roomId);
    const mine = new Map<number, (typeof roomResults)[number]>();
    const theirs = new Map<number, (typeof roomResults)[number]>();
    for (const result of roomResults) {
      const roundNumber = Number(result.roundNumber);
      if (playerMember?.memberIdentity.isEqual(result.playerIdentity)) mine.set(roundNumber, result);
      else if (opponentMember?.memberIdentity.isEqual(result.playerIdentity)) theirs.set(roundNumber, result);
    }
    const roundNumbers = Array.from(new Set([...mine.keys(), ...theirs.keys()])).sort((a, b) => a - b);
    return roundNumbers.map((roundNumber) => {
      const user = buildRoundStats(mine.get(roundNumber));
      const opponent = buildRoundStats(theirs.get(roundNumber));
      return {
        roundNumber,
        title: roundNumber === 1 ? "Round 1 / Warmup Breach" : roundNumber === 2 ? "Round 2 / Pressure Spike" : roundNumber === 3 ? "Round 3 / Final Exploit" : `Round ${roundNumber}`,
        user,
        opponent,
        verdict: compareStats(user, opponent) >= 0 ? "Won" : "Lost",
      };
    });
  }, [arenaRoundResultRows, roomId, playerMember, opponentMember]);

  const totalPoints = roundResults.reduce((sum, round) => sum + round.user.points, 0);
  const totalDurationSeconds = roundResults.reduce((sum, round) => { const [m, s] = round.user.duration.split(":").map(Number); return sum + m * 60 + s; }, 0);
  const averageAccuracy = roundResults.length > 0 ? Math.round(roundResults.reduce((sum, round) => sum + round.user.accuracy, 0) / roundResults.length) : 0;
  const totalTestsPassed = roundResults.reduce((sum, round) => sum + round.user.testsPassed, 0);
  const totalTests = roundResults.reduce((sum, round) => sum + round.user.totalTests, 0);
  const opponentTotalPoints = roundResults.reduce((sum, round) => sum + round.opponent.points, 0);
  const opponentDurationSeconds = roundResults.reduce((sum, round) => { const [m, s] = round.opponent.duration.split(":").map(Number); return sum + m * 60 + s; }, 0);
  const opponentTestsPassed = roundResults.reduce((sum, round) => sum + round.opponent.testsPassed, 0);
  const opponentTests = roundResults.reduce((sum, round) => sum + round.opponent.totalTests, 0);
  const resultLabel = roundResults.length > 0 ? (totalPoints > opponentTotalPoints || (totalPoints === opponentTotalPoints && totalTestsPassed >= opponentTestsPassed) ? "VICTORY" : "DEFEAT") : searchParams.get("result") === "loss" ? "DEFEAT" : "VICTORY";
  const isVictory = resultLabel === "VICTORY";
  const heroTintClass = isVictory ? "border-[rgba(0,229,204,0.2)] bg-[linear-gradient(180deg,rgba(0,229,204,0.2),rgba(34,211,238,0.1)_24%,rgba(9,14,22,0.92)_70%)]" : "border-[rgba(255,112,112,0.22)] bg-[linear-gradient(180deg,rgba(255,112,112,0.22),rgba(255,112,112,0.1)_24%,rgba(9,14,22,0.92)_70%)]";
  const resultTopGlow = isVictory ? "bg-[linear-gradient(180deg,rgba(0,229,204,0.2),rgba(0,229,204,0.1)_22%,rgba(8,14,22,0)_82%),radial-gradient(circle_at_50%_8%,rgba(0,229,204,0.42),transparent_34%),radial-gradient(circle_at_22%_2%,rgba(34,211,238,0.2),transparent_24%)]" : "bg-[linear-gradient(180deg,rgba(255,112,112,0.22),rgba(255,112,112,0.12)_22%,rgba(8,14,22,0)_82%),radial-gradient(circle_at_50%_8%,rgba(255,112,112,0.44),transparent_34%),radial-gradient(circle_at_22%_2%,rgba(255,112,112,0.22),transparent_24%)]";
  const opponentOutcomeTone = isVictory ? { cardBorder: "border-[rgba(124,216,124,0.18)]", cardBg: "bg-[rgba(124,216,124,0.06)]", eyebrow: "text-[rgba(124,216,124,0.88)]" } : { cardBorder: "border-[rgba(255,112,112,0.18)]", cardBg: "bg-[rgba(255,112,112,0.06)]", eyebrow: "text-[rgba(255,112,112,0.82)]" };
  const leagueProgress: LeagueProgressConfig = resultLabel === "VICTORY" ? { previousLeague: "Diamond I", nextLeague: "Diamond II", currentLeagueMinElo: 1700, currentLeagueMaxElo: 1899, previousRating: 1795, nextRating: 1847, delta: 52, progressPercent: 74 } : { previousLeague: "Diamond II", nextLeague: "Diamond I", currentLeagueMinElo: 1700, currentLeagueMaxElo: 1899, previousRating: 1795, nextRating: 1761, delta: -34, progressPercent: 38 };
  const opponentLeagueProgress: LeagueProgressConfig = isVictory ? { previousLeague: "Diamond II", nextLeague: "Diamond I", currentLeagueMinElo: 1700, currentLeagueMaxElo: 1899, previousRating: 1812, nextRating: 1776, delta: -36, progressPercent: 34 } : { previousLeague: "Diamond I", nextLeague: "Diamond II", currentLeagueMinElo: 1700, currentLeagueMaxElo: 1899, previousRating: 1812, nextRating: 1854, delta: 42, progressPercent: 71 };
  const missionLabel = isVictory ? "Mission Accomplished" : "Mission Failed";
  const heroSubtitle = isVictory ? "System breach successful. Codebase compromised." : "Countermeasures triggered. Your exploit chain collapsed.";
  const opponentSummaryLabel = isVictory ? "Opponent Defeated" : "Opponent Advanced";
  const opponentRatingLabel = isVictory ? "Opponent Rating Update" : "Opponent Rating Gain";
  const bottomQuote = isVictory ? <>You <span className="text-[rgba(217,120,255,0.96)]">key-swapped</span>{" "}them into <span className="text-(--secondary)">oblivion</span>.</> : <>They <span className="text-[rgba(255,112,112,0.96)]">outplayed</span>{" "}your exploit chain and left your <span className="text-(--secondary)">terminal smoking</span>.</>;
  return (
    <div className="relative min-h-screen overflow-hidden bg-(--arena-page-bg) px-4 py-8 text-(--on-background) sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(0,229,204,0.08),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(217,120,255,0.1),transparent_24%),radial-gradient(circle_at_54%_100%,rgba(0,112,255,0.08),transparent_26%)]" />
      <div className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] ${resultTopGlow}`} />
      <div className={`pointer-events-none absolute inset-x-4 top-0 -z-10 h-[18rem] rounded-b-[3rem] opacity-95 blur-2xl sm:inset-x-8 ${resultLabel === "VICTORY" ? "bg-[linear-gradient(180deg,rgba(0,229,204,0.16),rgba(34,211,238,0.06),transparent)]" : "bg-[linear-gradient(180deg,rgba(255,112,112,0.18),rgba(255,112,112,0.06),transparent)]"}`} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className={`relative overflow-hidden rounded-[2rem] border px-4 py-8 text-center sm:px-6 ${heroTintClass}`}>
          <div className={panelNoiseClass} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
          <div className="relative z-[1]">
            <div className="inline-flex rounded-full border border-[rgba(217,120,255,0.18)] bg-[rgba(217,120,255,0.08)] px-4 py-1.5 font-(--font-mono) text-[0.62rem] tracking-[0.28em] text-[rgba(217,120,255,0.88)] uppercase">{missionLabel}</div>
            <h1 className="mt-5 font-(--font-heading) text-[clamp(3.6rem,11vw,7rem)] leading-[0.84] tracking-[-0.05em] text-(--on-background) uppercase">{resultLabel}: <span className="bg-[linear-gradient(90deg,#e6f6ff_0%,#7dd3fc_24%,#00e5cc_56%,#4f9cff_100%)] bg-clip-text text-transparent">{playerName.replace(/\s+/g, "_").toUpperCase()}</span></h1>
            <p className="mt-4 font-(--font-mono) text-[0.82rem] tracking-[0.12em] text-[rgba(241,243,252,0.46)] uppercase">{heroSubtitle}</p>
            <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl px-4 py-4 text-left ${opponentOutcomeTone.cardBorder} ${opponentOutcomeTone.cardBg} border`}>
                <p className={`font-(--font-mono) text-[0.58rem] tracking-[0.18em] uppercase ${opponentOutcomeTone.eyebrow}`}>{opponentSummaryLabel}</p>
                <p className="mt-2 font-(--font-heading) text-3xl leading-none tracking-[-0.03em] text-(--on-background)">{opponentName}</p>
                <p className="mt-3 text-sm text-[rgba(241,243,252,0.66)]">{opponentLeagueProgress.previousLeague} to {opponentLeagueProgress.nextLeague}</p>
              </div>
              <div className={`rounded-2xl px-4 py-4 text-left sm:text-right ${opponentOutcomeTone.cardBorder} ${opponentOutcomeTone.cardBg} border`}>
                <p className="font-(--font-mono) text-[0.58rem] tracking-[0.18em] text-[rgba(241,243,252,0.42)] uppercase">{opponentRatingLabel}</p>
                <p className="mt-2 font-(--font-heading) text-3xl leading-none tracking-[-0.03em] text-(--on-background)">{opponentLeagueProgress.delta > 0 ? "+" : ""}{opponentLeagueProgress.delta} ELO</p>
                <p className="mt-3 text-sm text-[rgba(241,243,252,0.66)]">New rating: {opponentLeagueProgress.nextRating}</p>
              </div>
            </div>
            <div className={`${panelFrameClass} mt-7 w-full rounded-2xl px-4 py-4 pb-8 sm:px-5 sm:pb-9`}>
              <div className={panelNoiseClass} />
              <div className="relative z-[1]">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-left"><p className="font-(--font-mono) text-[0.58rem] tracking-[0.18em] text-[rgba(241,243,252,0.42)] uppercase">Previous League</p><p className="mt-1 font-(--font-heading) text-2xl leading-none tracking-[-0.03em] text-(--on-background)">{leagueProgress.previousLeague}</p></div>
                  <div className={`rounded-full border px-3 py-1.5 font-(--font-mono) text-[0.72rem] tracking-[0.16em] uppercase ${leagueProgress.delta >= 0 ? "border-[rgba(124,216,124,0.28)] bg-[rgba(124,216,124,0.1)] text-[var(--signal-success)]" : "border-[rgba(255,112,112,0.28)] bg-[rgba(255,112,112,0.1)] text-[var(--signal-danger)]"}`}>{leagueProgress.delta >= 0 ? "+" : ""}{leagueProgress.delta} ELO</div>
                  <div className="text-right"><p className="font-(--font-mono) text-[0.58rem] tracking-[0.18em] text-[rgba(241,243,252,0.42)] uppercase">Next League</p><p className="mt-1 font-(--font-heading) text-2xl leading-none tracking-[-0.03em] text-(--on-background)">{leagueProgress.nextLeague}</p></div>
                </div>
                <div className="mt-4">
                  <div className="relative h-5 overflow-visible">
                    <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]"><div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" /><div className={`absolute inset-y-0 left-0 rounded-full ${leagueProgress.delta >= 0 ? "bg-[linear-gradient(90deg,rgba(217,120,255,0.9),rgba(0,229,204,0.95),rgba(59,130,246,0.92))]" : "bg-[linear-gradient(90deg,rgba(255,112,112,0.92),rgba(217,120,255,0.72),rgba(255,255,255,0.16))]"}`} style={{ width: `${leagueProgress.progressPercent}%` }} /></div>
                    <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />
                    <div className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_18px_rgba(255,255,255,0.18)] ${leagueProgress.delta >= 0 ? "border-[rgba(0,229,204,0.92)] bg-[rgba(5,16,22,0.96)]" : "border-[rgba(255,112,112,0.92)] bg-[rgba(26,10,15,0.96)]"}`} style={{ left: `clamp(10px, ${leagueProgress.progressPercent}%, calc(100% - 10px))` }}><div className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${leagueProgress.delta >= 0 ? "bg-(--arena-accent)" : "bg-(--signal-danger)"}`} /></div>
                  </div>
                  <div className="relative mt-3 flex items-start justify-between text-sm">
                    <span className="font-(--font-mono) text-[rgba(241,243,252,0.42)]">{leagueProgress.currentLeagueMinElo}</span>
                    <span className="font-(--font-mono) text-[rgba(241,243,252,0.42)]">{leagueProgress.currentLeagueMaxElo}</span>
                    <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-[0.15rem] font-(--font-mono) text-[var(--signal-success)]" style={{ left: `clamp(10px, ${leagueProgress.progressPercent}%, calc(100% - 10px))` }}>{leagueProgress.nextRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-3">{[{ icon: Target, label: "Total Points Scored", value: totalPoints.toString(), tone: "cyan" as const }, { icon: Clock3, label: "Execution Time", value: formatDuration(totalDurationSeconds), tone: "violet" as const }, { icon: TestTubeDiagonal, label: "Unit Test Cases Passed", value: `${totalTestsPassed}/${totalTests}`, tone: "blue" as const }].map((metric) => { const Icon = metric.icon; return <article key={metric.label} className={`${panelFrameClass} min-h-[182px] p-5`}><div className={panelNoiseClass} /><div className="relative z-[1] flex h-full flex-col justify-between"><div className="space-y-3"><div className="grid h-11 w-11 place-items-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(241,243,252,0.04)]"><Icon className="h-5 w-5 text-(--arena-accent)" /></div><div><p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-[rgba(241,243,252,0.46)] uppercase">{metric.label}</p><p className="mt-2 font-(--font-heading) text-5xl leading-none tracking-[-0.04em] text-(--on-background)">{metric.value}</p></div></div><div className="mt-6 h-[3px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]"><div className={`h-full w-[76%] ${metricBarClass(metric.tone)}`} /></div></div></article>; })}</section>
        <section className={`${panelFrameClass} p-5 sm:p-6`}><div className={panelNoiseClass} /><div className="relative z-[1] space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-(--secondary) uppercase">Match Summary</p><h2 className="mt-1 font-(--font-heading) text-4xl leading-none tracking-[-0.04em] text-(--on-background)">All 3 rounds, one final report</h2></div><div className="grid gap-2 text-sm text-[rgba(241,243,252,0.64)] sm:text-right"><p>Room {roomId}</p><p>League update: {leagueProgress.previousLeague} to {leagueProgress.nextLeague}</p><p>New rating: {leagueProgress.nextRating}</p></div></div>
          <div className="grid gap-4 xl:grid-cols-3">{roundResults.map((round) => <article key={round.roundNumber} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,14,22,0.74)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">{round.title}</p><p className="mt-2 font-(--font-heading) text-4xl leading-none tracking-[-0.04em] text-(--on-background)">+{round.user.points}</p></div><span className="rounded-full border border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)] px-2.5 py-1 font-(--font-mono) text-[0.56rem] tracking-[0.12em] text-(--secondary) uppercase">{round.verdict}</span></div><div className="mt-4 flex justify-end"><span className="inline-flex items-center gap-1 font-(--font-mono) text-[0.58rem] tracking-[0.14em] text-[rgba(241,243,252,0.42)] uppercase"><Swords className="h-3.5 w-3.5" />User vs Opponent</span></div><div className="mt-5 grid gap-3">{[{ label: "Duration", userValue: round.user.duration, opponentValue: round.opponent.duration }, { label: "Power Used", userValue: round.user.powerUsed, opponentValue: round.opponent.powerUsed }, { label: "Accuracy", userValue: `${round.user.accuracy}%`, opponentValue: `${round.opponent.accuracy}%` }, { label: "Tests Passed", userValue: `${round.user.testsPassed}/${round.user.totalTests}`, opponentValue: `${round.opponent.testsPassed}/${round.opponent.totalTests}` }].map((item) => <div key={item.label} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(9,14,22,0.74)] px-3 py-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">{item.label}</span></div><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-[rgba(0,229,204,0.14)] bg-[rgba(0,229,204,0.05)] px-3 py-2"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-(--secondary) uppercase">{playerName}</p><p className="mt-1 text-sm text-(--on-background)">{item.userValue}</p></div><div className="rounded-lg border border-[rgba(255,112,112,0.14)] bg-[rgba(255,112,112,0.05)] px-3 py-2"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-[var(--signal-danger)] uppercase">{opponentName}</p><p className="mt-1 text-sm text-(--on-background)">{item.opponentValue}</p></div></div></div>)}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(9,14,22,0.74)] px-3 py-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">Used Against You</span></div><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-[rgba(0,229,204,0.14)] bg-[rgba(0,229,204,0.05)] px-3 py-2"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-(--secondary) uppercase">{playerName}</p><p className="mt-1 text-sm text-(--on-background)">{round.opponent.powerUsed}</p></div><div className="rounded-lg border border-[rgba(255,112,112,0.14)] bg-[rgba(255,112,112,0.05)] px-3 py-2"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-[var(--signal-danger)] uppercase">{opponentName}</p><p className="mt-1 text-sm text-(--on-background)">{round.user.powerUsed}</p></div></div></div>
          </div></article>)}</div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,12,18,0.72)] p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-(--secondary) uppercase">Final Duel Metrics</p><span className="font-(--font-mono) text-[0.58rem] tracking-[0.14em] text-[rgba(241,243,252,0.42)] uppercase">User vs Opponent</span></div><div className="grid gap-3 md:grid-cols-3">{[{ label: "Total Points", userValue: totalPoints.toString(), opponentValue: opponentTotalPoints.toString() }, { label: "Execution Time", userValue: formatDuration(totalDurationSeconds), opponentValue: formatDuration(opponentDurationSeconds) }, { label: "Unit Tests Passed", userValue: `${totalTestsPassed}/${totalTests}`, opponentValue: `${opponentTestsPassed}/${opponentTests}` }].map((metric) => <article key={metric.label} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,14,22,0.74)] p-4"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">{metric.label}</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-lg border border-[rgba(0,229,204,0.14)] bg-[rgba(0,229,204,0.05)] px-3 py-2"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-(--secondary) uppercase">{playerName}</p><p className="mt-1 text-sm text-(--on-background)">{metric.userValue}</p></div><div className="rounded-lg border border-[rgba(255,112,112,0.14)] bg-[rgba(255,112,112,0.05)] px-3 py-2"><p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-[var(--signal-danger)] uppercase">{opponentName}</p><p className="mt-1 text-sm text-(--on-background)">{metric.opponentValue}</p></div></div></article>)}</div></div>
        </div></section>
        <section className="px-2 py-2 text-center"><p className="mx-auto max-w-4xl text-[clamp(1.8rem,4vw,3rem)] font-semibold italic leading-tight tracking-[-0.04em] text-(--on-background)">{bottomQuote}</p><div className="mt-7 flex flex-wrap items-center justify-center gap-3"><Link to={`/${encodeURIComponent(userSlug)}`} className={`${arenaActionClass} min-w-[13rem]`}>Continue</Link><button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold tracking-[0.08em] text-(--on-background) uppercase transition hover:border-[rgba(0,229,204,0.35)] hover:bg-[rgba(0,229,204,0.08)]"><Share2 className="h-4 w-4" />Share Log</button></div></section>
      </div>
    </div>
  );
}
