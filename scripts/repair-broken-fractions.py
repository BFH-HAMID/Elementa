"""Undo the two mechanical mistakes an early formatting pass made inside `$…$`.

1. A decimal number followed by a unit was read as a fraction:

       $g\approx 9.\frac{81 m}{s^{2}}$      ->  $g\approx 9.81\ \mathrm{m/s^{2}}$
       $c=0.\frac{010 mol}{L}$              ->  $c=0.010\ \mathrm{mol/L}$

2. A ratio of two decimals was split around its digits:

       58.\frac{693}{288}.91                ->  \frac{58.693}{288.91}

3. A subscript lost its separator and glued onto its variable:

       $Cacid=\frac{Cbase V_{\mathrm{eq}}}{Vacid}$
                                            ->  $C_{\mathrm{acid}}=\frac{C_{\mathrm{base}} V_{\mathrm{eq}}}{V_{\mathrm{acid}}}$

4. A whole relation was swept into the numerator, so the sentence claimed the
   left-hand side was itself being divided:

       $\frac{\tan\theta \approx \Delta x}{L}$   ->  $\tan\theta \approx \frac{\Delta x}{L}$
       $\frac{s\approx 10^{-6} mol}{L}$          ->  $s \approx \frac{10^{-6} mol}{L}$

   The operator is only honoured at brace depth 0, so `\frac{d[A]}{dt}` and
   `\mathrm{pH}=3` inside a numerator are left alone.

Only text already inside `$…$` is touched, only the whitelisted subscript words
in rule 3 are candidates, and `scripts/check-math.mjs` renders every span with
KaTeX afterwards, so a bad rewrite fails the check instead of reaching the site.

Run: python3 scripts/repair-broken-fractions.py [--check] [--verbose]
"""

import argparse
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

from content_format_lib import join_mdx, parsed_value, split_mdx  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'

# `58.\frac{693}{288}.91` — both halves of two decimal numbers.
SPLIT_RATIO = re.compile(r'([0-9]+)\.\\frac\{([0-9]+)\}\{([0-9]+)\}\.([0-9]+)')
# `9.\frac{81 m}{s^{2}}` — a decimal number whose unit became a fraction. The
# brace pattern allows one level of nesting so `s^{2}` survives as a denominator.
NESTED = r'(?:[^{}]|\{[^{}]*\})*'
SPLIT_UNIT = re.compile(r'([0-9]+)\.\\frac\{(' + NESTED + r')\}\{(' + NESTED + r')\}')
# Words that only ever appear as a subscript label, never as a species of their own.
SUBSCRIPT_WORDS = (
    'acid|base|organic|aqueous|solution|water|blank|titre|titrant|sample|thio|cell|'
    'std|unknown|raw|dry|theoretical|theory|initial|final|total|cal|sol|elec|'
    'neutralization|neutralisation|anode|cathode|limiting|excess|added|used|equivalent'
)
GLUED = re.compile(r'(?<![A-Za-z\\])(?<!\\mathrm\\{)(?<!\\text\\{)(?<!\\mathbf\\{)([A-Za-z])(' + SUBSCRIPT_WORDS + r')(?![A-Za-z])')
UNIT_FREE = re.compile(r'^[A-Za-z0-9^{}\\/_.,\s-]+$')
# `\times 10^{8} m` — a power-of-ten factor that belongs outside `\mathrm{}`.
SCALED = re.compile(r'^(\\times\s*[0-9]+(?:\^\{[^{}]*\})?)\s+(.*)$')
# Any `\frac{...}{...}`, allowing one level of nesting in each argument.
FRACTION = re.compile(r'\\frac\{(' + NESTED + r')\}\{(' + NESTED + r')\}')
# Comparison operators, longest first; `\le` must not win inside `\left`.
RELATION_TOKENS = ('\\approx', '\\propto', '\\neq', '\\ne', '\\leq', '\\le',
                   '\\geq', '\\ge', '\\ll', '\\gg', '=')


def split_relation(text: str):
    """Split at the first relation operator sitting at brace depth 0."""
    depth = 0
    index = 0
    while index < len(text):
        char = text[index]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
        elif depth == 0:
            for token in RELATION_TOKENS:
                if not text.startswith(token, index):
                    continue
                after = index + len(token)
                if token[0] == '\\' and after < len(text) and text[after].isalpha():
                    continue  # `\left`, `\neq`-style macros are not `\le`/`\ne`
                left = text[:index].strip()
                right = text[after:].strip()
                return (left, token, right) if left and right else None
        index += 1
    return None


def hoist_relation(match: re.Match) -> str:
    r"""`\frac{A \approx B}{C}` -> `A \approx \frac{B}{C}`."""
    parts = split_relation(match.group(1))
    if parts is None:
        return match.group(0)
    left, token, right = parts
    return left + ' ' + token + ' \\frac{' + right + '}{' + match.group(2) + '}'


def repair_maths(maths: str) -> str:
    body = maths[1:-1]

    body = SPLIT_RATIO.sub(lambda m: '\\frac{' + m.group(1) + '.' + m.group(2) + '}{'
                           + m.group(3) + '.' + m.group(4) + '}', body)

    def unit(m: re.Match) -> str:
        integer, numerator, denominator = m.group(1), m.group(2).strip(), m.group(3).strip()
        parts = numerator.split(' ', 1)
        digits = parts[0].strip()
        numerator_unit = parts[1].strip() if len(parts) > 1 else ''
        number = integer + '.' + digits if digits else integer + '.'
        if not numerator_unit:
            return number + '/' + denominator if denominator else number
        # `3.\frac{00 \times 10^{8} m}{s}` keeps its power of ten upright-readable:
        # `\times 10^{8}` must not end up inside `\mathrm{}`.
        factor = ''
        scale = SCALED.match(numerator_unit)
        if scale:
            factor = ' ' + scale.group(1)
            numerator_unit = scale.group(2).strip()
        if denominator and UNIT_FREE.match(denominator):
            return number + factor + '\\ \\mathrm{' + numerator_unit + '/' + denominator + '}'
        return number + factor + '\\ \\mathrm{' + numerator_unit + '}'

    body = SPLIT_UNIT.sub(unit, body)
    body = FRACTION.sub(hoist_relation, body)
    body = GLUED.sub(lambda m: m.group(1) + '_{\\mathrm{' + m.group(2) + '}}', body)
    return '$' + body + '$'


