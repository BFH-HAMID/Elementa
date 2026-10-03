import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type RecentItem = { slug: string; kind: 'equation' | 'experiment' | 'simulation' | 'quiz' | 'lab'; href: string; title: string; viewedAt: number };
export type ScoreRecord = { quiz: string; score: number; total: number; at: number };

type LabState = {
  bookmarks: string[];
  recentlyViewed: RecentItem[];
  progress: Record<string, number>;
  scoreHistory: ScoreRecord[];
  theme: ThemeMode;
  language: 'bn' | 'en';
  toggleBookmark: (slug: string) => void;
  addRecent: (item: Omit<RecentItem, 'viewedAt'>) => void;
  markProgress: (key: string, value: number) => void;
  addScore: (record: Omit<ScoreRecord, 'at'>) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: 'bn' | 'en') => void;
};

export const useLabStore = create<LabState>()(
  persist(
    (set) => ({
      bookmarks: [],
      recentlyViewed: [],
      progress: {},
      scoreHistory: [],
      theme: 'system',
      language: 'bn',
      toggleBookmark: (slug) => set((state) => ({ bookmarks: state.bookmarks.includes(slug) ? state.bookmarks.filter((item) => item !== slug) : [...state.bookmarks, slug] })),
      addRecent: (item) => set((state) => ({
        recentlyViewed: [
          { ...item, viewedAt: Date.now() },
          ...state.recentlyViewed.filter((old) => old.slug !== item.slug || old.kind !== item.kind)
        ].slice(0, 8)
      })),
      markProgress: (key, value) => set((state) => ({ progress: { ...state.progress, [key]: Math.max(0, Math.min(100, value)) } })),
      addScore: (record) => set((state) => ({ scoreHistory: [{ ...record, at: Date.now() }, ...state.scoreHistory].slice(0, 20) })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'physchem-lab-storage',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        recentlyViewed: state.recentlyViewed,
        progress: state.progress,
        scoreHistory: state.scoreHistory,
        theme: state.theme,
        language: state.language
      })
    }
  )
);
