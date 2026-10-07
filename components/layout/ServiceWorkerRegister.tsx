'use client';

import { useEffect } from 'react';

/** Register the worker only in production, then surface a quiet update action. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;

    const announceUpdate = () => window.dispatchEvent(new Event('physchem-sw-update'));

    const watchRegistration = (current: ServiceWorkerRegistration) => {
      registration = current;
      if (current.waiting) announceUpdate();
      current.addEventListener('updatefound', () => {
        const worker = current.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announceUpdate();
        });
      });
    };

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((current) => {
        if (!cancelled) watchRegistration(current);
      })
      .catch(() => undefined);

    const updateTimer = window.setInterval(() => registration?.update(), 60 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(updateTimer);
    };
  }, []);

  return null;
}
