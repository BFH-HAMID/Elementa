'use client';

import { Calculator as CalculatorIcon, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { EquationEntry } from '@/lib/schemas';
import { convertToSI, solveEquation, unitOptions, type CalculatorResult } from '@/lib/calculations';
import { calculatorModels, inputsNeeded, solveWithModel, unitChoicesFor } from '@/lib/calculator-models';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tex } from './Tex';
import { formatNumber } from '@/lib/utils';

function optionsFor(unit: string, symbol: string): string[] {
  if (symbol === 'pH' || symbol === 'Q' || symbol === 'n' || symbol === 'm' || symbol === 'A' || symbol === 'B' || symbol === 'C' || symbol === 'D') {
    if (symbol === 'm') return unitOptions.kg;
    if (symbol === 'n') return unitOptions.dimensionless;
    return unitOptions.dimensionless;
  }
  if (unit === 'm' || unit === 'm/s' || unit === 'm/s²' || unit === 'm³') return unit === 'm³' ? ['m³', 'L', 'mL'] : unitOptions.m;
  if (unit === 's' || unit === 's⁻¹') return unitOptions.s;
  if (unit === 'kg' || unit === 'kg/mol') return unitOptions.kg;
  if (unit === 'V') return unitOptions.V;
  if (unit === 'A') return unitOptions.I;
  if (unit === 'Ω') return unitOptions.R;
  if (unit === 'N' || unit === 'N/m') return unitOptions.F;
  if (unit === 'Pa') return unitOptions.Pa;
  if (unit === 'K') return unitOptions.K;
  if (unit === 'mol' || unit === 'mol/L') return unit === 'mol/L' ? unitOptions.molarity : unitOptions.mol;
  if (unit === 'L') return unitOptions.L;
  if (unit === 'J') return unitOptions.J;
  if (unit === 'W') return unitOptions.W;
  if (unit === 'Hz') return unitOptions.Hz;
  if (unit === 'C') return unitOptions.C;
  return [unit];
}

