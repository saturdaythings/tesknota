interface AccordCloudProps {
  accords: [string, number][];
}

export function AccordCloud({ accords }: AccordCloudProps) {
  if (!accords.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {accords.map(([accord, count]) => (
        <div key={accord} className="flex justify-between items-center">
          <span className="font-serif italic" style={{ fontSize: 'var(--text-base)', color: 'var(--color-navy)' }}>
            {accord}
          </span>
          <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>
            ({count})
          </span>
        </div>
      ))}
    </div>
  );
}
