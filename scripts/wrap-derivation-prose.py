"""Typeset the bare symbols left inside prose fields, span by span.

`scripts/wrap-prose-maths.py` wraps a prose field only when every relation in it
converts cleanly, and it skips fields that already contain `$…$`. That left 150
fields — derivation prose, variable names, summary lines, worked-example notes —
showing raw notation such as `E_a`, `ΔH_vap/(RT²)`, `k_BT/h`, `μ_0`, `v_cm = ωR`
and `e^(−bt/2m)` next to properly typeset mathematics on the same page. Bangla
readers also saw Bangla numerals inside a formula (`২πR`), which no textbook does.

This pass works on the gaps between existing `$…$` spans instead of whole fields,
so one stubborn expression can no longer block its neighbours:

* a span must contain a relation or subscript mark (`=`, `_`, `^`, `×`, `√`, a
  unicode super/subscript or a Greek letter) — plain words are never swept in;
* the span stops at any prose word, at Bangla text, and at a token glued to a
  Bangla suffix (`v_dΔt-এর`), so Bangla grammar is never broken;
* conversion reuses `content_format_lib.normalise_latex(prose=True)`, then the
  result must have balanced braces and no Bangla left inside;
* `scripts/check-math.mjs` renders every span with KaTeX afterwards, so a bad
  conversion fails the check instead of reaching the site.

Derived lab-guide fields (`key_points`, `report`) are regenerated from the fixed
sources by `scripts/add-lab-guide-points.py` rather than edited here.

Run: python3 scripts/wrap-derivation-prose.py [--check] [--verbose]
"""

import argparse
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

from content_format_lib import (  # noqa: E402
    BANGLA_DIGITS,
    join_mdx,
    normalise_latex,
    parsed_value,
    split_mdx,
)

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'

# Top-level prose fields only. Nested leaves (`variables[].symbol`,
# `derivation_steps[].latex`, `unit`, `si_unit`) feed the calculator models and
# KaTeX directly, so this pass must never touch them.
PROSE_KEYS = {
    'derivation', 'derivation_bn', 'summary_en', 'summary_bn',
    'reference_note_en', 'reference_note_bn', 'assumptions', 'assumptions_bn',
    'applications', 'applications_bn', 'theory', 'theory_bn',
    'calculation', 'calculation_bn', 'aim', 'aim_bn',
    'procedure', 'procedure_bn', 'precautions', 'precautions_bn',
    'sources_of_error', 'sources_of_error_bn',
}
# Leaves inside a list of mappings. `variables[].symbol`, `unit`, `si_unit` and
# every `latex` field are data for the calculator and KaTeX, never prose.
NESTED_PROSE_KEYS = {
    'name', 'name_bn', 'step_en', 'step_bn', 'label_en', 'label_bn',
    'note_en', 'note_bn', 'q', 'a', 'q_bn', 'a_bn',
}
DERIVED_KEYS = {'key_points', 'key_points_bn', 'report', 'report_bn'}

