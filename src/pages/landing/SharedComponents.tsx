import { type ComponentType, type SVGProps } from "react";
import type { LucideProps } from "lucide-react";

export function BrandMark() {
  return (
    <img
      src="/logo.svg"
      alt="CodeRivals"
      className="h-10 w-10 rounded-xl"
    />
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
