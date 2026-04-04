import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock3,
  Share2,
  Swords,
  Target,
  TestTubeDiagonal,
} from "lucide-react";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import {
  arenaActionClass,
  panelFrameClass,
  panelNoiseClass,
} from "../components/uiClasses";
import { getLeagueInfoFromElo } from "../lib/ranking";
import { reducers, tables } from "../module_bindings";

type RoundResult = {
  roundNumber: number;
  title: string;
  user: {
    duration: string;
    powerUsed: string;
    points: number;
    accuracy: number;
    testsPassed: number;
    totalTests: number;
  };
  opponent: {
    duration: string;
    powerUsed: string;
    points: number;
    accuracy: number;
    testsPassed: number;
    totalTests: number;
  };
  verdict: "Won" | "Lost";
};

type LeagueProgressConfig = {
  previousLeague: string;
  nextLeague: string;
  currentLeagueMinElo: number;
  currentLeagueMaxElo: number;
  previousRating: number;
  nextRating: number;
  delta: number;
  progressPercent: number;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseDurationToSeconds(duration: string) {
  const [minutes = 0, seconds = 0] = duration.split(":").map(Number);
  return minutes * 60 + seconds;
}

function formatPowerName(powerId?: string) {
  if (!powerId) return "No Power";
  return powerId.replace(/Card$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function metricBarClass(tone: "cyan" | "violet" | "blue") {
  if (tone === "violet") {
    return "bg-[linear-gradient(90deg,rgba(217,120,255,0.95),rgba(168,85,247,0.75))]";
  }

  if (tone === "blue") {
    return "bg-[linear-gradient(90deg,rgba(0,112,255,0.95),rgba(96,165,250,0.78))]";
  }

  return "bg-[linear-gradient(90deg,rgba(0,229,204,0.95),rgba(34,211,238,0.78))]";
}

function getLeagueProgress(
  previousRating: number,
  nextRating: number,
): LeagueProgressConfig {
  const previousLeagueInfo = getLeagueInfoFromElo(previousRating);
  const nextLeagueInfo = getLeagueInfoFromElo(nextRating);
  const currentLeagueMinElo = nextLeagueInfo.minElo;
  const currentLeagueMaxElo = nextLeagueInfo.maxElo;
  const range = Math.max(1, currentLeagueMaxElo - currentLeagueMinElo);
  const progressPercent = Math.max(
    4,
    Math.min(
      96,
      Math.round(((nextRating - currentLeagueMinElo) / range) * 100),
    ),
  );

  return {
    previousLeague: previousLeagueInfo.league,
    nextLeague: nextLeagueInfo.league,
    currentLeagueMinElo,
    currentLeagueMaxElo,
    previousRating,
    nextRating,
    delta: nextRating - previousRating,
    progressPercent,
  };
}

function getRoundTitle(roundNumber: number) {
  if (roundNumber === 1) return "Round 1 / Warmup Breach";
  if (roundNumber === 2) return "Round 2 / Pressure Spike";
  if (roundNumber === 3) return "Round 3 / Final Exploit";
  return `Round ${roundNumber}`;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { identity } = useSpacetimeDB();
  const { username = "player", roomSegment } = useParams();
  const roomId = roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? "";
  const [isContinuing, setIsContinuing] = useState(false);
  const deleteArenaRoom = useReducer(reducers.deleteArenaRoom);

  const [sessionRows] = useTable(tables.authSession);
  const [playerProfileRows] = useTable(tables.playerProfile);
  const [matchSummaryRows] = useTable(tables.arenaMatchSummary);
  const [roundResultRows] = useTable(tables.arenaRoundResult);
  const [roomMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaRoomRows] = useTable(tables.arenaRoom);

  const session = sessionRows.find((row) =>
    identity ? row.sessionIdentity.isEqual(identity) : false,
  );
  const playerName = session?.username ?? username;

  const roomMembers = roomMemberRows.filter((row) => row.roomId === roomId);
  const opponentName =
    roomMembers.find((row) => row.memberName !== playerName)?.memberName ??
    "Opponent";

  const playerProfile = playerProfileRows.find(
    (row) => row.username === playerName,
  );
  const arenaRoom = arenaRoomRows.find((row) => row.roomId === roomId);
  const opponentProfile = playerProfileRows.find(
    (row) => row.username === opponentName,
  );

  const playerSummary = matchSummaryRows.find(
    (row) => row.roomId === roomId && row.playerUsername === playerName,
  );
  const opponentSummary = matchSummaryRows.find(
    (row) => row.roomId === roomId && row.playerUsername === opponentName,
  );

  const roundResults = useMemo<RoundResult[]>(() => {
    const myRows = new Map<number, (typeof roundResultRows)[number]>();
    const opponentRows = new Map<number, (typeof roundResultRows)[number]>();

    for (const row of roundResultRows) {
      if (row.roomId !== roomId) continue;

      const roundNumber = Number(row.roundNumber);
      const member = roomMembers.find((candidate) =>
        candidate.memberIdentity.isEqual(row.playerIdentity),
      );

      if (member?.memberName === playerName) {
        myRows.set(roundNumber, row);
      }

      if (member?.memberName === opponentName) {
        opponentRows.set(roundNumber, row);
      }
    }

    return Array.from(new Set([...myRows.keys(), ...opponentRows.keys()]))
      .sort((left, right) => left - right)
      .map((roundNumber) => {
        const mine = myRows.get(roundNumber);
        const theirs = opponentRows.get(roundNumber);
        const myPassed = Number(mine?.testcasesPassed ?? 0n);
        const myTotal = Number(mine?.totalTestcases ?? 0n);
        const theirPassed = Number(theirs?.testcasesPassed ?? 0n);
        const theirTotal = Number(theirs?.totalTestcases ?? 0n);

        const user = {
          duration: formatDuration(Number(mine?.timeTakenSeconds ?? 0n)),
          powerUsed: formatPowerName(mine?.powerUsed),
          points: Number(mine?.pointsEarned ?? 0n),
          accuracy: myTotal > 0 ? Math.round((myPassed / myTotal) * 100) : 0,
          testsPassed: myPassed,
          totalTests: myTotal,
        };

        const opponent = {
          duration: formatDuration(Number(theirs?.timeTakenSeconds ?? 0n)),
          powerUsed: formatPowerName(theirs?.powerUsed),
          points: Number(theirs?.pointsEarned ?? 0n),
          accuracy:
            theirTotal > 0 ? Math.round((theirPassed / theirTotal) * 100) : 0,
          testsPassed: theirPassed,
          totalTests: theirTotal,
        };

        return {
          roundNumber,
          title: getRoundTitle(roundNumber),
          user,
          opponent,
          verdict: user.points >= opponent.points ? "Won" : "Lost",
        };
      });
  }, [opponentName, playerName, roomId, roomMembers, roundResultRows]);

  const totalPoints = roundResults.reduce(
    (sum, round) => sum + round.user.points,
    0,
  );
  const totalDurationSeconds = roundResults.reduce(
    (sum, round) => sum + parseDurationToSeconds(round.user.duration),
    0,
  );
  const totalTestsPassed = roundResults.reduce(
    (sum, round) => sum + round.user.testsPassed,
    0,
  );
  const totalTests = roundResults.reduce(
    (sum, round) => sum + round.user.totalTests,
    0,
  );
  const opponentTotalPoints = roundResults.reduce(
    (sum, round) => sum + round.opponent.points,
    0,
  );
  const opponentDurationSeconds = roundResults.reduce(
    (sum, round) => sum + parseDurationToSeconds(round.opponent.duration),
    0,
  );
  const opponentTestsPassed = roundResults.reduce(
    (sum, round) => sum + round.opponent.testsPassed,
    0,
  );
  const opponentTests = roundResults.reduce(
    (sum, round) => sum + round.opponent.totalTests,
    0,
  );

  const resultLabel =
    playerSummary?.winner === "user" || totalPoints >= opponentTotalPoints
      ? "VICTORY"
      : "DEFEAT";
  const isVictory = resultLabel === "VICTORY";

  const heroTintClass = isVictory
    ? "border-[rgba(0,229,204,0.2)] bg-[linear-gradient(180deg,rgba(0,229,204,0.2),rgba(34,211,238,0.1)_24%,rgba(9,14,22,0.92)_70%)]"
    : "border-[rgba(255,112,112,0.22)] bg-[linear-gradient(180deg,rgba(255,112,112,0.22),rgba(255,112,112,0.1)_24%,rgba(9,14,22,0.92)_70%)]";
  const resultTopGlow = isVictory
    ? "bg-[linear-gradient(180deg,rgba(0,229,204,0.2),rgba(0,229,204,0.1)_22%,rgba(8,14,22,0)_82%),radial-gradient(circle_at_50%_8%,rgba(0,229,204,0.42),transparent_34%),radial-gradient(circle_at_22%_2%,rgba(34,211,238,0.2),transparent_24%)]"
    : "bg-[linear-gradient(180deg,rgba(255,112,112,0.22),rgba(255,112,112,0.12)_22%,rgba(8,14,22,0)_82%),radial-gradient(circle_at_50%_8%,rgba(255,112,112,0.44),transparent_34%),radial-gradient(circle_at_22%_2%,rgba(255,112,112,0.22),transparent_24%)]";
  const opponentOutcomeTone = isVictory
    ? {
        cardBorder: "border-[rgba(124,216,124,0.18)]",
        cardBg: "bg-[rgba(124,216,124,0.06)]",
        eyebrow: "text-[rgba(124,216,124,0.88)]",
      }
    : {
        cardBorder: "border-[rgba(255,112,112,0.18)]",
        cardBg: "bg-[rgba(255,112,112,0.06)]",
        eyebrow: "text-[rgba(255,112,112,0.82)]",
      };

  const leagueProgress = getLeagueProgress(
    Number(playerSummary?.playerEloBefore ?? playerProfile?.eloRating ?? 400n),
    Number(playerSummary?.playerEloAfter ?? playerProfile?.eloRating ?? 400n),
  );
  const opponentLeagueProgress = getLeagueProgress(
    Number(
      opponentSummary?.playerEloBefore ?? opponentProfile?.eloRating ?? 400n,
    ),
    Number(
      opponentSummary?.playerEloAfter ?? opponentProfile?.eloRating ?? 400n,
    ),
  );

  const missionLabel = isVictory ? "Mission Accomplished" : "Mission Failed";
  const heroSubtitle = isVictory
    ? "System breach successful. Codebase compromised."
    : "Countermeasures triggered. Your exploit chain collapsed.";
  const opponentSummaryLabel = isVictory
    ? "Opponent Defeated"
    : "Opponent Advanced";
  const opponentRatingLabel = isVictory
    ? "Opponent Rating Update"
    : "Opponent Rating Gain";
  const bottomQuote = isVictory ? (
    <>
      You{" "}
      <span className="text-[rgba(217,120,255,0.96)]">key-swapped</span> them
      into <span className="text-(--secondary)">oblivion</span>.
    </>
  ) : (
    <>
      They <span className="text-[rgba(255,112,112,0.96)]">outplayed</span>{" "}
      your exploit chain and left your{" "}
      <span className="text-(--secondary)">terminal smoking</span>.
    </>
  );
  const isRoomCreator = arenaRoom?.creatorName === playerName;

  async function handleContinue() {
    if (isContinuing) {
      return;
    }

    try {
      setIsContinuing(true);

      if (isRoomCreator && arenaRoom) {
        await deleteArenaRoom({ roomId });
      }

      navigate(`/${encodeURIComponent(playerName)}`);
    } finally {
      setIsContinuing(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--arena-page-bg) px-4 py-8 text-(--on-background) sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(0,229,204,0.08),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(217,120,255,0.1),transparent_24%),radial-gradient(circle_at_54%_100%,rgba(0,112,255,0.08),transparent_26%)]" />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] ${resultTopGlow}`}
      />
      <div
        className={`pointer-events-none absolute inset-x-4 top-0 -z-10 h-[18rem] rounded-b-[3rem] opacity-95 blur-2xl sm:inset-x-8 ${
          resultLabel === "VICTORY"
            ? "bg-[linear-gradient(180deg,rgba(0,229,204,0.16),rgba(34,211,238,0.06),transparent)]"
            : "bg-[linear-gradient(180deg,rgba(255,112,112,0.18),rgba(255,112,112,0.06),transparent)]"
        }`}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header
          className={`relative overflow-hidden rounded-[2rem] border px-4 py-8 text-center sm:px-6 ${heroTintClass}`}
        >
          <div className={panelNoiseClass} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />

          <div className="relative z-[1]">
            <div className="inline-flex rounded-full border border-[rgba(217,120,255,0.18)] bg-[rgba(217,120,255,0.08)] px-4 py-1.5 font-(--font-mono) text-[0.62rem] tracking-[0.28em] text-[rgba(217,120,255,0.88)] uppercase">
              {missionLabel}
            </div>

            <h1 className="mt-5 font-(--font-heading) text-[clamp(3.6rem,11vw,7rem)] leading-[0.84] tracking-[-0.05em] text-(--on-background) uppercase">
              {resultLabel}:{" "}
              <span className="bg-[linear-gradient(90deg,#e6f6ff_0%,#7dd3fc_24%,#00e5cc_56%,#4f9cff_100%)] bg-clip-text text-transparent">
                {playerName.replace(/\s+/g, "_").toUpperCase()}
              </span>
            </h1>

            <p className="mt-4 font-(--font-mono) text-[0.82rem] tracking-[0.12em] text-[rgba(241,243,252,0.46)] uppercase">
              {heroSubtitle}
            </p>

            <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
              <div
                className={`rounded-2xl px-4 py-4 text-left ${opponentOutcomeTone.cardBorder} ${opponentOutcomeTone.cardBg} border`}
              >
                <p
                  className={`font-(--font-mono) text-[0.58rem] tracking-[0.18em] uppercase ${opponentOutcomeTone.eyebrow}`}
                >
                  {opponentSummaryLabel}
                </p>
                <p className="mt-2 font-(--font-heading) text-3xl leading-none tracking-[-0.03em] text-(--on-background)">
                  {opponentName}
                </p>
                <p className="mt-3 text-sm text-[rgba(241,243,252,0.66)]">
                  {opponentLeagueProgress.previousLeague} to{" "}
                  {opponentLeagueProgress.nextLeague}
                </p>
              </div>

              <div
                className={`rounded-2xl px-4 py-4 text-left sm:text-right ${opponentOutcomeTone.cardBorder} ${opponentOutcomeTone.cardBg} border`}
              >
                <p className="font-(--font-mono) text-[0.58rem] tracking-[0.18em] text-[rgba(241,243,252,0.42)] uppercase">
                  {opponentRatingLabel}
                </p>
                <p className="mt-2 font-(--font-heading) text-3xl leading-none tracking-[-0.03em] text-(--on-background)">
                  {opponentLeagueProgress.delta > 0 ? "+" : ""}
                  {opponentLeagueProgress.delta} ELO
                </p>
                <p className="mt-3 text-sm text-[rgba(241,243,252,0.66)]">
                  New rating: {opponentLeagueProgress.nextRating}
                </p>
              </div>
            </div>

            <div
              className={`${panelFrameClass} mt-7 w-full rounded-2xl px-4 py-4 pb-8 sm:px-5 sm:pb-9`}
            >
              <div className={panelNoiseClass} />

              <div className="relative z-[1]">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="font-(--font-mono) text-[0.58rem] tracking-[0.18em] text-[rgba(241,243,252,0.42)] uppercase">
                      Previous League
                    </p>
                    <p className="mt-1 font-(--font-heading) text-2xl leading-none tracking-[-0.03em] text-(--on-background)">
                      {leagueProgress.previousLeague}
                    </p>
                  </div>

                  <div
                    className={`rounded-full border px-3 py-1.5 font-(--font-mono) text-[0.72rem] tracking-[0.16em] uppercase ${
                      leagueProgress.delta >= 0
                        ? "border-[rgba(124,216,124,0.28)] bg-[rgba(124,216,124,0.1)] text-[var(--signal-success)]"
                        : "border-[rgba(255,112,112,0.28)] bg-[rgba(255,112,112,0.1)] text-[var(--signal-danger)]"
                    }`}
                  >
                    {leagueProgress.delta >= 0 ? "+" : ""}
                    {leagueProgress.delta} ELO
                  </div>

                  <div className="text-right">
                    <p className="font-(--font-mono) text-[0.58rem] tracking-[0.18em] text-[rgba(241,243,252,0.42)] uppercase">
                      Next League
                    </p>
                    <p className="mt-1 font-(--font-heading) text-2xl leading-none tracking-[-0.03em] text-(--on-background)">
                      {leagueProgress.nextLeague}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="relative h-5 overflow-visible">
                    <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                      <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          leagueProgress.delta >= 0
                            ? "bg-[linear-gradient(90deg,rgba(217,120,255,0.9),rgba(0,229,204,0.95),rgba(59,130,246,0.92))]"
                            : "bg-[linear-gradient(90deg,rgba(255,112,112,0.92),rgba(217,120,255,0.72),rgba(255,255,255,0.16))]"
                        }`}
                        style={{ width: `${leagueProgress.progressPercent}%` }}
                      />
                    </div>

                    <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />

                    <div
                      className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_18px_rgba(255,255,255,0.18)] ${
                        leagueProgress.delta >= 0
                          ? "border-[rgba(0,229,204,0.92)] bg-[rgba(5,16,22,0.96)]"
                          : "border-[rgba(255,112,112,0.92)] bg-[rgba(26,10,15,0.96)]"
                      }`}
                      style={{
                        left: `clamp(10px, ${leagueProgress.progressPercent}%, calc(100% - 10px))`,
                      }}
                    >
                      <div
                        className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                          leagueProgress.delta >= 0
                            ? "bg-(--arena-accent)"
                            : "bg-(--signal-danger)"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="relative mt-3 flex items-start justify-between text-sm">
                    <span className="font-(--font-mono) text-[rgba(241,243,252,0.42)]">
                      {leagueProgress.currentLeagueMinElo}
                    </span>
                    <span className="font-(--font-mono) text-[rgba(241,243,252,0.42)]">
                      {leagueProgress.currentLeagueMaxElo}
                    </span>
                    <span
                      className="absolute left-0 top-0 -translate-x-1/2 -translate-y-[0.15rem] font-(--font-mono) text-[var(--signal-success)]"
                      style={{
                        left: `clamp(10px, ${leagueProgress.progressPercent}%, calc(100% - 10px))`,
                      }}
                    >
                      {leagueProgress.nextRating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Target,
              label: "Total Points Scored",
              value: totalPoints.toString(),
              tone: "cyan" as const,
            },
            {
              icon: Clock3,
              label: "Execution Time",
              value: formatDuration(totalDurationSeconds),
              tone: "violet" as const,
            },
            {
              icon: TestTubeDiagonal,
              label: "Unit Test Cases Passed",
              value: `${totalTestsPassed}/${totalTests}`,
              tone: "blue" as const,
            },
          ].map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className={`${panelFrameClass} min-h-[182px] p-5`}
              >
                <div className={panelNoiseClass} />
                <div className="relative z-[1] flex h-full flex-col justify-between">
                  <div className="space-y-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(241,243,252,0.04)]">
                      <Icon className="h-5 w-5 text-(--arena-accent)" />
                    </div>
                    <div>
                      <p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-[rgba(241,243,252,0.46)] uppercase">
                        {metric.label}
                      </p>
                      <p className="mt-2 font-(--font-heading) text-5xl leading-none tracking-[-0.04em] text-(--on-background)">
                        {metric.value}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                    <div
                      className={`h-full w-[76%] ${metricBarClass(metric.tone)}`}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className={`${panelFrameClass} p-5 sm:p-6`}>
          <div className={panelNoiseClass} />

          <div className="relative z-[1] space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-(--secondary) uppercase">
                  Match Summary
                </p>
                <h2 className="mt-1 font-(--font-heading) text-4xl leading-none tracking-[-0.04em] text-(--on-background)">
                  All 3 rounds, one final report
                </h2>
              </div>

              <div className="grid gap-2 text-sm text-[rgba(241,243,252,0.64)] sm:text-right">
                <p>Room {roomId}</p>
                <p>
                  League update: {leagueProgress.previousLeague} to{" "}
                  {leagueProgress.nextLeague}
                </p>
                <p>New rating: {leagueProgress.nextRating}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {roundResults.map((round) => (
                <article
                  key={round.roundNumber}
                  className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,14,22,0.74)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">
                        {round.title}
                      </p>
                      <p className="mt-2 font-(--font-heading) text-4xl leading-none tracking-[-0.04em] text-(--on-background)">
                        +{round.user.points}
                      </p>
                    </div>

                    <span className="rounded-full border border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)] px-2.5 py-1 font-(--font-mono) text-[0.56rem] tracking-[0.12em] text-(--secondary) uppercase">
                      {round.verdict}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-1 font-(--font-mono) text-[0.58rem] tracking-[0.14em] text-[rgba(241,243,252,0.42)] uppercase">
                      <Swords className="h-3.5 w-3.5" />
                      User vs Opponent
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      {
                        label: "Duration",
                        userValue: round.user.duration,
                        opponentValue: round.opponent.duration,
                      },
                      {
                        label: "Power Used",
                        userValue: round.user.powerUsed,
                        opponentValue: round.opponent.powerUsed,
                      },
                      {
                        label: "Accuracy",
                        userValue: `${round.user.accuracy}%`,
                        opponentValue: `${round.opponent.accuracy}%`,
                      },
                      {
                        label: "Tests Passed",
                        userValue: `${round.user.testsPassed}/${round.user.totalTests}`,
                        opponentValue: `${round.opponent.testsPassed}/${round.opponent.totalTests}`,
                      },
                      {
                        label: "Used Against You",
                        userValue: round.opponent.powerUsed,
                        opponentValue: round.user.powerUsed,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(9,14,22,0.74)] px-3 py-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">
                            {item.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-[rgba(0,229,204,0.14)] bg-[rgba(0,229,204,0.05)] px-3 py-2">
                            <p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-(--secondary) uppercase">
                              {playerName}
                            </p>
                            <p className="mt-1 text-sm text-(--on-background)">
                              {item.userValue}
                            </p>
                          </div>

                          <div className="rounded-lg border border-[rgba(255,112,112,0.14)] bg-[rgba(255,112,112,0.05)] px-3 py-2">
                            <p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-[var(--signal-danger)] uppercase">
                              {opponentName}
                            </p>
                            <p className="mt-1 text-sm text-(--on-background)">
                              {item.opponentValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,12,18,0.72)] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-(--secondary) uppercase">
                  Final Duel Metrics
                </p>
                <span className="font-(--font-mono) text-[0.58rem] tracking-[0.14em] text-[rgba(241,243,252,0.42)] uppercase">
                  User vs Opponent
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Total Points",
                    userValue: totalPoints.toString(),
                    opponentValue: opponentTotalPoints.toString(),
                  },
                  {
                    label: "Execution Time",
                    userValue: formatDuration(totalDurationSeconds),
                    opponentValue: formatDuration(opponentDurationSeconds),
                  },
                  {
                    label: "Unit Tests Passed",
                    userValue: `${totalTestsPassed}/${totalTests}`,
                    opponentValue: `${opponentTestsPassed}/${opponentTests}`,
                  },
                ].map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,14,22,0.74)] p-4"
                  >
                    <p className="font-(--font-mono) text-[0.56rem] tracking-[0.16em] text-[rgba(241,243,252,0.46)] uppercase">
                      {metric.label}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-[rgba(0,229,204,0.14)] bg-[rgba(0,229,204,0.05)] px-3 py-2">
                        <p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-(--secondary) uppercase">
                          {playerName}
                        </p>
                        <p className="mt-1 text-sm text-(--on-background)">
                          {metric.userValue}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[rgba(255,112,112,0.14)] bg-[rgba(255,112,112,0.05)] px-3 py-2">
                        <p className="font-(--font-mono) text-[0.56rem] tracking-[0.14em] text-[var(--signal-danger)] uppercase">
                          {opponentName}
                        </p>
                        <p className="mt-1 text-sm text-(--on-background)">
                          {metric.opponentValue}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 py-2 text-center">
          <p className="mx-auto max-w-4xl text-[clamp(1.8rem,4vw,3rem)] font-semibold italic leading-tight tracking-[-0.04em] text-(--on-background)">
            {bottomQuote}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                void handleContinue();
              }}
              disabled={isContinuing}
              className={`${arenaActionClass} min-w-[13rem]`}
            >
              {isContinuing ? "Continuing..." : "Continue"}
            </button>

            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-5 text-sm font-semibold tracking-[0.08em] text-(--on-background) uppercase transition hover:border-[rgba(0,229,204,0.35)] hover:bg-[rgba(0,229,204,0.08)]"
            >
              <Share2 className="h-4 w-4" />
              Share Log
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}