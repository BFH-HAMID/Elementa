'use client';

import { Download, Table2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { downloadText, escapeCsv, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function DataTable({ rows, onClear }: { rows: Record<string, number | string>[]; onClear: () => void }) {
  const t = useTranslations('common');
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  const exportCsv = () => { const csv = [columns.map(escapeCsv).join(','), ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(','))].join('\n'); downloadText('physchem-lab-data.csv', csv, 'text/csv;charset=utf-8'); };
  return <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest muted"><Table2 size={15} />{t('dataTable')}</div><div className="flex gap-1">{rows.length > 0 && <><Button variant="ghost" className="min-h-8 rounded-lg px-2 text-xs" onClick={exportCsv} icon={<Download size={14} />}>{t('exportCsv')}</Button><Button variant="ghost" className="min-h-8 rounded-lg px-2 text-xs" onClick={onClear}>{t('clear')}</Button></>}</div></div>{rows.length === 0 ? <p className="rounded-xl bg-[var(--surface-soft)] p-5 text-center text-sm muted">Record a data point to build a table.</p> : <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr className="border-b border-[var(--line)]">{columns.map((column) => <th key={column} className="px-2 py-2 font-black uppercase tracking-wider muted">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-[var(--line)] last:border-0">{columns.map((column) => <td key={column} className="px-2 py-2 font-mono">{typeof row[column] === 'number' ? formatNumber(row[column] as number, 5) : row[column]}</td>)}</tr>)}</tbody></table></div>}</section>;
}
