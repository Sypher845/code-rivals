import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import type { Identity } from "spacetimedb";
import { useTable } from "spacetimedb/react";
import coderivalsMark from "../assets/coderivals-mark.svg";
import { tables } from "../module_bindings";
import { StatsTab } from "./arena/StatsTab";
import { FriendsTab } from "./arena/FriendsTab";
import { LeaderboardTab } from "./arena/LeaderboardTab";
import { ArenaSidebar } from "./arena/ArenaSidebar";

type ArenaPageProps = {
  identity: Identity | undefined;
  isLoggingOut: boolean;
  onLogOut: () => void;
  shortIdentity: string;
  userSlug: string;
  username: string;
};

export function ArenaPage({
  identity,
  isLoggingOut,
  onLogOut,
  shortIdentity,
  userSlug,
  username,
}: ArenaPageProps) {
  const location = useLocation();

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaMemberRows, arenaMembersReady] = useTable(tables.arenaRoomMember);

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

  const onlineRivalsCount = useMemo(() => {
    const membersByRoom = new Map<string, number>();
    for (const member of arenaMemberRows) {
      membersByRoom.set(member.roomId, (membersByRoom.get(member.roomId) ?? 0) + 1);
    }

    let count = 0;
    for (const totalMembers of membersByRoom.values()) {
      if (totalMembers > 1) count += totalMembers - 1;
    }

    return count;
  }, [arenaMemberRows]);

  const renderTabContent = () => {
    if (location.pathname.endsWith("/friends")) {
      return <FriendsTab />;
    }
    if (location.pathname.endsWith("/leaderboard")) {
      return <LeaderboardTab />;
    }
    return <StatsTab />;
  };

  const showQuickArena =
    !location.pathname.endsWith("/friends") && !location.pathname.endsWith("/leaderboard");
  const showHeroCard = showQuickArena;

  return (
    <div className="flex min-h-screen flex-col bg-(--arena-page-bg)">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.08),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.09),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(224,141,255,0.08),transparent_30%)]" />

      <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(8,9,10,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(0,229,204,0.3)] bg-[rgba(0,229,204,0.08)]">
              <img src={coderivalsMark} alt="CodeRivals" className="h-5 w-5 rounded-sm" />
            </div>
            <span className="inline-flex items-end gap-1 text-sm font-semibold tracking-[0.1em] uppercase">
              <span className="font-(--font-heading)">Code</span>
              <span className="relative font-(--font-heading) text-(--arena-accent)">Rivals</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:inline-flex">
            <Link
              to={`/user/${userSlug}`}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                !location.pathname.endsWith("/friends") && !location.pathname.endsWith("/leaderboard")
                  ? "bg-[rgba(0,229,204,0.12)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to={`/user/${userSlug}/friends`}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname.endsWith("/friends")
                  ? "bg-[rgba(0,229,204,0.12)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Friends
            </Link>
            <Link
              to={`/user/${userSlug}/leaderboard`}
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
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-[rgba(255,255,255,0.1)] text-[rgba(241,243,252,0.72)] transition hover:text-(--on-background)"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-(--arena-accent) px-1 text-[10px] font-semibold text-(--arena-bg)">
                {Math.min(arenaRoomRows.length, 9)}
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
          <section className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(12,20,30,0.95),rgba(12,20,30,0.72)_52%,rgba(0,229,204,0.06))] p-5 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-[rgba(0,229,204,0.08)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[rgba(224,141,255,0.1)] blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl border border-[rgba(0,229,204,0.35)] bg-[rgba(0,229,204,0.12)] text-2xl font-bold text-(--arena-accent)">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full border border-[rgba(255,255,255,0.14)] bg-(--arena-bg) px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] text-(--arena-accent) uppercase">
                    User
                  </div>
                </div>

                <div>
                  <p className="font-(--font-mono) text-[0.62rem] tracking-[0.24em] text-[rgba(241,243,252,0.58)] uppercase">
                    /user/{userSlug}
                  </p>
                  <h1 className="mt-1 font-(--font-heading) text-3xl tracking-[0.01em] text-(--on-background) sm:text-4xl">
                    Ready for battle, <span className="text-(--arena-accent)">{username}</span>?
                  </h1>
                  <p className="mt-2 text-sm text-[rgba(241,243,252,0.62)]">
                    Live arena status synced from your active SpacetimeDB subscriptions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.6)] px-4 py-3 text-center">
                  <p className="text-2xl font-semibold text-(--signal-success)">{myActiveRoomsCount}</p>
                  <p className="text-[0.62rem] tracking-[0.12em] text-[rgba(241,243,252,0.58)] uppercase">Your Rooms</p>
                </div>
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.6)] px-4 py-3 text-center">
                  <p className="text-2xl font-semibold text-(--arena-accent)">{arenaRoomRows.length}</p>
                  <p className="text-[0.62rem] tracking-[0.12em] text-[rgba(241,243,252,0.58)] uppercase">Open Arenas</p>
                </div>
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.6)] px-4 py-3 text-center">
                  <p className="text-2xl font-semibold text-(--tertiary)">{onlineRivalsCount}</p>
                  <p className="text-[0.62rem] tracking-[0.12em] text-[rgba(241,243,252,0.58)] uppercase">Rivals Online</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div
          className={`grid flex-1 gap-6 ${
            showQuickArena
              ? "xl:grid-cols-[minmax(0,1fr)_minmax(460px,540px)]"
              : "xl:grid-cols-[minmax(0,1fr)]"
          }`}
        >
          <div>{renderTabContent()}</div>

          {showQuickArena ? (
            <div className="xl:sticky xl:top-20 xl:self-start">
              <ArenaSidebar identity={identity} arenaReady={arenaReady} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