MARKS = re.compile(r'[=_^<>≈∝≤≥×·√±→⇌⟨⟩∫Σ⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉\u1d62-\u1d65\u208d\u208eα-ωΑ-Ω]')
# Characters a bare notation token may be built from. A backslash is absent on
# purpose: a token carrying one is already LaTeX inside a `$…$` span.
SYMBOL_CHARS = (
    'A-Za-z0-9'
    'Α-Ωα-ω'
    r"_^=<>+/*\-−–.,'′|(){}\[\]"
    '×·±√∝≤≥≈≠→⇌⟨⟩∫Σ∞°%'
    '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉₊₋½⅓¼⅔¾'
    '\u09e6-\u09ef\u0300-\u036f\u1d62-\u1d65\u2c7c\u208d\u208e'
)
SYMBOL = re.compile('^[' + SYMBOL_CHARS + ']{1,16}$')
# An ordinary word: all lowercase (`gas`, `and`) or a capitalised word (`One`).
# Two-letter species (`ES`, `Ag`) and mixed case (`NaCl`) stay symbolic.
PROSE_WORD = re.compile(r'^(?:[a-z]{2,}|[A-Z][a-z]{2,})$')
ALLOWED_WORDS = {
    'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'max', 'min', 'mol', 'kg', 'cm', 'mm',
    'km', 'rad', 'deg', 'const', 'constant', 'avg', 'rms', 'std', 'per',
}
# `(K)`, `(mg/L)`, `(K⁴)`: the unit a column is measured in, never a quantity.
UNIT_PAREN = re.compile(r'^\([A-Za-z0-9/%·°\u00b9\u00b2\u00b3\u2070-\u2079\u0391-\u03C9]{1,10}\)$')
# `(kg m²)`, `(Pa s)`, `(1/s)`: a trailing unit belongs to the sentence, not to
# the quantity — but only when no operator binds it to what precedes it.
UNIT_TAIL = re.compile(r'\s*\([A-Za-z0-9/%·° \u00b9\u00b2\u00b3\u2070-\u2079]{1,14}\)$')
BINDING = re.compile(r'[=<>≈∝≤≥→⇌×·*/]')
# A bare unit is not a quantity: `100 m⁻¹`, `m³/C` and `kg m²` stay in the
# sentence, while `T²`, `Ca²⁺` and `2mc_x` are typeset.
UNITS = {
    'm', 's', 'g', 'kg', 'mg', 'cm', 'mm', 'km', 'nm', 'mL', 'L', 'mol', 'min', 'h',
    'Hz', 'kHz', 'MHz', 'Pa', 'kPa', 'atm', 'bar', 'N', 'J', 'kJ', 'W', 'kW', 'V',
    'mV', 'A', 'mA', 'C', 'K', 'S', 'mS', 'F', 'H', 'T', 'eV', 'dB', 'rad', 'deg',
    'ppm', 'M', 'u', 'amu', 'Da', 'lm', 'lx', 'cd', 'Bq', 'Gy', 'Sv', 'kat',
}
UNIT_LETTERS = re.compile(r'[A-Za-z]{1,4}')
RELATION = re.compile(r'[=<>≈∝≤≥→⇌]')
MULTI_UNIT = re.compile(r'mol|min|nm|mm|cm|km|kg|mg|mL|Hz|Pa|atm|bar|rad|eV|dB|ppm|amu')


def is_unit_only(fragment: str) -> bool:
    # A slash in `m³/C` joins two units, not two quantities.
    if '_' in fragment or RELATION.search(fragment):
        return False
    letters = UNIT_LETTERS.findall(re.sub(r'\\[A-Za-z]+', '', fragment))
    if not letters or any(word not in UNITS for word in letters):
        return False
    return bool(re.search(r'[/·\s⁺⁻^]', fragment) or MULTI_UNIT.search(fragment))


BANGLA = re.compile(r'[\u0980-\u09FF]')
OPERATOR_ONLY = re.compile(r'[=+\-−–×/→⇌<>≈±·]+')
BANGLA_LETTER = re.compile(r'[\u0980-\u09E5]')
# Symbols `normalise_latex` keeps as unicode but KaTeX wants as macros.
LATEX_OPERATORS = (
    ('⇌', r'\rightleftharpoons '), ('⟨', r'\langle '), ('⟩', r'\rangle '),
    ('∫', r'\int '), ('∞', r'\infty '), ('°', r'^\circ '), ('‖', r'\| '),
)
DELIMITERS = '.,;:।?!…'
MAX_SPAN = 100


def group_exponents(fragment: str) -> str:
    """Turn `e^(−bt/2m)` into `e^{−bt/2m}` so the exponent keeps its grouping."""
    out = []
    index = 0
    while index < len(fragment):
        found = fragment.find('^(', index)
        if found < 0:
            out.append(fragment[index:])
            break
        out.append(fragment[index:found])
        depth = 0
        end = None
        for position in range(found + 1, len(fragment)):
            if fragment[position] == '(':
                depth += 1
            elif fragment[position] == ')':
                depth -= 1
                if depth == 0:
                    end = position
                    break
        if end is None:
            out.append(fragment[found:])
            break
        out.append('^{' + fragment[found + 2:end] + '}')
        index = end + 1
    return ''.join(out)


# Two-letter tokens are ambiguous: `Ag` is silver, `At` is a preposition. Only a
# word list can tell them apart, so short function words never join a span.
STOP_WORDS = {
    'a', 'an', 'at', 'as', 'is', 'it', 'its', 'in', 'on', 'of', 'or', 'to', 'be',
    'by', 'if', 'so', 'we', 'no', 'do', 'up', 'out', 'off', 'the', 'and', 'for',
    'with', 'from', 'that', 'this', 'not', 'are', 'was', 'were', 'use', 'per',
    'over', 'into', 'then', 'than', 'when', 'which', 'while', 'after', 'before',
    'between', 'against', 'using', 'give', 'gives', 'take', 'keep', 'add', 'one',
    'two', 'all', 'any', 'may', 'can', 'has', 'have', 'only', 'same', 'each',
    'both', 'such', 'there', 'here', 'where', 'these', 'those', 'his', 'her',
}
# `At` is a preposition but `Ag` is silver, so the capitalised forms are listed
# separately and a single uppercase letter is never a word.
STOP_CAPITAL = {word.capitalize() for word in STOP_WORDS if len(word) >= 2}


