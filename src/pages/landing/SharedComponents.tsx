import { type ComponentType, type SVGProps } from "react";
import type { LucideProps } from "lucide-react";

export function BrandMark() {
  return (
    <div className="grid h-9 w-9 grid-cols-2 gap-[3px] rounded-xl border border-[rgba(224,141,255,0.22)] bg-[rgba(224,141,255,0.08)] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.22)]">
      <span className="rounded-[4px] bg-[var(--primary)]" />
      <span className="rounded-[4px] bg-[rgba(224,141,255,0.4)]" />
      <span className="rounded-[4px] bg-[rgba(224,141,255,0.32)]" />
      <span className="rounded-[4px] bg-[rgba(224,141,255,0.14)]" />
    </div>
  );
}

export function SectionEyebrow({
  icon: Icon,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement> & LucideProps>;
  children: string;
}) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 font-[var(--font-mono)] text-[0.68rem] font-medium tracking-[0.24em] text-[var(--text-tertiary)] uppercase">
      <Icon className="h-3.5 w-3.5" />
      <span>{children}</span>
    </div>
  );
}
