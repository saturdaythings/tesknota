interface AccordCloudProps {
  accords: [string, number][];
}

export function AccordCloud({ accords }: AccordCloudProps) {
  if (!accords.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {accords.map(([accord, count]) => (
        <div
          key={accord}
          className="font-[var(--body)] text-sm text-[var(--ink)] flex justify-between items-center"
        >
          <span>{accord}</span>
          <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">({count})</span>
        </div>
      ))}
    </div>
  );
}