EMBEDDED_WORD = re.compile(r'[A-Za-z]{2,}')


def is_symbol_token(token: str) -> bool:
    """True when a token is notation rather than an English or Bangla word.

    Words hidden inside a bracket are what broke the first automated pass
    (`$\\Delta E=e\\Delta V (in$ eV`, `$n(ascorbic acid)=n(I_{2})$`), so every
    alphabetic run in the token is tested — except subscript and superscript
    labels, which are notation (`V_{\\mathrm{sample}}`, `k_a`).
    """
    stripped = token.strip(DELIMITERS)
    if not stripped or not SYMBOL.match(stripped):
        return False
    core = re.sub(r'[_^°]\{?[A-Za-z0-9]+\}?', '', stripped)
    for word in EMBEDDED_WORD.findall(core):
        if word in ALLOWED_WORDS:
            continue
        if word in STOP_WORDS or word in STOP_CAPITAL:
            return False
        # `dt` and `dl` are differentials, but `gas` and `slope` are prose.
        if len(word) >= 3 and (word.islower() or PROSE_WORD.match(word)):
            return False
    return True


# Notation glued to a Bangla suffix (`T⁴−T₀⁴-এর`, `v_dΔt-এর`) is split so the
# formula typesets and the suffix stays Bangla text; the marker is removed again
# once the spans are written.
GLUED = re.compile(
    r'([0-9A-Za-z\u0391-\u03C9\u2070-\u209f_^=+*/().])'
    r'([\-\u2212\u2013]*)'
    r'([\u0980-\u09E5])'
)
SENTINEL = '\x01'


def wrap_prose_spans(prose):
    """Wrap bare notation in the gaps between existing `$…$` spans."""
    if not isinstance(prose, str) or not prose:
        return prose

    prose = GLUED.sub(lambda m: m.group(1) + ' ' + SENTINEL + m.group(2) + m.group(3), prose)
    pieces = re.split(r'(\$[^$]*\$)', prose)
    out = []
    for piece in pieces:
        if piece.startswith('$'):
            out.append(piece)
            continue
        out.append(_wrap_piece(piece))
    joined = ''.join(out).replace(' ' + SENTINEL, '')
    # `$R=100$ $k\Omega$` reads as two quantities; one value with its unit is
    # a single span separated by a thin space.
    return re.sub(r'\$ \$', r'\\ ', joined)


def _extendable(token: str) -> bool:
    """A neighbouring token may join the span unless it is a bare unit."""
    return is_symbol_token(token) and not UNIT_PAREN.match(token.strip(DELIMITERS))


def _split_span(tokens: list[str], start: int, end: int) -> list[tuple[int, int]]:
    """A comma or semicolon closes a clause, so it also closes the span.

    `$EDTA, Ca^{2+}$` and `$BO=1; He_{2}$` read as one quantity each, which they
    are not: the punctuation stays with the text between two spans.
    """
    pieces = []
    current = start
    depth = 0
    for index in range(start, end):
        token = tokens[index]
        depth += token.count('(') + token.count('[') - token.count(')') - token.count(']')
        if token and token[-1] in ',;।' and depth <= 0:
            pieces.append((current, index))
            current = index + 1
    pieces.append((current, end))
    return [piece for piece in pieces if piece[0] <= piece[1]]


def _wrap_piece(piece: str) -> str:
    tokens = piece.split(' ')
    anchors = [index for index, token in enumerate(tokens)
               if MARKS.search(token.strip(DELIMITERS)) and is_symbol_token(token)
               and not UNIT_PAREN.match(token.strip(DELIMITERS))]
    if not anchors:
        return piece

    spans: list[tuple[int, int]] = []
    for anchor in anchors:
        start = anchor
        while start - 1 >= 0 and _extendable(tokens[start - 1]):
            start -= 1
        end = anchor
        while end + 1 < len(tokens) and _extendable(tokens[end + 1]):
            end += 1
            if tokens[end].strip() and tokens[end][-1] in ',;।':
                break
        if spans and start <= spans[-1][1]:
            spans[-1] = (spans[-1][0], max(spans[-1][1], end))
        else:
            spans.append((start, end))

    planned: list[tuple[int, int, str]] = []
    for merged in spans:
        for start, end in _split_span(tokens, *merged):
            replacement = _convert_span(piece, tokens, start, end)
            if replacement is None:
                continue
            planned.append((start, end, replacement))

    for start, end, replacement in reversed(planned):
        tokens[start:end + 1] = [replacement]
    return ' '.join(tokens)


