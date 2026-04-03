import { Link } from "react-router-dom";
import coderivalsMark from "../../assets/coderivals-mark.svg";

type ArenaHeaderProps = {
  shortIdentity: string;
  isLoggingOut: boolean;
  onLogOut: () => void;
};

export function ArenaHeader({
  shortIdentity,
  isLoggingOut,
  onLogOut,
}: ArenaHeaderProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 pb-6">
      <Link to="/" className="inline-flex items-center gap-3">
        <img
          src={coderivalsMark}
          alt="CodeRivals"
          className="h-10 w-10 rounded-xl"
        />
        <span className="font-[var(--font-mono)] text-xs tracking-[0.2em] text-[var(--on-background)] uppercase">
          Arena Control Deck
        </span>
      </Link>

      <div className="inline-flex items-center gap-3">
        <span className="hidden font-[var(--font-mono)] text-[0.68rem] tracking-[0.14em] text-[rgba(241,243,252,0.62)] uppercase sm:inline-block">
          Session {shortIdentity}
        </span>
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
