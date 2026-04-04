import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Moon, User } from "lucide-react";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import coderivalsMark from "../assets/coderivals-mark.svg";
import { reducers, tables } from "../module_bindings";
import { getLeagueFromElo } from "../lib/ranking";
import { StatsTab } from "./arena/StatsTab";
import { FriendsTab } from "./arena/FriendsTab";
import { LeaderboardTab } from "./arena/LeaderboardTab";
import { ArenaSidebar } from "./arena/ArenaSidebar";

type ArenaPageProps = {
  identity: Identity | undefined;
  isLoggingOut: boolean;
  onLogOut: () => void;
  shortIdentity: string;
  username: string;
};

export function ArenaPage({
  identity,
  isLoggingOut,
  onLogOut,
  shortIdentity,
  username,
}: ArenaPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaMemberRows, arenaMembersReady] = useTable(tables.arenaRoomMember);
  const [playerProfileRows] = useTable(tables.playerProfile);
  const [notificationRows] = useTable(tables.userNotification);
  const [friendRequestRows] = useTable(tables.friendRequest);
  const [gameInviteRows] = useTable(tables.gameInvite);
  const [playerPresenceRows] = useTable(tables.playerPresence);
  const setPlayerActivity = useReducer(reducers.setPlayerActivity);

  const arenaReady = useMemo(
    () => arenaRoomsReady && arenaMembersReady,
    [arenaRoomsReady, arenaMembersReady],
  );

  const myActiveRoomsCount = useMemo(() => {
    if (!identity) return 0;
    const roomIds = new Set(
      arenaMemberRows
        .filter((member) => member.memberIdentity.isEqual(identity))
        .map((member) => member.roomId),
    );
    return roomIds.size;
  }, [arenaMemberRows, identity]);

  const myProfile = useMemo(
    () => playerProfileRows.find((profile) => profile.username === username) ?? null,
    [playerProfileRows, username],
  );
  const myElo = Number(myProfile?.eloRating ?? 400n);
  const myLeague = getLeagueFromElo(myElo);
  const myDivision = myLeague.split(" ")[1] ?? "I";
  const winRate =
    Number(myProfile?.matchesPlayed ?? 0n) > 0
      ? Math.round(
          (Number(myProfile?.wins ?? 0n) /
            Number(myProfile?.matchesPlayed ?? 1n)) *
            100,
        )
      : 0;
  const wins = Number(myProfile?.wins ?? 0n);
  const losses = Number(myProfile?.losses ?? 0n);

  const unreadNotifications = useMemo(() => {
    if (!identity) return 0;
    return notificationRows.filter(
      (notification) =>
        notification.recipientIdentity.isEqual(identity) && !notification.isRead,
    ).length;
  }, [identity, notificationRows]);

  const incomingFriendRequestsCount = useMemo(() => {
    if (!identity) return 0;
    return friendRequestRows.filter(
      (request) =>
        request.toIdentity.isEqual(identity) && request.status === "pending",
    ).length;
  }, [friendRequestRows, identity]);

  const incomingInvitesCount = useMemo(() => {
    if (!identity) return 0;
    return gameInviteRows.filter(
      (invite) =>
        invite.toIdentity.isEqual(identity) && invite.status === "pending",
    ).length;
  }, [gameInviteRows, identity]);

  const inboxCount =
    unreadNotifications + incomingFriendRequestsCount + incomingInvitesCount;

  const currentPresence = useMemo(() => {
    if (!identity) return null;
    return (
      playerPresenceRows.find((presence) =>
        presence.playerIdentity.isEqual(identity),
      ) ?? null
    );
  }, [identity, playerPresenceRows]);

  const isInActivePlayingRoom = useMemo(() => {
    if (!identity) return false;

    const myRoomIds = new Set(
      arenaMemberRows
        .filter((member) => member.memberIdentity.isEqual(identity))
        .map((member) => member.roomId),
    );

    return arenaRoomRows.some(
      (room) => myRoomIds.has(room.roomId) && room.matchState === "playing",
    );
  }, [arenaMemberRows, arenaRoomRows, identity]);

  useEffect(() => {
    if (!identity || !currentPresence) {
      return;
    }

    if (currentPresence.activity !== "in_match" || isInActivePlayingRoom) {
      return;
    }

    void setPlayerActivity({ activity: "idle", roomId: undefined });
  }, [currentPresence, identity, isInActivePlayingRoom, setPlayerActivity]);

  const renderTabContent = () => {
    if (location.pathname.endsWith("/friends")) {
      return <FriendsTab identity={identity} username={username} />;
    }
    if (location.pathname.endsWith("/leaderboard")) {
      return <LeaderboardTab />;
    }
    return <StatsTab />;
  };

  const showQuickArena =
    !location.pathname.endsWith("/friends") &&
    !location.pathname.endsWith("/leaderboard");
  const showHeroCard = showQuickArena;
  const zenModePath = `/${encodeURIComponent(username)}/zen/R1`;
  const zenModeActive = /^\/[^/]+\/zen\/R[123]$/i.test(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-(--arena-page-bg)">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.08),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.09),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(224,141,255,0.08),transparent_30%)]" />

      <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(8,9,10,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(0,229,204,0.3)] bg-[rgba(0,229,204,0.08)]">
              <img
                src={coderivalsMark}
                alt="CodeRivals"
                className="h-5 w-5 rounded-sm"
              />
            </div>
            <span className="inline-flex items-end gap-1 text-sm font-semibold tracking-[0.1em] uppercase">
              <span className="font-(--font-heading)">Code</span>
              <span className="relative font-(--font-heading) text-(--arena-accent)">
                Rivals
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:inline-flex">
            <Link
              to={`/${username}`}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                !location.pathname.endsWith("/friends") &&
                !location.pathname.endsWith("/leaderboard")
                  ? "bg-[rgba(0,229,204,0.12)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to={`/${username}/friends`}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname.endsWith("/friends")
                  ? "bg-[rgba(0,229,204,0.12)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Friends
            </Link>
            <Link
              to={`/${username}/leaderboard`}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname.endsWith("/leaderboard")
                  ? "bg-[rgba(0,229,204,0.12)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Leaderboard
            </Link>
          </nav>

          <div className="inline-flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={zenModeActive}
              aria-label={zenModeActive ? "Disable Zen Mode" : "Enable Zen Mode"}
              onClick={() =>
                navigate(zenModeActive ? `/${encodeURIComponent(username)}` : zenModePath)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[rgba(241,243,252,0.72)] transition hover:text-(--on-background)"
            >
              <Moon className="h-4 w-4" />
              <span className="text-xs font-medium">Zen</span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                  zenModeActive ? "bg-[rgba(224,224,224,0.75)]" : "bg-[rgba(255,255,255,0.12)]"
                }`}
              >
                <span
                  className={`absolute h-4 w-4 rounded-full bg-[#e6e6e6] transition ${
                    zenModeActive ? "right-0.5" : "left-0.5"
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate(`/${encodeURIComponent(username)}/friends?view=notifications`);
              }}
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(241,243,252,0.72)] transition hover:text-(--on-background)"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-(--arena-accent) px-1 text-[10px] font-semibold text-(--arena-bg)">
                {Math.min(inboxCount, 9)}
              </span>
            </button>

            <div className="inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-2 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-[rgba(0,229,204,0.12)] text-(--arena-accent)">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden font-(--font-mono) text-[0.65rem] tracking-[0.12em] text-[rgba(241,243,252,0.72)] uppercase sm:inline-block">
                {shortIdentity}
              </span>
              <ChevronDown className="h-4 w-4 text-[rgba(241,243,252,0.6)]" />
            </div>

            <button
              className="inline-flex min-h-9 items-center rounded-lg border border-[rgba(224,141,255,0.35)] px-3.5 text-xs font-semibold tracking-[0.12em] text-(--on-background) uppercase transition hover:bg-[rgba(224,141,255,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={onLogOut}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              {isLoggingOut ? "Logging Out" : "Log Out"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {showHeroCard ? (
          <section className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(132deg,rgba(8,13,21,0.92),rgba(8,14,24,0.88)_58%,rgba(0,229,204,0.08))] p-5 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-[rgba(0,229,204,0.08)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-24 h-60 w-60 rounded-full bg-[rgba(126,87,255,0.05)] blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="grid h-24 w-24 place-items-center rounded-2xl border border-[rgba(0,229,204,0.4)] bg-[linear-gradient(140deg,rgba(0,229,204,0.16),rgba(126,87,255,0.14))] text-4xl font-bold text-(--arena-accent)">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full border border-[rgba(0,229,204,0.5)] bg-[rgba(8,15,24,0.95)] px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] text-(--arena-accent) uppercase">
                    {myDivision}
                  </div>
                </div>

                <div className="pt-1">
                  <p className="font-(--font-mono) text-[0.62rem] tracking-[0.24em] text-[rgba(241,243,252,0.52)] uppercase">
                    /{username}
                  </p>
                  <h1 className="mt-1 font-(--font-heading) text-4xl tracking-[0.01em] text-(--on-background)">
                    Ready for battle,{" "}
                    <span className="text-(--arena-accent)">{username}</span>?
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-[rgba(0,229,204,0.38)] bg-[rgba(0,229,204,0.12)] px-3 py-1 text-[0.74rem] font-semibold tracking-[0.08em] text-(--arena-accent) uppercase">
                      {myLeague}
                    </span>
                    <span className="text-[rgba(241,243,252,0.4)]">|</span>
                    <span className="font-(--font-mono) text-3xl text-(--arena-accent)">
                      {myElo.toLocaleString()} ELO
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block" />
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-0 border-t border-[rgba(255,255,255,0.08)] pt-4 sm:max-w-xl">
              <div className="px-2 text-center">
                <p className="text-4xl font-bold text-(--on-background)">{winRate}%</p>
                <p className="mt-1 text-[0.68rem] tracking-[0.12em] text-[rgba(241,243,252,0.46)] uppercase">
                  Win Rate
                </p>
              </div>
              <div className="border-l border-[rgba(255,255,255,0.08)] px-2 text-center">
                <p className="text-4xl font-bold text-(--signal-success)">{wins}</p>
                <p className="mt-1 text-[0.68rem] tracking-[0.12em] text-[rgba(241,243,252,0.46)] uppercase">
                  Wins
                </p>
              </div>
              <div className="border-l border-[rgba(255,255,255,0.08)] px-2 text-center">
                <p className="text-4xl font-bold text-(--signal-danger)">{losses}</p>
                <p className="mt-1 text-[0.68rem] tracking-[0.12em] text-[rgba(241,243,252,0.46)] uppercase">
                  Losses
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <div
          className={`grid flex-1 gap-6 ${
            showQuickArena
              ? "xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]"
              : "xl:grid-cols-[minmax(0,1fr)]"
          }`}
        >
          <div>{renderTabContent()}</div>

          {showQuickArena ? (
            <div className="w-full xl:sticky xl:top-20 xl:max-w-[400px] xl:justify-self-end xl:self-start">
              <ArenaSidebar
                identity={identity}
                arenaReady={arenaReady}
                username={username}
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