def _convert_span(piece: str, tokens: list[str], span_start: int, span_end: int):
    start, end = span_start, span_end
    fragment = ' '.join(tokens[start:end + 1])

    trailing = ''
    while fragment and fragment[-1] in DELIMITERS:
        trailing = fragment[-1] + trailing
        fragment = fragment[:-1]
    leading = ''
    while fragment and fragment[0] in '.,;:':
        leading += fragment[0]
        fragment = fragment[1:]

    if not fragment or len(fragment) > MAX_SPAN or not MARKS.search(fragment):
        return None
    # Bangla digits convert to Latin; Bangla letters mean the token is prose.
    if BANGLA_LETTER.search(fragment):
        return None
    # `100.09(g/mol)` is a worked value with its unit, not a relation: the
    # fractioniser would tear the decimal apart.
    if re.search(r'[0-9]\.[0-9]+\s*\(', fragment):
        return None
    # Never cut a Bangla suffix off its symbol (`v_dΔt-এর`, `K_f-এ`); a Bangla
    # word across a space is ordinary prose and stays outside the span.
    offset = len(' '.join(tokens[:start])) + (1 if start else 0)
    previous = piece[offset - 1] if offset else ''
    following = piece[offset + len(' '.join(tokens[start:end + 1])):]
    if previous and BANGLA.search(previous):
        return None
    if following and BANGLA.search(following[0]):
        return None
    for opener, closer in (('(', ')'), ('[', ']'), ('{', '}')):
        if fragment.count(opener) != fragment.count(closer):
            return None
    if re.search(r'_\(|\(\s*[-+]?[0-9][0-9.]*\s*\)', fragment):
        return None
    # A semicolon or a Bangla দাঁড়ি ends a clause; one span must not swallow two.
    if ';' in fragment or '।' in fragment:
        return None
    # Several tokens only belong together when a relation or a script binds
    # them; `mg/L CaCO₃` is two separate quantities and must stay plain.
    if ' ' in fragment and not re.search(
            r'[=<>≈∝≤≥→⇌_^⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉\u0391-\u03C9°]', fragment):
        return None
    # `mg/L CaCO₃` is a unit followed by a separate species, not one ratio.
    if re.match(r'^[A-Za-z0-9]+/[A-Za-z0-9]+ ', fragment) and not re.search(
            r'[=<>≈∝≤≥→⇌]', fragment):
        return None
    # The fractioniser tears a decimal apart when the same span divides by
    # something: `0.50 S/m` and `0.05916/n` are a value with its unit.
    if re.search(r'[0-9]\.[0-9]', fragment) and '/' in fragment:
        return None
    # A bare operator at either edge belongs to the sentence, not to the span:
    # `Δn = gaseous …` typesets `Δn` and leaves the definition in words.
    while start < end and OPERATOR_ONLY.fullmatch(tokens[start].strip(DELIMITERS)):
        start += 1
    while end > start and OPERATOR_ONLY.fullmatch(tokens[end].strip(DELIMITERS)):
        end -= 1
    if OPERATOR_ONLY.fullmatch(tokens[start].strip(DELIMITERS)):
        return None
    fragment = ' '.join(tokens[start:end + 1])
    trailing = ''
    while fragment and fragment[-1] in DELIMITERS:
        trailing = fragment[-1] + trailing
        fragment = fragment[:-1]

    fragment = fragment.replace('′', "'")
    fragment = re.sub(r'°([a-z]{2,})', r'^{\\circ}_{\\mathrm{\1}}', fragment)
    fragment = fragment.replace('°C', '^{\circ}\mathrm{C}')
    fragment = group_exponents(fragment)
    if is_unit_only(fragment):
        return None

    unit_tail = ''
    tail = UNIT_TAIL.search(fragment)
    if tail and not BINDING.search(fragment):
        unit_tail = tail.group(0)
        fragment = fragment[:tail.start()]
        if not MARKS.search(fragment):
            return None

    latex = normalise_latex(fragment.translate(BANGLA_DIGITS), prose=True)
    latex = re.sub(r'=\s*constant$', r'= \\text{constant}', latex)
    for source, target in LATEX_OPERATORS:
        latex = latex.replace(source, target)
    latex = re.sub(r'\s{2,}', ' ', latex).strip()
    if not latex or latex.count('{') != latex.count('}') or latex != latex.strip():
        return None
    if BANGLA.search(latex) or '$' in latex:
        return None
    # Tokens trimmed off an edge stay in the sentence: the `=` in
    # `Δn = gaseous product coefficients` is part of the definition.
    lead = ' '.join(tokens[span_start:start])
    tail = ' '.join(tokens[end + 1:span_end + 1])
    parts = [part for part in (lead, f'{leading}${latex}${unit_tail}{trailing}', tail) if part]
    return ' '.join(parts)


