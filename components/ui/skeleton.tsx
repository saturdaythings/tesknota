import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-surface-raised) 25%,
            var(--color-sand-light) 50%,
            var(--color-surface-raised) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer {
            background: var(--color-surface-raised);
            animation: none;
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        className={cn(
          "skeleton-shimmer rounded-[var(--radius-sm)]",
          className,
        )}
      />
    </>
  );
}
