import type { Metadata } from 'next';
import { BookmarkShelf } from '@/components/content/BookmarkShelf';
import { getEquationEntries } from '@/lib/content';

export const metadata: Metadata = { title: 'Bookmarks', description: 'Your locally saved PhysChem Lab learning trail.' };
export default function BookmarksPage() { return <section className="page-shell section-space"><div className="mb-8 max-w-3xl"><p className="eyebrow">PhysChem Lab · Your trail</p><h1 className="display-title mt-3">সংরক্ষিত <span className="text-amber-600 dark:text-amber-200">/ Bookmarks</span></h1><p className="mt-4 text-base leading-7 muted">Your bookmarks, progress and recent items stay in this browser. There is no account to create and nothing leaves this device.</p></div><BookmarkShelf equations={getEquationEntries()} /></section>; }