KEY_LINE = re.compile(r'^(?P<indent>\s*)(?P<key>[A-Za-z_][A-Za-z0-9_]*):[ \t]*(?P<value>.*)$')
ITEM_LINE = re.compile(r'^(?P<indent>\s*)-[ \t]+(?P<value>.*)$')
INNER_KEY = re.compile(r'^(?P<key>[A-Za-z_][A-Za-z0-9_]*):[ \t]*(?P<value>.*)$')


def rewrite(path: Path, verbose: bool) -> int:
    text = path.read_text(encoding='utf8')
    frontmatter, body = split_mdx(text)
    lines = frontmatter.split('\n')
    current = None
    changed = 0

    def note(key: str, before: str, after: str) -> None:
        nonlocal changed
        changed += 1
        if verbose:
            print(f'{path.relative_to(ROOT)} {key}\n  - {before[:120]}\n  + {after[:120]}')

    def propose(indent: str, prefix: str, key: str, raw: str, label: str) -> None:
        value = parsed_value(raw)
        updated = wrap_prose_spans(value)
        if isinstance(updated, str) and updated != value:
            lines[index] = f'{indent}{prefix}{key}: {json.dumps(updated, ensure_ascii=False)}'
            note(label, value, updated)

    for index, line in enumerate(lines):
        match = KEY_LINE.match(line)
        if match:
            key = match.group('key')
            raw = match.group('value').strip()
            if raw.startswith('|') or raw.startswith('>'):
                current = None
                continue
            if not match.group('indent'):
                current = key
                if key in PROSE_KEYS and raw:
                    value = parsed_value(raw)
                    updated = wrap_prose_spans(value)
                    if isinstance(updated, str) and updated != value:
                        lines[index] = f'{key}: {json.dumps(updated, ensure_ascii=False)}'
                        note(key, value, updated)
                continue
            # An indented leaf continues the mapping that a `- ` line opened.
            if key in NESTED_PROSE_KEYS and raw:
                propose(match.group('indent'), '', key, raw, f'{current}.{key}')
            continue

        item = ITEM_LINE.match(line)
        if not item:
            continue
        inner = INNER_KEY.match(item.group('value'))
        if inner:
            key = inner.group('key')
            raw = inner.group('value').strip()
            if key in NESTED_PROSE_KEYS and raw and not raw.startswith(('|', '>')):
                propose(item.group('indent'), '- ', key, raw, f'{current}[].{key}')
        elif current in PROSE_KEYS:
            value = parsed_value(item.group('value'))
            updated = wrap_prose_spans(value)
            if isinstance(updated, str) and updated != value:
                lines[index] = f"{item.group('indent')}- {json.dumps(updated, ensure_ascii=False)}"
                note(current, value, updated)

    if changed:
        path.write_text(join_mdx('\n'.join(lines), body), encoding='utf8')
    return changed


def scan(path: Path) -> int:
    frontmatter, _ = split_mdx(path.read_text(encoding='utf8'))
    try:
        data = yaml.safe_load(frontmatter) or {}
    except yaml.YAMLError:
        return 0
    found = 0

    def walk(value, key: str, allowed: bool) -> None:
        nonlocal found
        if isinstance(value, str):
            if not allowed:
                return
            updated = wrap_prose_spans(value)
            if updated != value:
                found += 1
                print(f'{path.relative_to(ROOT)} {key}\n  - {value[:120]}\n  + {updated[:120]}')
        elif isinstance(value, dict):
            for name, item in value.items():
                walk(item, f'{key}.{name}', name in NESTED_PROSE_KEYS)
        elif isinstance(value, list):
            for position, item in enumerate(value):
                walk(item, f'{key}[{position}]', allowed)

    for key, value in data.items():
        walk(value, key, key in PROSE_KEYS)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report what would change and exit 1')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    total = files = 0
    for path in sorted(CONTENT.rglob('*.mdx')):
        if args.check:
            count = scan(path)
        else:
            count = rewrite(path, args.verbose)
        if count:
            files += 1
            total += count

    if args.check:
        print(f'{total} field(s) in {files} file(s) would change.')
        return 1 if total else 0
    print(f'wrapped {total} field(s) in {files} file(s).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
