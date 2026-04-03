import { useMemo } from "react";
import type { Identity } from "spacetimedb";
import { Link, useSearchParams } from "react-router-dom";
import { useTable } from "spacetimedb/react";
import { panelFrameClass, panelNoiseClass } from "../components/uiClasses";
import { tables } from "../module_bindings";

type MatchLaunchPageProps = {
  identity: Identity | undefined;
  username: string;
};

export function MatchLaunchPage({
  identity,
  username,
}: MatchLaunchPageProps) {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const normalizedRoomId = roomId?.trim().toUpperCase() ?? null;

  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  const myLock = useMemo(() => {
    if (!normalizedRoomId || !identity) return null;
    return (
      arenaPowerupLockRows.find(
        (lock) =>
          lock.roomId === normalizedRoomId && lock.playerIdentity.isEqual(identity),
      ) ?? null
    );
  }, [arenaPowerupLockRows, identity, normalizedRoomId]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--arena-page-bg) px-4 py-8 text-(--on-background) sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_16%,rgba(0,255,255,0.14),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(224,141,255,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(0,153,255,0.1),transparent_34%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className={`${panelFrameClass} relative w-full rounded-[2rem] border-[rgba(0,255,255,0.22)] p-6 sm:p-8`}>
          <div className={panelNoiseClass} />
          <div className="relative z-1">
            <p className="font-(--font-mono) text-[0.68rem] tracking-[0.24em] text-(--secondary) uppercase">
              Match Transition
            </p>
            <h1 className="mt-3 font-(--font-heading) text-4xl leading-none tracking-[0.08em] uppercase sm:text-6xl">
              Battle Interface Primed
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[rgba(241,243,252,0.68)] sm:text-base">
              Countdown is complete. This route is ready to hand off into the actual coding match screen when that surface is built.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Player
                </p>
                <p className="mt-2 text-lg font-semibold">{username}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Room
                </p>
                <p className="mt-2 text-lg font-semibold">{normalizedRoomId ?? "Unavailable"}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Locked Power
                </p>
                <p className="mt-2 text-lg font-semibold">{myLock?.powerupId ?? "Syncing"}</p>
              </article>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-[rgba(0,255,255,0.16)] bg-[linear-gradient(135deg,rgba(7,18,27,0.94),rgba(16,9,30,0.94))] p-5">
              <p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-[rgba(241,243,252,0.54)] uppercase">
                Current Match State
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                {activeRoom?.matchState?.toUpperCase() ?? "UNKNOWN"}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/${encodeURIComponent(username)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[rgba(0,255,255,0.28)] px-6 font-(--font-mono) text-xs tracking-[0.16em] text-(--secondary) uppercase transition hover:bg-[rgba(0,255,255,0.08)]"
              >
                Return to Arena
              </Link>
              <Link
                to={`/${encodeURIComponent(username)}/powerups${normalizedRoomId ? `?room=${normalizedRoomId}` : ""}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[rgba(241,243,252,0.14)] bg-[rgba(10,16,25,0.82)] px-6 font-(--font-mono) text-xs tracking-[0.16em] uppercase transition hover:border-[rgba(241,243,252,0.28)]"
              >
                Review Lock Screen
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
