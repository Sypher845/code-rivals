import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTable } from "spacetimedb/react";
import { tables } from "../module_bindings";

export function ArenaResultsPage() {
  const { roomSegment, username } = useParams();
  const normalizedRoomId =
    roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? null;
  const [arenaRoomRows] = useTable(tables.arenaRoom);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) {
      return null;
    }

    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-(--arena-page-bg) px-6 text-(--on-background)">
      <section className="w-full max-w-2xl rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(10,14,20,0.92)] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="font-(--font-mono) text-xs uppercase tracking-[0.22em] text-(--secondary)">
          Arena Results
        </p>
        <h1 className="mt-4 font-(--font-heading) text-5xl uppercase tracking-[0.08em]">
          Hello World
        </h1>
        <p className="mt-4 text-sm text-[rgba(241,243,252,0.7)]">
          Match finished for {username ?? "player"} in room {activeRoom?.roomId ?? normalizedRoomId ?? "unknown"}.
        </p>
      </section>
    </main>
  );
}