export function Calculator({ equation }: { equation: EquationEntry }) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations('equations');
  const tCommon = useTranslations('common');
  // A declarative model may cover only part of the reference table — for example
  // the closed form of Gauss's law ignores E — so drive the inputs from the model
  // when one exists and fall back to the full variable list otherwise.
  const model = calculatorModels[equation.slug];
  const bySymbol = useMemo(
    () => new Map(equation.variables.map((variable) => [variable.symbol, variable])),
    [equation.variables]
  );
  const symbols = useMemo(
    () => (model ? Object.keys(model.unit) : equation.variables.map((variable) => variable.symbol)),
    [model, equation.variables]
  );
  const [unknown, setUnknown] = useState(symbols[0] ?? '');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [invalid, setInvalid] = useState(false);
  const labels = locale === 'bn';

  // Declarative models ship their own unit choices, so prefer those when present.
  const choicesFor = (unit: string, symbol: string) =>
    model ? unitChoicesFor(unit, symbol).map((choice) => choice.label) : optionsFor(unit, symbol);
  const unitFor = (symbol: string, unit: string) => units[symbol] ?? choicesFor(unit, symbol)[0] ?? unit;
  const reset = () => { setInputs({}); setUnits({}); setResult(null); setInvalid(false); };
  // Switching equations reuses this component instance, so adopt the new symbol set.
  const [slug, setSlug] = useState(equation.slug);
  if (slug !== equation.slug) { setSlug(equation.slug); setUnknown(symbols[0] ?? ''); setInputs({}); setUnits({}); setResult(null); setInvalid(false); }

  const calculate = () => {
    const raw: Record<string, number> = {};
    const chosenUnits: Record<string, string> = {};
    const values: Record<string, number> = {};
    for (const symbol of knownVariables) {
      if (symbol === unknown) continue;
      const variable = bySymbol.get(symbol);
      const typed = Number(inputs[symbol]);
      if (!inputs[symbol] || !Number.isFinite(typed)) { setInvalid(true); setResult(null); return; }
      raw[symbol] = typed;
      chosenUnits[symbol] = unitFor(symbol, variable?.unit ?? model?.unit[symbol] ?? '');
      values[symbol] = convertToSI(typed, chosenUnits[symbol]);
    }

    const solved = model
      ? solveWithModel(equation.slug, raw, chosenUnits, unknown)
      : solveEquation(equation.slug, values, unknown);

    if (!solved || !Number.isFinite(solved.result)) { setInvalid(true); setResult(null); return; }
    setInvalid(false); setResult(solved);
  };

  const variableName = (variable: EquationEntry['variables'][number]) => labels ? variable.name_bn ?? variable.name : variable.name;
  // A model that chains two relations only asks for the symbols its
  // rearrangement actually touches, so `E_k = ½mv²` does not also demand `p`.
  const knownVariables = useMemo(
    () => (model ? inputsNeeded(equation.slug, unknown) : symbols.filter((symbol) => symbol !== unknown)),
    [model, equation.slug, unknown, symbols]
  );

  return <Card className="overflow-hidden">
    <CardHeader className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
      <div className="flex items-center gap-2 text-physics-600 dark:text-physics-200">
        <CalculatorIcon size={18} />
        <CardTitle>{t('calculator')}</CardTitle>
      </div>
      <p className="text-sm muted">{t('enterValues')} · {equation.title_en}</p>
      <div className="equation-display rounded-xl bg-[var(--surface)] px-3"><Tex latex={equation.latex} /></div>
      {model && symbols.length < equation.variables.length && (
        <p className="text-xs muted">
          {labels ? 'এই ক্যালকুলেটরে ব্যবহৃত চলক: ' : 'This calculator uses: '}
          <span className="font-mono font-bold">{symbols.join(', ')}</span>
        </p>
      )}
    </CardHeader>
    <CardBody className="space-y-6 pt-6">
      <div>
        <label htmlFor={`unknown-${equation.slug}`} className="mb-2 block text-sm font-extrabold">{t('selectUnknown')}</label>
        <select
          id={`unknown-${equation.slug}`}
          value={unknown}
          onChange={(event) => { setUnknown(event.target.value); setResult(null); setInvalid(false); }}
          className="input"
        >
          <option value="">—</option>
          {symbols.map((symbol) => {
            const variable = bySymbol.get(symbol);
            return (
              <option key={symbol} value={symbol}>
                {symbol}{variable ? ` · ${variableName(variable)}` : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {knownVariables.map((symbol) => {
          const variable = bySymbol.get(symbol);
          const unit = variable?.unit ?? model?.unit[symbol] ?? '';
          const options = choicesFor(unit, symbol);
          return (
            <div key={symbol}>
              <label htmlFor={`${equation.slug}-${symbol}`} className="mb-2 block text-sm font-bold">
                {symbol} {variable && <span className="font-normal muted">{variableName(variable)}</span>}
              </label>
              <div className="flex gap-2">
                <input
                  id={`${equation.slug}-${symbol}`}
                  type="number"
                  inputMode="decimal"
                  value={inputs[symbol] ?? ''}
                  onChange={(event) => setInputs((current) => ({ ...current, [symbol]: event.target.value }))}
                  placeholder="0"
                  className="input min-w-0 flex-1"
                />
                <select
                  value={unitFor(symbol, unit)}
                  onChange={(event) => setUnits((current) => ({ ...current, [symbol]: event.target.value }))}
                  className="input w-[7.5rem] shrink-0 px-2 text-xs"
                  aria-label={`${t('unit')} ${symbol}`}
                >
                  {options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {invalid && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">
          {t('invalid')}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={calculate} icon={<CalculatorIcon size={16} />}>{t('calculate')}</Button>
        <Button type="button" variant="ghost" onClick={reset} icon={<RotateCcw size={15} />}>{tCommon('clear')}</Button>
      </div>

      {result && (
        <div className="rounded-2xl border border-chemistry-200 bg-chemistry-50 p-4 dark:border-chemistry-700 dark:bg-chemistry-900/50">
          <p className="text-xs font-black uppercase tracking-widest text-chemistry-700 dark:text-chemistry-200">{t('result')}</p>
          <p className="mt-1 text-3xl font-black text-chemistry-700 dark:text-chemistry-100">
            {formatNumber(result.result, 6)} <span className="text-base font-bold">{result.unit}</span>
          </p>
          <div className="mt-4 border-t border-chemistry-200 pt-3 dark:border-chemistry-700">
            <p className="mb-2 text-sm font-extrabold">{t('working')}</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-chemistry-900 dark:text-chemistry-100">
              {result.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
        </div>
      )}
    </CardBody>
  </Card>;
}
