import type { ArenaRoom, ArenaRoomMember } from "../../module_bindings/types";

type ActiveRoomsListProps = {
  arenaRoomRows: readonly ArenaRoom[];
  arenaMemberRows: readonly ArenaRoomMember[];
  onRoomClick: (roomId: string) => void;
};

export function ActiveRoomsList({
  arenaRoomRows,
  arenaMemberRows,
  onRoomClick,
}: ActiveRoomsListProps) {
  return (
    <div className="space-y-3">
      {arenaRoomRows.length === 0 && (
        <p className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] px-4 py-3 text-sm text-[rgba(241,243,252,0.7)]">
          No rooms yet. Create your first arena from the left panel.
        </p>
      )}

      {arenaRoomRows.map((room) => {
        const memberCount = arenaMemberRows.filter(
          (member) => member.roomId === room.roomId,
        ).length;

        return (
          <button
            key={room.roomId}
            type="button"
            onClick={() => onRoomClick(room.roomId)}
            className="w-full rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.74)] px-4 py-3 text-left transition hover:border-[rgba(0,255,255,0.35)]"
          >
            <p className="font-[var(--font-mono)] text-xs tracking-[0.14em] text-[var(--secondary)] uppercase">
              Room {room.roomId}
            </p>
            <p className="mt-2 text-sm text-[rgba(241,243,252,0.8)]">
              Creator {room.creatorName}
            </p>
            <p className="mt-1 text-xs text-[rgba(241,243,252,0.62)]">
              Members {memberCount} • Status {room.matchState.toUpperCase()}
            </p>
          </button>
        );
      })}
    </div>
  );
}
