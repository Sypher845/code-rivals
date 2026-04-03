type ArenaStatsCardsProps = {
  username: string;
  userSlug: string;
  activeRoomId: string | null;
  arenaRoomCount: number;
};

export function ArenaStatsCards({
  username,
  userSlug,
  activeRoomId,
  arenaRoomCount,
}: ArenaStatsCardsProps) {
  return (
    <div className="space-y-3">
      <p className="font-[var(--font-mono)] text-xs tracking-[0.3em] text-[var(--secondary)] uppercase">
        /user/{userSlug} Arena Lobby
      </p>
      <h1 className="max-w-[14ch] text-[clamp(2.2rem,5vw,3.9rem)] leading-[0.9] font-bold tracking-[-0.04em] uppercase">
        Create Or Join Your Duel Room.
      </h1>
      <p className="max-w-[56ch] text-sm leading-7 text-[rgba(241,243,252,0.74)] sm:text-base">
        Create a private room, open an existing room with code, then use the
        popup card for members, moderation, and match start.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] p-4">
          <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
            Pilot
          </p>
          <p className="mt-2 text-sm font-semibold">{username}</p>
        </article>
        <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] p-4">
          <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
            Active Room
          </p>
          <p className="mt-2 text-sm font-semibold">{activeRoomId ?? "NONE"}</p>
        </article>
        <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] p-4">
          <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
            Rooms Live
          </p>
          <p className="mt-2 text-sm font-semibold">{arenaRoomCount}</p>
        </article>
      </div>
    </div>
  );
}
