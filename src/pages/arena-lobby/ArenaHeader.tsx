import { Link } from "react-router-dom";

type ArenaHeaderProps = {
  isLoggingOut: boolean;
  onLogOut: () => void;
};

export function ArenaHeader({
  isLoggingOut,
  onLogOut,
}: ArenaHeaderProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 pb-6">
      <Link to="/" className="inline-flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="CodeRivals"
          className="h-10 w-10 rounded-xl"
        />
        <span className="font-[var(--font-mono)] text-xs tracking-[0.2em] text-[var(--on-background)] uppercase">
          Arena Control Deck
        </span>
      </Link>

      <div className="inline-flex items-center gap-3">
        <button
          className="inline-flex min-h-10 items-center rounded-full border border-[rgba(224,141,255,0.35)] px-4 text-xs font-semibold tracking-[0.12em] text-[var(--on-background)] uppercase transition hover:bg-[rgba(224,141,255,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onLogOut}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging Out" : "Log Out"}
        </button>
      </div>
    </div>
  );
}
