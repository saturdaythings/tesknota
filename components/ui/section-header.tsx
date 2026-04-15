import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, right, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between border-b border-[var(--b2)] pb-[9px] mb-4",
        className,
      )}
    >
      <h2 className="font-[var(--serif)] text-[19px] font-normal text-[var(--ink)]">
        {title}
      </h2>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
