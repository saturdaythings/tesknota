interface AccordCloudProps {
  accords: [string, number][];
}

export function AccordCloud({ accords }: AccordCloudProps) {
  if (!accords.length) return null;
  return (
    <div className="flex flex-wrap gap-[6px]">
      {accords.map(([accord], i) => (
        <span
          key={accord}
          className={[
            "font-[var(--mono)] tracking-[0.08em] px-3 py-[5px] bg-[var(--off2)] border border-[var(--b2)] text-[var(--ink2)] cursor-default",
            i === 0 ? "text-[15px]" : i <= 2 ? "text-[13px]" : "text-[11px]",
          ].join(" ")}
        >
          {accord}
        </span>
      ))}
    </div>
  );
}
