import type { Identity } from "spacetimedb";
import type { ArenaRoom, ArenaRoomMember } from "../../module_bindings/types";
import { formatSessionTime } from "../../utils/format";
import { panelFrameClass, panelNoiseClass } from "../../components/uiClasses";

type ArenaRoomModalProps = {
  activeRoom: ArenaRoom;
  activeRoomMembers: readonly ArenaRoomMember[];
  identity: Identity | undefined;
  isArenaAdmin: boolean;
  onClose: () => void;
  onStartMatch: () => void;
  onKickMember: (memberId: bigint) => void;
  onShareRoom: () => void;
};

export function ArenaRoomModal({
  activeRoom,
  activeRoomMembers,
  identity,
  isArenaAdmin,
  onClose,
  onStartMatch,
  onKickMember,
  onShareRoom,
}: ArenaRoomModalProps) {
  const actionButtonClass =
    "inline-flex min-h-12 items-center justify-center rounded-2xl border border-[rgba(224,141,255,0.35)] bg-[linear-gradient(90deg,rgba(73,46,88,0.98),rgba(15,48,95,0.98))] px-5 text-sm font-semibold tracking-[0.08em] text-[var(--on-background)] uppercase shadow-[0_14px_26px_rgba(0,0,0,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-[rgba(2,8,13,0.68)] p-4 backdrop-blur-sm">
      <section
        className={`${panelFrameClass} flex w-full max-w-3xl flex-col gap-4 p-5`}
      >
        <div className={panelNoiseClass} />

        <header className="relative z-[1] flex items-start justify-between gap-4">
          <div>
            <p className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.24em] text-[var(--secondary)] uppercase">
              Arena Room Card
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em]">
              Room {activeRoom.roomId}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-[rgba(241,243,252,0.22)] px-4 py-2 text-xs font-semibold tracking-[0.1em] uppercase transition hover:border-[rgba(0,255,255,0.35)]"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="relative z-[1] grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-3">
            <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.58)] uppercase">
              Room ID
            </p>
            <p className="mt-2 text-sm font-semibold">{activeRoom.roomId}</p>
          </article>
          <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-3">
            <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.58)] uppercase">
              Creator
            </p>
            <p className="mt-2 text-sm font-semibold">
              {activeRoom.creatorName}
            </p>
          </article>
          <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-3">
            <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.58)] uppercase">
              Match
            </p>
            <p className="mt-2 text-sm font-semibold">
              {activeRoom.matchState.toUpperCase()}
            </p>
          </article>
        </div>

        <section className="relative z-[1] rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-4">
          <p className="font-[var(--font-mono)] text-[0.68rem] tracking-[0.18em] text-[rgba(241,243,252,0.62)] uppercase">
            Joined Users ({activeRoomMembers.length})
          </p>

          <ul className="mt-3 space-y-2">
            {activeRoomMembers.map((member) => (
              <li
                key={member.memberId.toString()}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(241,243,252,0.1)] bg-[rgba(4,10,16,0.86)] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{member.memberName}</p>
                  <p className="text-xs text-[rgba(241,243,252,0.6)]">
                    Joined {formatSessionTime(member.joinedAt.toDate())}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {member.memberIdentity.isEqual(
                    activeRoom.creatorIdentity,
                  ) && (
                    <span className="rounded-full border border-[rgba(224,141,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.62rem] tracking-[0.08em] uppercase">
                      ADMIN
                    </span>
                  )}
                  {identity && member.memberIdentity.isEqual(identity) && (
                    <span className="rounded-full border border-[rgba(0,255,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.62rem] tracking-[0.08em] text-[var(--secondary)] uppercase">
                      YOU
                    </span>
                  )}
                  {isArenaAdmin &&
                    !member.memberIdentity.isEqual(
                      activeRoom.creatorIdentity,
                    ) && (
                      <button
                        type="button"
                        className="rounded-lg border border-[rgba(224,141,255,0.35)] bg-[rgba(45,22,41,0.72)] px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] uppercase"
                        onClick={() => onKickMember(member.memberId)}
                      >
                        Kick
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="relative z-[1] space-y-3">
          <button
            type="button"
            className={actionButtonClass}
            onClick={onStartMatch}
            disabled={!isArenaAdmin || activeRoom.matchState !== "waiting"}
          >
            {activeRoom.matchState === "waiting"
              ? "Start Match"
              : "Match In Progress"}
          </button>

          {!isArenaAdmin && (
            <p className="text-xs text-[rgba(241,243,252,0.62)]">
              Only {activeRoom.creatorName} can start the match and kick users.
            </p>
          )}
        </div>

        <button
          type="button"
          className="relative z-[1] mx-auto inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(0,255,255,0.34)] px-7 text-xs font-semibold tracking-[0.12em] text-[var(--secondary)] uppercase transition hover:bg-[rgba(0,255,255,0.1)]"
          onClick={onShareRoom}
        >
          Share Room URL
        </button>
      </section>
    </div>
  );
}
