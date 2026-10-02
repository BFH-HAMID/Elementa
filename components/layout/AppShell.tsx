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
        <Navbar />
        {/* .app-main reserves the mobile tab bar (including the iOS safe area) so page
            content is never trapped underneath it. */}
        <main className="app-main">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <ServiceWorkerRegister />
      </ToastProvider>
    </ThemeProvider>
  );
}
