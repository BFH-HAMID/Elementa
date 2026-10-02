import Link from 'next/link';

export default function RootNotFound() { return <html lang="bn"><body className="grid min-h-screen place-items-center bg-[#f7fafc] p-6 text-center text-[#14283d]"><main><p className="text-sm font-black uppercase tracking-widest text-[#075db1]">404 · PhysChem Lab</p><h1 className="mt-3 text-3xl font-black">This page is outside the lab.</h1><Link href="/bn" className="mt-6 inline-flex rounded-xl bg-[#075db1] px-4 py-3 text-sm font-bold text-white">Return home</Link></main></body></html>; }
