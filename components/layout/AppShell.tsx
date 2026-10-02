import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {/* Keyboard and screen-reader users can jump past the navigation on every page. */}
        <a
          href="#lab-content"
          className="sr-only rounded-lg bg-[var(--surface)] px-4 py-2 text-sm font-bold shadow-float focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
        >
          Skip to content
        </a>
        <Navbar />
        {/* .app-main reserves the mobile tab bar (including the iOS safe area) so page
            content is never trapped underneath it. */}
        <main id="lab-content" className="app-main scroll-mt-16">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <ServiceWorkerRegister />
      </ToastProvider>
    </ThemeProvider>
  );
}
