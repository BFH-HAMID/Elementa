import { describe, expect, it } from 'vitest';
import { symbolLatex, symbolNeedsMath, symbolText } from '../utils';

describe('symbolNeedsMath', () => {
  it('flags only symbols that carry notation', () => {
    expect(symbolNeedsMath('k_1')).toBe(true);
    expect(symbolNeedsMath('ΔH_vap')).toBe(true);
    expect(symbolNeedsMath('ε')).toBe(true);
    expect(symbolNeedsMath('T^4')).toBe(true);
    expect(symbolNeedsMath('[H+]')).toBe(false);
    expect(symbolNeedsMath('pH')).toBe(false);
    expect(symbolNeedsMath('V')).toBe(false);
  });
});

describe('symbolLatex', () => {
  it('typesets scripts and Greek letters', () => {
    expect(symbolLatex('k_1')).toBe('k_{1}');
    expect(symbolLatex('E_a')).toBe('E_{a}');
    expect(symbolLatex('ΔH_vap')).toBe('\\Delta H_{\\mathrm{vap}}');
    expect(symbolLatex('ΔG')).toBe('\\Delta G');
    expect(symbolLatex('ε')).toBe('\\epsilon');
    expect(symbolLatex('δ_m')).toBe('\\delta_{m}');
    expect(symbolLatex('T^4')).toBe('T^{4}');
    expect(symbolLatex('I_0')).toBe('I_{0}');
    expect(symbolLatex('T_1')).toBe('T_{1}');
    expect(symbolLatex('E°')).toBe('E^{\\circ}');
  });

  it('leaves plain symbols alone', () => {
    expect(symbolLatex('pH')).toBe('pH');
    expect(symbolLatex('V')).toBe('V');
    expect(symbolLatex('[H+]')).toBe('[H+]');
  });
});

describe('symbolText', () => {
  it('uses unicode scripts where a glyph exists', () => {
    expect(symbolText('k_1')).toBe('k₁');
    expect(symbolText('E_a')).toBe('Eₐ');
    expect(symbolText('I_0')).toBe('I₀');
    expect(symbolText('ΔH_vap')).toBe('ΔHᵥₐₚ');
    expect(symbolText('T^4')).toBe('T⁴');
    expect(symbolText('rate constant at T_1')).toBe('rate constant at T₁');
  });

  it('keeps a subscript readable when no glyph exists', () => {
    expect(symbolText('f_beat')).toBe('f_beat');
    expect(symbolText('f_beat = |f₁ − f₂|')).toBe('f_beat = |f₁ − f₂|');
    expect(symbolText('k_1 = 2.5 s⁻¹')).toBe('k₁ = 2.5 s⁻¹');
  });
});
