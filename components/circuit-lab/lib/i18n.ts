'use client';

/**
 * Circuit Lab UI strings. Kept beside the module (rather than in messages/*.json)
 * so the lab can ship its own copy without touching the shared site catalogue.
 * Keys are typed; a missing Bangla string falls back to English.
 */

import { useLocale } from 'next-intl';

type Locale = 'bn' | 'en';

const STRINGS = {
  en: {
    title: 'Circuit Lab',
    subtitle: 'Build, wire and simulate real circuits and microcontroller sketches in your browser.',
    run: 'Run',
    stop: 'Stop',
    reset: 'Reset',
    speed: 'Speed',
    undo: 'Undo',
    redo: 'Redo',
    rotate: 'Rotate',
    flip: 'Flip',
    duplicate: 'Duplicate',
    delete: 'Delete',
    fit: 'Fit to screen',
    flow: 'Current flow',
    snap: 'Snap to grid',
    newProject: 'New project',
    save: 'Save',
    load: 'Load',
    exportFile: 'Export file',
    importFile: 'Import file',
    share: 'Copy share link',
    exportPng: 'Export PNG',
    exportSvg: 'Export SVG',
    help: 'Keyboard shortcuts',
    library: 'Parts',
    search: 'Search parts…',
    inspector: 'Inspector',
    noSelection: 'Select a part or wire to edit its properties.',
    info: 'Info',
    pinout: 'Pinout',
    ratings: 'Ratings',
    properties: 'Properties',
    wireColor: 'Wire colour',
    code: 'Sketch',
    serial: 'Serial monitor',
    examples: 'Examples',
    analysis: 'BOM & netlist',
    check: 'Check circuit',
    guide: 'Guide',
    bom: 'Bill of materials',
    netlist: 'Netlist',
    noIssues: 'No problems found.',
    clear: 'Clear',
    sendHint: 'Serial output appears here while the sketch runs.',
    unpowered: 'Board is unpowered — it has no USB port, so it needs a supply on VIN or 5V.',
    poweredOn: 'Powered',
    burnt: 'Burnt out',
    warnings: 'Warnings',
    shortCircuit: 'Short circuit detected — power is being dumped into a short.',
    openCircuit: 'Open circuit — no supply is connected.',
    fitDone: 'Fitted',
    copied: 'Link copied',
    loaded: 'Project loaded',
    imported: 'Project imported',
    invalidFile: 'That file is not a valid circuit project.',
    emptyBench: 'Drag a part from the library onto the bench, or load an example.',
    dragHint: 'Drag parts here, or tap a part to add it at the centre.',
    wireHint: 'Drag from one pin to another to wire them. Drag a wire’s handle to bend it.',
    deleteWire: 'Delete wire',
    addBend: 'Add bend point',
    removeBend: 'Remove bend point',
    setColor: 'Set colour',
    selectAll: 'Select all',
    contextMenu: 'Actions',
    helpTitle: 'Keyboard shortcuts',
    shortcuts: [
      ['R', 'Rotate selection 90°'],
      ['F', 'Flip selection'],
      ['Ctrl/⌘ + D', 'Duplicate'],
      ['Delete / Backspace', 'Delete selection'],
      ['Ctrl/⌘ + Z / Shift + Z', 'Undo / Redo'],
      ['Ctrl/⌘ + A', 'Select all'],
      ['Space + drag or middle-drag', 'Pan'],
      ['Scroll / pinch', 'Zoom'],
      ['Arrow keys', 'Nudge selection (Shift = 10 units)'],
      ['Esc', 'Cancel wire / clear selection'],
      ['F5', 'Run / Stop']
    ] as [string, string][],
    close: 'Close',
    tooManyParts: 'Large bench — simulation runs at reduced speed.'
  },
  bn: {
    title: 'সার্কিট ল্যাব',
    subtitle: 'ব্রাউজারে আসল সার্কিট ও মাইক্রোকন্ট্রোলার স্কেচ তৈরি, ওয়্যার ও সিমুলেট করুন।',
    run: 'চালু',
    stop: 'থামান',
    reset: 'রিসেট',
    speed: 'গতি',
    undo: 'আনডু',
    redo: 'রিডু',
    rotate: 'ঘোরান',
    flip: 'উল্টান',
    duplicate: 'কপি করুন',
    delete: 'মুছুন',
    fit: 'স্ক্রিনে মানান',
    flow: 'কারেন্ট প্রবাহ',
    snap: 'গ্রিডে স্ন্যাপ',
    newProject: 'নতুন প্রকল্প',
    save: 'সংরক্ষণ',
    load: 'লোড',
    exportFile: 'ফাইল রপ্তানি',
    importFile: 'ফাইল আমদানি',
    share: 'শেয়ার লিংক কপি',
    exportPng: 'PNG রপ্তানি',
    exportSvg: 'SVG রপ্তানি',
    help: 'কীবোর্ড শর্টকাট',
    library: 'যন্ত্রাংশ',
    search: 'যন্ত্রাংশ খুঁজুন…',
    inspector: 'ইন্সপেক্টর',
    noSelection: 'সম্পাদনার জন্য কোনো যন্ত্রাংশ বা ওয়্যার বেছে নিন।',
    info: 'তথ্য',
    pinout: 'পিনআউট',
    ratings: 'রেটিং',
    properties: 'বৈশিষ্ট্য',
    wireColor: 'ওয়্যারের রং',
    code: 'স্কেচ',
    serial: 'সিরিয়াল মনিটর',
    examples: 'উদাহরণ',
    analysis: 'BOM ও নেটলিস্ট',
    check: 'সার্কিট যাচাই',
    guide: 'গাইড',
    bom: 'যন্ত্রাংশ তালিকা',
    netlist: 'নেটলিস্ট',
    noIssues: 'কোনো সমস্যা পাওয়া যায়নি।',
    clear: 'মুছুন',
    sendHint: 'স্কেচ চললে সিরিয়াল আউটপুট এখানে দেখাবে।',
    unpowered: 'বোর্ড বিদ্যুৎহীন — এতে USB নেই, তাই VIN বা 5V-তে সরবরাহ দিন।',
    poweredOn: 'সরবরাহ আছে',
    burnt: 'পুড়ে গেছে',
    warnings: 'সতর্কতা',
    shortCircuit: 'শর্ট সার্কিট — সরবরাহ সরাসরি শর্টে যাচ্ছে।',
    openCircuit: 'ওপেন সার্কিট — কোনো সরবরাহ যুক্ত নেই।',
    fitDone: 'মানানো হয়েছে',
    copied: 'লিংক কপি হয়েছে',
    loaded: 'প্রকল্প লোড হয়েছে',
    imported: 'প্রকল্প আমদানি হয়েছে',
    invalidFile: 'ফাইলটি বৈধ সার্কিট প্রকল্প নয়।',
    emptyBench: 'লাইব্রেরি থেকে যন্ত্রাংশ টেনে আনুন, অথবা একটি উদাহরণ লোড করুন।',
    dragHint: 'যন্ত্রাংশ এখানে টেনে আনুন, অথবা ট্যাপ করে মাঝখানে যোগ করুন।',
    wireHint: 'এক পিন থেকে অন্য পিনে টেনে ওয়্যার করুন। ওয়্যারের হাতল টেনে বাঁকান।',
    deleteWire: 'ওয়্যার মুছুন',
    addBend: 'বাঁক যোগ করুন',
    removeBend: 'বাঁক সরান',
    setColor: 'রং সেট করুন',
    selectAll: 'সব বেছে নিন',
    contextMenu: 'অ্যাকশন',
    helpTitle: 'কীবোর্ড শর্টকাট',
    shortcuts: [
      ['R', 'নির্বাচন ৯০° ঘোরান'],
      ['F', 'নির্বাচন উল্টান'],
      ['Ctrl/⌘ + D', 'কপি করুন'],
      ['Delete / Backspace', 'নির্বাচন মুছুন'],
      ['Ctrl/⌘ + Z / Shift + Z', 'আনডু / রিডু'],
      ['Ctrl/⌘ + A', 'সব বেছে নিন'],
      ['Space + টেনে নিন বা মধ্য-বাটন', 'প্যান'],
      ['স্ক্রল / পিঞ্চ', 'জুম'],
      ['তীর চিহ্ন', 'নির্বাচন সরান (Shift = ১০ ইউনিট)'],
      ['Esc', 'ওয়্যার বাতিল / নির্বাচন মুছুন'],
      ['F5', 'চালু / থামান']
    ] as [string, string][],
    close: 'বন্ধ করুন',
    tooManyParts: 'বড় বেঞ্চ — সিমুলেশন ধীর গতিতে চলছে।'
  }
} as const;

export type CircuitKey = Exclude<keyof (typeof STRINGS)['en'], 'shortcuts'>;

export function circuitT(locale: Locale, key: CircuitKey): string {
  const table = STRINGS[locale] as Record<string, unknown>;
  const val = table[key];
  if (typeof val === 'string') return val;
  return String((STRINGS.en as Record<string, unknown>)[key] ?? key);
}

export function circuitShortcuts(locale: Locale): [string, string][] {
  return (STRINGS[locale]?.shortcuts ?? STRINGS.en.shortcuts) as [string, string][];
}

export function useCircuitI18n() {
  const locale = (useLocale() === 'bn' ? 'bn' : 'en') as Locale;
  return {
    locale,
    isBangla: locale === 'bn',
    t: (key: CircuitKey) => circuitT(locale, key),
    shortcuts: circuitShortcuts(locale)
  };
}