def repair_prose(prose):
    if not isinstance(prose, str) or '$' not in prose:
        return prose
    pieces = re.split(r'(\$[^$]*\$)', prose)
    return ''.join(piece if not piece.startswith('$') else repair_maths(piece) for piece in pieces)


MAPPING_KEY = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*:(\s|$)')


def scalar_text(raw: str):
    """Return the string one scalar line holds, or None when it is not a scalar.

    `parsed_value` falls back to the raw text of a line that is not JSON, so a
    nested mapping line (`- step_en: "..."`) would otherwise be repaired as if
    it were prose and re-encoded as one long string — which is not valid YAML.
    """
    raw = raw.strip()
    if not raw or raw[0] in '|>':
        return None
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        if raw[0] in '[{' or MAPPING_KEY.match(raw):
            return None
        value = parsed_value(raw)
    return value if isinstance(value, str) else None


KEY_LINE = re.compile(r'^(?P<indent>\s*)(?P<key>[A-Za-z_][A-Za-z0-9_]*):\s*(?P<value>.*)$')
ITEM_LINE = re.compile(r'^(?P<indent>\s*)-\s+(?P<value>.*)$')
NESTED_LINE = re.compile(r'^(?P<indent>\s*)(?P<key>[A-Za-z_][A-Za-z0-9_]*):\s+(?P<value>\S.*)$')


def rewrite_frontmatter(path: Path, verbose: bool) -> int:
    text = path.read_text(encoding='utf8')
    frontmatter, body = split_mdx(text)
    lines = frontmatter.split('\n')
    current = None
    block_indent = None
    changed = 0

    def note(key: str, before: str, after: str) -> None:
        nonlocal changed
        changed += 1
        if verbose:
            print(f'{path.relative_to(ROOT)} {key}\n  - {before[:120]}\n  + {after[:120]}')

    def rewrite(index: int, prefix: str, label: str, raw: str) -> None:
        """Re-encode one scalar line, keeping its indent and key intact."""
        value = scalar_text(raw)
        if value is None:
            return
        updated = repair_prose(value)
        if isinstance(updated, str) and updated != value:
            lines[index] = prefix + json.dumps(updated, ensure_ascii=False)
            note(label, value, updated)

    def is_block(raw: str) -> bool:
        return raw.strip()[:1] in ('|', '>')

    for index, line in enumerate(lines):
        if block_indent is not None:
            # Inside a block scalar: its own lines keep their indentation, so
            # never treat them as keys.
            if not line.strip() or len(line) - len(line.lstrip()) > block_indent:
                continue
            block_indent = None

        match = KEY_LINE.match(line)
        if match and not match.group('indent'):
            current = match.group('key')
            raw = match.group('value')
            if is_block(raw):
                block_indent = 0
                continue
            rewrite(index, f'{current}: ', current, raw)
            continue

        if not current:
            continue

        item = ITEM_LINE.match(line)
        if item:
            indent = item.group('indent')
            inner = NESTED_LINE.match(item.group('value'))
            if inner:
                # `- step_en: "..."` — the first key of a nested leaf.
                if is_block(inner.group('value')):
                    block_indent = len(indent) + 2
                    continue
                rewrite(index, f"{indent}- {inner.group('key')}: ",
                        f"{current}[].{inner.group('key')}", inner.group('value'))
            else:
                rewrite(index, f'{indent}- ', f'{current}[]', item.group('value'))
            continue

        nested = NESTED_LINE.match(line)
        if nested:
            # `  step_bn: "..."` — a sibling key inside the same list item.
            if is_block(nested.group('value')):
                block_indent = len(nested.group('indent'))
                continue
            rewrite(index, f"{nested.group('indent')}{nested.group('key')}: ",
                    f"{current}.{nested.group('key')}", nested.group('value'))

    if changed:
        path.write_text(join_mdx('\n'.join(lines), body), encoding='utf8')
    return changed


def scan_frontmatter(path: Path) -> int:
    frontmatter, _ = split_mdx(path.read_text(encoding='utf8'))
    try:
        data = yaml.safe_load(frontmatter) or {}
    except yaml.YAMLError:
        return 0
    found = 0

    def walk(value, key):
        nonlocal found
        if isinstance(value, str):
            updated = repair_prose(value)
            if updated != value:
                found += 1
                print(f'{path.relative_to(ROOT)} {key}\n  - {value[:120]}\n  + {updated[:120]}')
        elif isinstance(value, dict):
            for name, item in value.items():
                walk(item, f'{key}.{name}')
        elif isinstance(value, list):
            for position, item in enumerate(value):
                walk(item, f'{key}[{position}]')

    walk(data, 'frontmatter')
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report what would change and exit 1')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    total = files = 0
    for path in sorted(CONTENT.rglob('*.mdx')):
        if args.check:
            count = scan_frontmatter(path)
        else:
            count = rewrite_frontmatter(path, args.verbose)
        if count:
            files += 1
            total += count

    if args.check:
        print(f'{total} field(s) in {files} file(s) would change.')
        return 1 if total else 0
    print(f'rewrote {total} field(s) in {files} file(s).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
