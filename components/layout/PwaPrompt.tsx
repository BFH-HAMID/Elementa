'use client';

import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'physchem-pwa-prompt-dismissed';

/**
 * Keeps the install affordance out of the main navigation until the browser says
 * the app is installable. This avoids showing a button that cannot work on Safari
 * and keeps the bottom tab bar usable on small screens.
 */
export function PwaPrompt() {
  const t = useTranslations('pwa');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!standalone) setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');

    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    const onUpdate = () => setUpdateAvailable(true);

    setOffline(!navigator.onLine);
    window.addEventListener('beforeinstallprompt', onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener('physchem-sw-update', onUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('physchem-sw-update', onUpdate);
    };
  }, []);

  const dismissInstall = () => {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === 'dismissed') dismissInstall();
  };

  const reloadForUpdate = async () => {
    const registration = await navigator.serviceWorker?.getRegistration();
    const waiting = registration?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    waiting.postMessage({ type: 'SKIP_WAITING' });
    waiting.addEventListener('statechange', () => {
      if (waiting.state === 'activated') window.location.reload();
    });
  };

  if (updateAvailable) {
    return (
      <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-md rounded-2xl border border-physics-200 bg-[var(--surface)] p-3 shadow-float xl:inset-x-auto xl:bottom-6 xl:right-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100"><RefreshCw size={17} /></span>
          <p className="min-w-0 flex-1 text-sm font-bold">{t('updateReady')}</p>
          <button type="button" onClick={reloadForUpdate} className="btn-primary min-h-9 shrink-0 px-3 text-xs">{t('refresh')}</button>
        </div>
      </div>
    );
  }

  if (offline) {
    return (
      <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50/95 p-3 text-amber-950 shadow-float dark:border-amber-800 dark:bg-amber-950/95 dark:text-amber-50 xl:inset-x-auto xl:bottom-6 xl:right-6">
        <div className="flex items-center gap-3 text-sm font-bold"><WifiOff size={17} className="shrink-0" /><span>{t('offline')}</span></div>
      </div>
    );
  }

  if (!installEvent || dismissed) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-md rounded-2xl border border-physics-200 bg-[var(--surface)] p-4 shadow-float xl:inset-x-auto xl:bottom-6 xl:right-6" aria-label={t('title')}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-physics-600 text-white shadow-sm"><Download size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{t('title')}</p>
          <p className="mt-1 text-xs leading-5 muted">{t('description')}</p>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={install} className="btn-primary min-h-9 px-3 text-xs">{t('install')}</button>
            <button type="button" onClick={dismissInstall} className="btn-ghost min-h-9 px-2 text-xs">{t('later')}</button>
          </div>
        </div>
        <button type="button" onClick={dismissInstall} className="btn-ghost min-h-8 shrink-0 rounded-lg p-1" aria-label={t('close')}><X size={15} /></button>
      </div>
    </aside>
  );
}
