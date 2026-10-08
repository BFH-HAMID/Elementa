'use client';

/**
 * Elementa Physics Lab — realistic material library.
 *
 * Every instrument on the workbench is drawn as vector artwork that borrows its
 * shading from this single set of SVG gradients, patterns and filters: brushed
 * steel, chrome, brass, copper windings, bakelite, teak, clear/tinted glass,
 * mercury, rubber, LCD glass, LED lenses and lamp glows.
 *
 * All ids are prefixed `ix-` and live in one hidden `<svg>` per document
 * (see `<InstrumentDefs />`), so hundreds of instruments can share them and the
 * browser only has to parse the paint servers once.
 */

import React from 'react';

/* ------------------------------------------------------------------ */
/* The paint shop                                                       */
/* ------------------------------------------------------------------ */

export function InstrumentDefs() {
  return (
    <svg aria-hidden focusable="false" width={0} height={0} className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      <defs>
        {/* ── Metals ───────────────────────────────────────────────── */}
<linearGradient id="ix-steel" x1="0.05" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fbfdff" />
          <stop offset="12%" stopColor="#e4ebf2" />
          <stop offset="34%" stopColor="#b9c4cf" />
          <stop offset="52%" stopColor="#8d99a6" />
          <stop offset="60%" stopColor="#a7b3bf" />
          <stop offset="78%" stopColor="#77828f" />
          <stop offset="100%" stopColor="#4e5865" />
        </linearGradient>
<linearGradient id="ix-steel-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4f5b69" />
          <stop offset="9%" stopColor="#8b98a6" />
          <stop offset="22%" stopColor="#f8fbfe" />
          <stop offset="33%" stopColor="#c9d3dd" />
          <stop offset="46%" stopColor="#8e9ba9" />
          <stop offset="58%" stopColor="#dfe7ee" />
          <stop offset="72%" stopColor="#96a3b1" />
          <stop offset="100%" stopColor="#455060" />
        </linearGradient>
<linearGradient id="ix-chrome" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="14%" stopColor="#e8eef5" />
          <stop offset="30%" stopColor="#9dabb9" />
          <stop offset="42%" stopColor="#5d6a78" />
          <stop offset="52%" stopColor="#f2f7fb" />
          <stop offset="66%" stopColor="#c2ccd6" />
          <stop offset="84%" stopColor="#7e8b99" />
          <stop offset="100%" stopColor="#aeb9c4" />
        </linearGradient>
<linearGradient id="ix-brass" x1="0.08" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor="#fff6cf" />
          <stop offset="16%" stopColor="#eccb6c" />
          <stop offset="38%" stopColor="#c79a33" />
          <stop offset="52%" stopColor="#a97f1e" />
          <stop offset="66%" stopColor="#d9b455" />
          <stop offset="84%" stopColor="#9a7118" />
          <stop offset="100%" stopColor="#6b4a0b" />
        </linearGradient>
<linearGradient id="ix-brass-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6d4a0a" />
          <stop offset="12%" stopColor="#a67c1c" />
          <stop offset="28%" stopColor="#f7e79c" />
          <stop offset="42%" stopColor="#d5ae4a" />
          <stop offset="56%" stopColor="#a37a19" />
          <stop offset="72%" stopColor="#c89f36" />
          <stop offset="78%" stopColor="#e5c464" />
          <stop offset="100%" stopColor="#5f3f07" />
        </linearGradient>
<linearGradient id="ix-copper" x1="0.05" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fbc99a" />
          <stop offset="20%" stopColor="#e0995c" />
          <stop offset="44%" stopColor="#b76a30" />
          <stop offset="58%" stopColor="#99551f" />
          <stop offset="72%" stopColor="#cc7f42" />
          <stop offset="88%" stopColor="#8a4715" />
          <stop offset="100%" stopColor="#5d2c0c" />
        </linearGradient>
<linearGradient id="ix-copper-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5e2d0f" />
          <stop offset="10%" stopColor="#a55f2b" />
          <stop offset="24%" stopColor="#f7c294" />
          <stop offset="38%" stopColor="#cf8347" />
          <stop offset="52%" stopColor="#9c4f1c" />
          <stop offset="68%" stopColor="#e8a873" />
          <stop offset="84%" stopColor="#94501d" />
          <stop offset="100%" stopColor="#511f06" />
        </linearGradient>
<linearGradient id="ix-iron" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#9aa4ae" />
          <stop offset="22%" stopColor="#6b757f" />
          <stop offset="48%" stopColor="#454e57" />
          <stop offset="70%" stopColor="#333b43" />
          <stop offset="100%" stopColor="#1e242a" />
        </linearGradient>
<linearGradient id="ix-lead" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#31363c" />
          <stop offset="26%" stopColor="#6c757e" />
          <stop offset="46%" stopColor="#98a2ac" />
          <stop offset="70%" stopColor="#5c656e" />
          <stop offset="100%" stopColor="#2b3036" />
        </linearGradient>
<linearGradient id="ix-gold" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#fff6c9" />
          <stop offset="35%" stopColor="#eec02c" />
          <stop offset="60%" stopColor="#c69312" />
          <stop offset="80%" stopColor="#f0cf62" />
          <stop offset="100%" stopColor="#8a6206" />
        </linearGradient>
<linearGradient id="ix-nichrome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5b6572" />
          <stop offset="24%" stopColor="#b8c3ce" />
          <stop offset="42%" stopColor="#e9eff4" />
          <stop offset="62%" stopColor="#8e9aa6" />
          <stop offset="84%" stopColor="#c3cdd7" />
          <stop offset="100%" stopColor="#495260" />
        </linearGradient>

        {/* Brushed-metal sheen: thin parallel lines over the base gradient. */}
        <pattern id="ix-brushed" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="none" />
          <line x1="0" y1="0.6" x2="3" y2="0.6" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="0.5" />
          <line x1="0" y1="2.1" x2="3" y2="2.1" stroke="#0b1220" strokeOpacity="0.10" strokeWidth="0.5" />
        </pattern>

        {/* ── Bench timbers & boards ───────────────────────────────── */}
<linearGradient id="ix-wood" x1="0.02" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#e7bd84" />
          <stop offset="26%" stopColor="#d3a367" />
          <stop offset="58%" stopColor="#bb8548" />
          <stop offset="82%" stopColor="#a06f37" />
          <stop offset="100%" stopColor="#7d5322" />
        </linearGradient>
<linearGradient id="ix-wood-dark" x1="0.02" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#b07b34" />
          <stop offset="30%" stopColor="#96662a" />
          <stop offset="62%" stopColor="#7a4f1f" />
          <stop offset="100%" stopColor="#4f3213" />
        </linearGradient>
<linearGradient id="ix-teak" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#dcb079" />
          <stop offset="40%" stopColor="#c08f52" />
          <stop offset="72%" stopColor="#a2723a" />
          <stop offset="100%" stopColor="#7d5426" />
        </linearGradient>
        <linearGradient id="ix-mahogany" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#8d4a2c" />
          <stop offset="30%" stopColor="#75381f" />
          <stop offset="65%" stopColor="#5d2b16" />
          <stop offset="100%" stopColor="#3f1c0d" />
        </linearGradient>
<pattern id="ix-grain" width="52" height="11" patternUnits="userSpaceOnUse">
          <path d="M0 3.2 q 13 -3.4 26 0.2 t 26 -0.2" fill="none" stroke="#5b3c14" strokeOpacity="0.16" strokeWidth="0.6" />
          <path d="M0 7.4 q 16 2.2 27 -0.6 t 25 1.2" fill="none" stroke="#f8e3bd" strokeOpacity="0.13" strokeWidth="0.5" />
          <path d="M0 5.4 q 20 1.4 30 -0.4 t 22 0.8" fill="none" stroke="#5b3c14" strokeOpacity="0.08" strokeWidth="0.4" />
        </pattern>

        {/* ── Plastics, rubber, paint ──────────────────────────────── */}
<linearGradient id="ix-bakelite" x1="0.05" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#5a4e44" />
          <stop offset="14%" stopColor="#3d342d" />
          <stop offset="46%" stopColor="#282120" />
          <stop offset="78%" stopColor="#1b1614" />
          <stop offset="100%" stopColor="#100c0b" />
        </linearGradient>
<linearGradient id="ix-charcoal" x1="0.05" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#6b7684" />
          <stop offset="18%" stopColor="#4b5563" />
          <stop offset="48%" stopColor="#333b45" />
          <stop offset="76%" stopColor="#242b33" />
          <stop offset="100%" stopColor="#161b21" />
        </linearGradient>
<linearGradient id="ix-cream" x1="0.08" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fffef9" />
          <stop offset="42%" stopColor="#f4eddd" />
          <stop offset="76%" stopColor="#e0d7c2" />
          <stop offset="100%" stopColor="#c4b9a2" />
        </linearGradient>
<linearGradient id="ix-ivory" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor="#c6bda6" />
          <stop offset="22%" stopColor="#f7f2e6" />
          <stop offset="56%" stopColor="#fffdf6" />
          <stop offset="100%" stopColor="#cfc6b0" />
        </linearGradient>
<linearGradient id="ix-red-plastic" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#f88273" />
          <stop offset="22%" stopColor="#e04b3d" />
          <stop offset="52%" stopColor="#bd2a21" />
          <stop offset="78%" stopColor="#961811" />
          <stop offset="100%" stopColor="#6d0f0b" />
        </linearGradient>
<linearGradient id="ix-blue-plastic" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#8cc2f2" />
          <stop offset="24%" stopColor="#3f86c9" />
          <stop offset="56%" stopColor="#1f6cb4" />
          <stop offset="82%" stopColor="#134f88" />
          <stop offset="100%" stopColor="#0b3862" />
        </linearGradient>
<linearGradient id="ix-green-plastic" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#9ce4bd" />
          <stop offset="24%" stopColor="#3aa878" />
          <stop offset="56%" stopColor="#218a5f" />
          <stop offset="82%" stopColor="#146446" />
          <stop offset="100%" stopColor="#0a452f" />
        </linearGradient>
<linearGradient id="ix-rubber" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#6a7480" />
          <stop offset="26%" stopColor="#414a54" />
          <stop offset="62%" stopColor="#2b323a" />
          <stop offset="100%" stopColor="#12161b" />
        </linearGradient>

        {/* ── Glass & liquids ─────────────────────────────────────── */}
<linearGradient id="ix-glass" x1="0.05" y1="0" x2="0.95" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="18%" stopColor="#eaf7ff" stopOpacity="0.42" />
          <stop offset="46%" stopColor="#bfe0f5" stopOpacity="0.20" />
          <stop offset="62%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="82%" stopColor="#9dcbea" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
<linearGradient id="ix-glass-edge" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#d6ecfa" stopOpacity="0.5" />
          <stop offset="58%" stopColor="#8fc0e0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
        </linearGradient>
<linearGradient id="ix-lens-glass" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#f2fbff" stopOpacity="0.8" />
          <stop offset="22%" stopColor="#c9e8fa" stopOpacity="0.45" />
          <stop offset="48%" stopColor="#a5d6f0" stopOpacity="0.42" />
          <stop offset="70%" stopColor="#d6eefa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id="ix-mercury" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8d99a5" />
          <stop offset="30%" stopColor="#eef3f7" />
          <stop offset="60%" stopColor="#b9c4cf" />
          <stop offset="100%" stopColor="#6d7883" />
        </linearGradient>
        <linearGradient id="ix-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9dcf7" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#3f8fc4" stopOpacity="0.95" />
        </linearGradient>

        {/* ── Turned metal ─────────────────────────────────────────── */}
        {/* A brass disc lit from the upper left: exactly how slotted weights photograph. */}
        <radialGradient id="ix-brass-ball" cx="0.34" cy="0.28" r="0.82">
          <stop offset="0%" stopColor="#fff8d8" />
          <stop offset="18%" stopColor="#f0d178" />
          <stop offset="44%" stopColor="#cfa338" />
          <stop offset="68%" stopColor="#a97f1e" />
          <stop offset="88%" stopColor="#7d5a10" />
          <stop offset="100%" stopColor="#4f3806" />
        </radialGradient>
        <radialGradient id="ix-steel-ball" cx="0.34" cy="0.28" r="0.82">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="20%" stopColor="#e6edf4" />
          <stop offset="46%" stopColor="#b6c1cc" />
          <stop offset="72%" stopColor="#828f9d" />
          <stop offset="100%" stopColor="#49535f" />
        </radialGradient>
        <radialGradient id="ix-alu-ball" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#f3f7fa" />
          <stop offset="24%" stopColor="#cfd8e0" />
          <stop offset="58%" stopColor="#9aa6b2" />
          <stop offset="100%" stopColor="#5c666f" />
        </radialGradient>
        {/* Knurled bezel: fine radial teeth, as on a compass or objective ring. */}
        <pattern id="ix-knurl" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="4" height="4" fill="none" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeOpacity="0.30" strokeWidth="1" />
          <line x1="2" y1="0" x2="2" y2="4" stroke="#0b1220" strokeOpacity="0.22" strokeWidth="1" />
        </pattern>
        {/* Etched glass: the diffusing sheen on a lamp envelope. */}
        <radialGradient id="ix-envelope" cx="0.34" cy="0.26" r="0.78">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#f4f9ff" stopOpacity="0.55" />
          <stop offset="62%" stopColor="#dbe9f5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a9bccd" stopOpacity="0.55" />
        </radialGradient>

        {/* ── Finishes that make flat shapes read as real objects ──── */}
        {/* Cast contact shadow under a standing instrument. */}
        <radialGradient id="ix-contact" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0b1220" stopOpacity="0.55" />
          <stop offset="58%" stopColor="#0b1220" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#0b1220" stopOpacity="0" />
        </radialGradient>
        {/* What a lamp does to the surface under it: warm light falling off. */}
        <radialGradient id="ix-lamp-cone" cx="0.5" cy="0" r="0.9">
          <stop offset="0%" stopColor="#fff3cd" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#fde9b0" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#fde9b0" stopOpacity="0" />
        </radialGradient>
        {/* Baked-enamel instrument case, with the rim light real ones catch. */}
        <linearGradient id="ix-enamel" x1="0.06" y1="0" x2="0.42" y2="1">
          <stop offset="0%" stopColor="#6a6f76" />
          <stop offset="16%" stopColor="#4c5158" />
          <stop offset="52%" stopColor="#3a3f45" />
          <stop offset="84%" stopColor="#2b2f34" />
          <stop offset="100%" stopColor="#1d2024" />
        </linearGradient>
        <linearGradient id="ix-enamel-cream" x1="0.08" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="24%" stopColor="#f3ebd9" />
          <stop offset="62%" stopColor="#e2d8c1" />
          <stop offset="88%" stopColor="#cfc3a8" />
          <stop offset="100%" stopColor="#b3a68b" />
        </linearGradient>
        {/* Polished varnish: the wet-looking sheen along a wooden board. */}
        <linearGradient id="ix-varnish" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="16%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#2a1a08" stopOpacity="0.22" />
        </linearGradient>
        {/* Sharp reflection band of a glass window. */}
        <linearGradient id="ix-reflect" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="52%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="74%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Ivorine instrument label, as engraved and filled on the originals. */}
        <linearGradient id="ix-ivorine" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fdfaf1" />
          <stop offset="52%" stopColor="#f2ecdd" />
          <stop offset="100%" stopColor="#d8cfb8" />
        </linearGradient>
        {/* Anodised aluminium, for bench rails and modern cases. */}
        <linearGradient id="ix-anodised" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#9ba6b2" />
          <stop offset="26%" stopColor="#6f7a87" />
          <stop offset="62%" stopColor="#4d5764" />
          <stop offset="86%" stopColor="#39424e" />
          <stop offset="100%" stopColor="#232b34" />
        </linearGradient>

        {/* ── Screens, dials, indicators ───────────────────────────── */}
        <radialGradient id="ix-dial" cx="0.38" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="62%" stopColor="#f6f1e4" />
          <stop offset="100%" stopColor="#ded5c1" />
        </radialGradient>
<linearGradient id="ix-screen-off" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#2b3742" />
          <stop offset="42%" stopColor="#151d25" />
          <stop offset="100%" stopColor="#080d12" />
        </linearGradient>
<linearGradient id="ix-glass-sheen" x1="0.1" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="14%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="32%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="44%" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.20" />
        </linearGradient>
        <linearGradient id="ix-lcd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6ecd2" />
          <stop offset="100%" stopColor="#9dc39a" />
        </linearGradient>
        <linearGradient id="ix-lcd-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6a8" />
          <stop offset="100%" stopColor="#e0a93b" />
        </linearGradient>

        {/* ── Glows: radial falloff used for lamps, LEDs, flames ───── */}
        <radialGradient id="ix-glow-white" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fffdf0" stopOpacity="1" />
          <stop offset="30%" stopColor="#fde68a" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ix-glow-amber" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff8e1" stopOpacity="0.98" />
          <stop offset="26%" stopColor="#fbbf24" stopOpacity="0.68" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ix-glow-red" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff1f0" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#ff3b30" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d90429" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ix-glow-green" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f2fff6" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#22e06a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ix-glow-blue" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#38bdf8" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ix-glow-violet" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f5f0ff" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#a855f7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ix-glow-laser" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="18%" stopColor="#ff5a4d" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
        </radialGradient>

        {/* LED / lamp lenses */}
        <radialGradient id="ix-lens-led-red" cx="0.38" cy="0.32" r="0.72">
          <stop offset="0%" stopColor="#ffe9e6" />
          <stop offset="42%" stopColor="#f2564a" />
          <stop offset="100%" stopColor="#8d1109" />
        </radialGradient>
        <radialGradient id="ix-lens-led-green" cx="0.38" cy="0.32" r="0.72">
          <stop offset="0%" stopColor="#eafff1" />
          <stop offset="42%" stopColor="#2fd063" />
          <stop offset="100%" stopColor="#0b6b2f" />
        </radialGradient>
        <radialGradient id="ix-lens-led-amber" cx="0.38" cy="0.32" r="0.72">
          <stop offset="0%" stopColor="#fff7e6" />
          <stop offset="42%" stopColor="#f5b23c" />
          <stop offset="100%" stopColor="#8a5406" />
        </radialGradient>
        <radialGradient id="ix-lens-led-blue" cx="0.38" cy="0.32" r="0.72">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="42%" stopColor="#3b8ff5" />
          <stop offset="100%" stopColor="#10306b" />
        </radialGradient>
        <radialGradient id="ix-lens-bulb" cx="0.42" cy="0.36" r="0.7">
          <stop offset="0%" stopColor="#fffdf3" stopOpacity="0.98" />
          <stop offset="52%" stopColor="#ffe9a8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c8a75a" stopOpacity="0.28" />
        </radialGradient>
        <radialGradient id="ix-lens-bulb-dark" cx="0.42" cy="0.36" r="0.7">
          <stop offset="0%" stopColor="#e6e9ee" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#9aa3ad" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#5b636c" stopOpacity="0.22" />
        </radialGradient>

        {/* ── Flames ──────────────────────────────────────────────── */}
        <linearGradient id="ix-flame-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
          <stop offset="34%" stopColor="#22c1ea" stopOpacity="0.7" />
          <stop offset="72%" stopColor="#fb923c" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ix-flame-inner" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#93c5fd" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ix-flame-candle" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.2" />
        </linearGradient>

        {/* ── Beam & spectrum ─────────────────────────────────────── */}
        <linearGradient id="ix-spectrum" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="12%" stopColor="#ef4444" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="48%" stopColor="#facc15" />
          <stop offset="66%" stopColor="#22c55e" />
          <stop offset="82%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="ix-beam-red" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#ffd9d4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ff2d2d" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="ix-beam-white" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.35" />
        </linearGradient>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <filter id="ix-drop" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#0b1220" floodOpacity="0.40" />
        </filter>
        <filter id="ix-drop-soft" x="-40%" y="-40%" width="190%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.4" floodColor="#0b1220" floodOpacity="0.32" />
        </filter>
        <filter id="ix-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ix-glow-wide" x="-160%" y="-160%" width="420%" height="420%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ix-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id="ix-blur-8" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="ix-shadow" x="-40%" y="-40%" width="185%" height="200%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="1.5" floodColor="#0b1220" floodOpacity="0.42" />
        </filter>
        <filter id="ix-shadow-lift" x="-50%" y="-50%" width="210%" height="220%">
          <feDropShadow dx="0" dy="3.4" stdDeviation="3.4" floodColor="#0b1220" floodOpacity="0.36" />
        </filter>
        <filter id="ix-emboss" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="b" />
          <feSpecularLighting in="b" surfaceScale="1.6" specularConstant="0.8" specularExponent="18" result="s">
            <feDistantLight azimuth="235" elevation="58" />
          </feSpecularLighting>
          <feComposite in="s" in2="SourceAlpha" operator="in" result="sc" />
          <feComposite in="SourceGraphic" in2="sc" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" />
        </filter>
        <filter id="ix-inner" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="0" dy="1.2" in="SourceAlpha" result="o" />
          <feGaussianBlur in="o" stdDeviation="1.1" result="b" />
          <feComposite in="b" in2="SourceAlpha" operator="out" result="inv" />
          <feFlood floodColor="#0b1220" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="inv" operator="in" result="sh" />
          <feComposite in="sh" in2="SourceGraphic" operator="over" />
        </filter>
        <filter id="ix-rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g" result="t">
            <feFuncA type="linear" slope="0.16" />
          </feComponentTransfer>
          <feComposite in="t" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="ix-paper" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="3" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g" result="t">
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
          <feComposite in="t" in2="SourceGraphic" operator="in" />
        </filter>

        {/* Optic-ray arrowheads. */}
        <marker id="ix-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
        </marker>

        {/* ── Bench surface (used by the workbench canvas) ─────────── */}
        <pattern id="ix-matte" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="none" />
          <circle cx="1.4" cy="1.6" r="0.35" fill="#000" fillOpacity="0.06" />
          <circle cx="4.2" cy="3.4" r="0.3" fill="#fff" fillOpacity="0.05" />
        </pattern>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small helpers shared by the instrument artwork                       */
/* ------------------------------------------------------------------ */

/** Soft contact shadow under a part, so nothing looks like it floats. */
export function Contact({ cx, cy, rx, ry, opacity = 0.34 }: { cx: number; cy: number; rx: number; ry?: number; opacity?: number }) {
  // Two passes: a tight dark core where the object touches the bench, plus a
  // wide soft pool of shadow. One blurred ellipse always reads as a smudge.
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx * 1.9} ry={(ry ?? rx * 0.24) * 2.1} fill="url(#ix-contact)" opacity={opacity * 1.5} />
      <ellipse cx={cx} cy={cy + 0.4} rx={rx} ry={ry ?? rx * 0.24} fill="#0b1220" opacity={opacity * 0.9} filter="url(#ix-blur)" />
      <ellipse cx={cx} cy={cy - 0.2} rx={rx * 0.82} ry={(ry ?? rx * 0.24) * 0.7} fill="#0b1220" opacity={opacity * 0.55} filter="url(#ix-blur)" />
    </g>
  );
}

/** A glossy highlight streak: the single most useful realism trick. */
export function Sheen({
  x,
  y,
  w,
  h,
  rx = 2,
  opacity = 0.55,
  rotate = -14
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  opacity?: number;
  rotate?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill="#ffffff"
      opacity={opacity}
      transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}
    />
  );
}
