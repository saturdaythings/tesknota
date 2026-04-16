"use client";

import { useEffect } from 'react';

export function TokenPreviewListener() {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const d = event.data;
      if (!d || d.type !== 'TOKEN_PREVIEW') return;
      if (typeof d.token === 'string' && typeof d.value === 'string') {
        document.documentElement.style.setProperty(d.token, d.value);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  return null;
}
