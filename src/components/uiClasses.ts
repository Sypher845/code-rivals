export const pagePaddingClass = "p-[clamp(1.1rem,2vw,1.6rem)]";

export const panelFrameClass =
  "relative overflow-hidden rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface-1)] shadow-[0_0_0_1px_rgba(255,255,255,0.015),0_22px_48px_rgba(0,0,0,0.32)]";

export const panelNoiseClass =
  "pointer-events-none absolute inset-0 opacity-90 [background:linear-gradient(180deg,rgba(255,255,255,0.02),transparent_34%),linear-gradient(90deg,rgba(0,229,204,0.03),transparent_26%)]";

export const authShellClass = `${pagePaddingClass} grid min-h-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`;

export const heroPanelClass = `${panelFrameClass} flex min-h-[calc(100svh-clamp(2.2rem,4vw,3.2rem))] items-start p-[clamp(2rem,4vw,2.7rem)] max-xl:min-h-auto max-md:rounded-[1.4rem] max-md:p-[1.15rem]`;

export const authPanelClass = `${panelFrameClass} flex min-h-[calc(100svh-clamp(2.2rem,4vw,3.2rem))] flex-col p-6 max-xl:min-h-auto max-md:rounded-[1.4rem] max-md:p-[1.15rem]`;

export const eyebrowClass =
  "font-[var(--font-mono)] text-[0.83rem] tracking-[0.34em] text-[var(--secondary)] uppercase";

export const inputClass =
  "min-h-[3.65rem] w-full rounded-2xl border border-[rgba(241,243,252,0.14)] bg-[rgba(8,14,20,0.92)] px-[1.05rem] py-4 text-[var(--on-background)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[rgba(241,243,252,0.42)] focus:border-[rgba(0,255,255,0.35)] focus:outline-none focus:shadow-[0_0_0_1px_rgba(0,255,255,0.15),0_0_0_4px_rgba(0,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-60";

export const primaryActionClass =
  "mt-1 min-h-[3.6rem] rounded-lg border border-[rgba(0,229,204,0.65)] bg-[var(--arena-accent)] font-[var(--font-mono)] tracking-[0.04em] text-[#081317] shadow-[0_0_0_1px_rgba(0,0,0,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";

export const authLinkClass =
  "border-0 bg-transparent p-0 font-inherit text-inherit font-bold tracking-[0] text-[var(--secondary)]";

// Glassmorphism card for stat cards, friend rows, etc.
export const glassCardClass =
  "relative overflow-hidden rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface-1)] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition hover:bg-[var(--arena-surface-2)]";

// Online status dot
export const onlineDotClass =
  "h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]";

// Offline status dot
export const offlineDotClass =
  "h-2.5 w-2.5 rounded-full bg-gray-500";

// Challenge button
export const challengeButtonClass =
  "inline-flex items-center justify-center rounded-md border border-[rgba(0,229,204,0.4)] bg-[rgba(0,229,204,0.14)] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[var(--on-background)] uppercase transition hover:bg-[rgba(0,229,204,0.24)] disabled:opacity-60";


  // Table header cell
export const tableHeaderClass =
  "px-4 py-3 text-left font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase";

// Table row cell
export const tableCellClass =
  "px-4 py-3 text-sm text-[var(--text-secondary)]";
