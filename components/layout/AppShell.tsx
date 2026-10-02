import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

export function AppShell({ children }: { children: ReactNode }) {
  return <ThemeProvider><ToastProvider><Navbar /><main className="min-h-[calc(100vh-4rem)] pb-16 lg:pb-0">{children}</main><Footer /><BottomNav /><ServiceWorkerRegister /></ToastProvider></ThemeProvider>;
}
