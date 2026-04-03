const actionButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-2xl border border-[rgba(224,141,255,0.35)] bg-[linear-gradient(90deg,rgba(73,46,88,0.98),rgba(15,48,95,0.98))] px-5 text-sm font-semibold tracking-[0.08em] text-[var(--on-background)] uppercase shadow-[0_14px_26px_rgba(0,0,0,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

const inputClass =
  "min-h-[3.4rem] w-full rounded-2xl border border-[rgba(241,243,252,0.15)] bg-[rgba(8,14,20,0.85)] px-4 py-3 text-[var(--on-background)] placeholder:text-[rgba(241,243,252,0.45)] outline-none transition focus:border-[rgba(0,255,255,0.4)] focus:ring-2 focus:ring-[rgba(0,255,255,0.18)]";

type StatusTone = "neutral" | "error";

type ArenaActionsPanelProps = {
  arenaReady: boolean;
  roomCodeInput: string;
  arenaStatusMessage: string | null;
  arenaStatusTone: StatusTone;
  onRoomCodeInputChange: (value: string) => void;
  onCreateArena: () => void;
  onOpenRoom: () => void;
};

export function ArenaActionsPanel({
  arenaReady,
  roomCodeInput,
  arenaStatusMessage,
  arenaStatusTone,
  onRoomCodeInputChange,
  onCreateArena,
  onOpenRoom,
}: ArenaActionsPanelProps) {
  return (
    <div className="grid gap-4">
      <button
        className={actionButtonClass}
        type="button"
        onClick={onCreateArena}
        disabled={!arenaReady}
      >
        {!arenaReady ? "Syncing Tables" : "Create Arena"}
      </button>

      <div className="grid gap-3">
        <label className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.22em] text-[rgba(241,243,252,0.62)] uppercase">
          Room Code
        </label>
        <input
          className={inputClass}
          type="text"
          value={roomCodeInput}
          onChange={(event) => onRoomCodeInputChange(event.target.value)}
          autoComplete="off"
          placeholder="ENTER 6-CHAR ROOM CODE"
          disabled={!arenaReady}
        />
        <button
          className={actionButtonClass}
          type="button"
          onClick={onOpenRoom}
          disabled={!arenaReady}
        >
          Open Room Card
        </button>
      </div>

      <div
        className={
          arenaStatusTone === "error"
            ? "rounded-2xl border border-[rgba(224,141,255,0.25)] bg-[rgba(45,22,41,0.72)] px-4 py-3 text-sm text-[var(--on-background)]"
            : "rounded-2xl border border-[rgba(224,141,255,0.18)] bg-[rgba(29,18,39,0.48)] px-4 py-3 text-sm text-[rgba(241,243,252,0.78)]"
        }
      >
        {arenaStatusMessage ??
          (!arenaReady
            ? "Syncing arena tables..."
            : "Create a room or enter a room code to open the room card.")}
      </div>
    </div>
  );
}
