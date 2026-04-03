import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Swords } from "lucide-react";
import type { Identity } from "spacetimedb";
import { useTable } from "spacetimedb/react";
import { tables } from "../module_bindings";
import { ArenaTabs } from "./arena/ArenaTabs";
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

  const renderTabContent = () => {
    if (location.pathname.endsWith("/friends")) {
      return <FriendsTab />;
    }
    if (location.pathname.endsWith("/leaderboard")) {
      return <LeaderboardTab />;
    }
    return <StatsTab />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--arena-page-bg)]">
      {/* Background gradient overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.08),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.09),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(224,141,255,0.08),transparent_30%)]" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(8,9,10,0.92)] backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between gap-6 px-5 sm:px-8 xl:px-12 2xl:px-16">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              alt="CodeRivals"
              className="h-7 w-7 rounded-md"
            />
            <Swords className="h-4 w-4 text-[var(--arena-accent)]" />
            <span className="inline-flex items-end gap-1 text-sm font-semibold tracking-[0.1em] uppercase">
              <span className="font-[var(--font-heading)]">Code</span>
              <span className="relative font-[var(--font-heading)] text-[var(--arena-accent)]">
                Rivals
                <span className="absolute -bottom-0.5 left-0 h-[2px] w-full bg-[var(--arena-accent)]/80" />
              </span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-3">
            <span className="hidden font-[var(--font-mono)] text-[0.68rem] tracking-[0.14em] text-[rgba(241,243,252,0.62)] uppercase sm:inline-block">
              {shortIdentity}
            </span>
            <button
              className="inline-flex min-h-9 items-center rounded-lg border border-[rgba(224,141,255,0.35)] px-3.5 text-xs font-semibold tracking-[0.12em] text-[var(--on-background)] uppercase transition hover:bg-[rgba(224,141,255,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={onLogOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging Out" : "Log Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex w-full flex-1 flex-col px-5 py-6 sm:px-8 xl:px-12 2xl:px-16">
        {/* User Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.24em] text-[var(--secondary)] uppercase">
              /user/{userSlug}
            </p>
            <h1 className="mt-1 font-[var(--font-heading)] text-4xl font-semibold tracking-[0.01em] sm:text-5xl">
              Welcome back, {username}
            </h1>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid flex-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)_minmax(460px,540px)]">
          <div className="xl:sticky xl:top-20 xl:self-start">
            <ArenaTabs userSlug={userSlug} />
          </div>

          {/* Main Tab Content */}
          <div>{renderTabContent()}</div>

          {/* Sticky Sidebar */}
          <div className="xl:sticky xl:top-20 xl:self-start">
            <ArenaSidebar identity={identity} arenaReady={arenaReady} />
          </div>
        </div>
      </main>
    </div>
  );
}
