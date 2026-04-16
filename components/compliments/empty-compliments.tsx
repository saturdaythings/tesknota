"use client";

import { Button } from '@/components/ui/button';
import { MessageCircle } from '@/components/ui/Icons';

/* component-internal: empty state description max-width */
const DESCRIPTION_MAX_WIDTH = '280px';

export function EmptyCompliments({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <MessageCircle size={40} style={{ color: 'var(--color-navy)', marginBottom: 'var(--space-4)' }} />
      <div
        className="font-serif italic mb-2"
        style={{ fontSize: 'var(--text-empty-title)', color: 'var(--color-navy)' }}
      >
        No compliments yet
      </div>
      <div
        className="font-sans mb-6"
        style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)', maxWidth: DESCRIPTION_MAX_WIDTH }}
      >
        Start logging when someone notices your fragrance.
      </div>
      <Button variant="primary" onClick={onAdd}>
        Log First Compliment
      </Button>
    </div>
  );
}
