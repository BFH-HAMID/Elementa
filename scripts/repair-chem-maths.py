"""Wrap plain-text chemical reactions and formulae in lab prose with `$…$`.

The lab guides written by `scripts/add-honours-50-labs.py` and the older
hand-written chemistry guides state their reactions in unicode:

    ২Cu²⁺+৪I−→২CuI(s)+I₂; I₂+২S₂O₃²−→২I−+S₄O₆²−।
    Cr₂O₇²−+6Fe²⁺+14H+→2Cr³⁺+6Fe³⁺+7H₂O.

KaTeX never sees those, so a Bangla reader gets a formula that mixes Bangla
numerals with Latin symbols — `২Cu²⁺` — which is exactly the "লেখার ফরমেট বোঝা
যাচ্ছে না" complaint. `wrap-prose-maths.py` skips them on purpose: it only wraps
fragments carrying a relation mark, and the subscript inference in
`content_format_lib.normalise_latex(prose=True)` would turn the symbol `Cu` into
`C_{\\mathrm{u}}` and the English word "For" into `F_{\\mathrm{or}}`. Chemistry
needs its own conservative pass:

* a fragment must contain `→`/`⇌`, or `=` together with a unicode super/subscript
  or an explicit `_word` subscript;
* it must not touch a Bangla letter, so Bangla words can never be swallowed;
* two alphanumeric words separated by a plain space (`Cthio Vthio`) are prose-like
  and rejected rather than guessed at;
* inside a fragment Bangla digits become Latin, unicode super/subscripts become
  `^{…}`/`_{…}`, a trailing `+`/`-` in a reaction becomes an ion charge, `−`
  becomes `-`, `→` becomes `\\rightarrow`, `log`/`ln` become upright operators;
* nothing is fractionised: `g/mol` stays `g/mol`.

`scripts/check-math.mjs` renders every `$…$` with KaTeX afterwards, so a bad
conversion fails the check instead of reaching the site.

Run: python3 scripts/repair-chem-maths.py [--check] [--verbose]
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

PROSE_KEYS = {
    'aim', 'aim_bn', 'theory', 'theory_bn', 'calculation', 'calculation_bn',
    'precautions', 'precautions_bn', 'sources_of_error', 'sources_of_error_bn',
    'procedure', 'procedure_bn',
}

SUPERSCRIPTS = {'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6',
                '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-'}
SUBSCRIPTS = {'₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6',
              '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-'}
GREEK = {
    'α': r'\alpha ', 'β': r'\beta ', 'γ': r'\gamma ', 'δ': r'\delta ', 'ε': r'\epsilon ',
    'η': r'\eta ', 'θ': r'\theta ', 'κ': r'\kappa ', 'λ': r'\lambda ', 'μ': r'\mu ',
    'ν': r'\nu ', 'ξ': r'\xi ', 'π': r'\pi ', 'ρ': r'\rho ', 'σ': r'\sigma ',
    'τ': r'\tau ', 'φ': r'\phi ', 'χ': r'\chi ', 'ψ': r'\psi ', 'ω': r'\omega ',
    'Δ': r'\Delta ', 'Γ': r'\Gamma ', 'Θ': r'\Theta ', 'Λ': r'\Lambda ', 'Π': r'\Pi ',
    'Σ': r'\Sigma ', 'Φ': r'\Phi ', 'Ψ': r'\Psi ', 'Ω': r'\Omega ',
}
BANGLA_DIGITS = {chr(0x09E6 + index): str(index) for index in range(10)}
BANGLA_LETTER = re.compile(r'[\u0980-\u09E5]')

ATOM_CHARS = (
    r'A-Za-z0-9\u09E6-\u09EF'
    r'\[\](){}<>/\\_.,:\'’%°±'
    r'+\-−–'
    r'²³⁴⁵⁰¹⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻'
    r'αβγδεζηθκλμνξπρστυφχψωΓΔΘΛΠΣΦΨΩ'
    r'√∞'
)
OPERATORS = r'(?:[-+*/=<>−–×÷≈≤≥≠→⇌∝])'
# An operator-connected run: `c_acid = c_base × V_base / V_acid`,
# `Cr₂O₇²−+6Fe²⁺+14H+→2Cr³⁺+6Fe³⁺+7H₂O`. Spaces are only allowed next to an
# operator, so ordinary words can never be pulled into the fragment.
RELATION = re.compile(rf'(?<![A-Za-z\u0980-\u09FF])[{ATOM_CHARS}]+(?:\s*{OPERATORS}\s*[{ATOM_CHARS}]+)+')
HAS_ARROW = re.compile(r'[→⇌]')
HAS_MARK = re.compile(r'[²³⁴⁵⁰¹⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻×√αβγδεζηθκλμνξπρστυφχψωΓΔΘΛΠΣΦΨΩ]|[_^]\{|_[A-Za-z]')
DELIMITERS = '.,;:'
NEXT_TOKEN = re.compile(r'\s*([A-Za-z0-9_()\[\]²³⁴⁵⁰¹⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻αβγδεζηθκλμνξπρστυφχψωΓΔΘΛΠΣΦΨΩ√]+)')
MARKISH = re.compile(r'[²³⁴⁵⁰¹⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻_αβγδεζηθκλμνξπρστυφχψωΓΔΘΛΠΣΦΨΩ√]')
STOPWORDS = {
    'and', 'the', 'for', 'with', 'from', 'that', 'this', 'not', 'are', 'was', 'were',
    'use', 'per', 'over', 'into', 'then', 'than', 'when', 'which', 'while', 'after',
    'before', 'between', 'against', 'using', 'give', 'gives', 'take', 'keep', 'add',
    'record', 'repeat', 'convert', 'compare', 'check', 'note', 'mean', 'total', 'where',
}


def is_fragment(fragment: str, before: str, after: str, rest: str) -> bool:
    # A fragment glued to a Bangla word belongs to that word, not to maths mode.
    if BANGLA_LETTER.search(before) or BANGLA_LETTER.search(after):
        return False
    stripped = fragment.rstrip(DELIMITERS)
    tail = fragment[len(stripped):]
    rest = rest.lstrip()
    if len(stripped) < 4:
        return False
    # A trailing comma or semicolon followed by more text means the run was cut
    # off in the middle of an expression; leave it as plain text rather than
    # publishing half a formula.
    if tail and rest and (rest[0].isalnum() or rest[0] in '(['):
        if tail != '.' or not rest[0].isupper():
            return False
    # A fragment that stops mid-expression — `n(Cu²⁺)=Cthio` with ` Vthio` still
    # to come — would publish half a formula, so it is left as plain text. An
    # ordinary following word (`CO₂ gas is released`) is harmless.
    if not tail:
        token_match = NEXT_TOKEN.match(rest)
        if token_match:
            token = token_match.group(1)
            if re.match(r'^[A-Z][A-Za-z0-9]', token) or MARKISH.search(token):
                return False
    # A run that stops inside a bracket would publish half an expression.
    for opener, closer in (('(', ')'), ('[', ']'), ('{', '}')):
        if stripped.count(opener) != stripped.count(closer):
            return False
    words = [word for word in re.split(r'[^A-Za-z]+', stripped) if word]
    if any(word.lower() in STOPWORDS for word in words):
        return False
    arrow = bool(HAS_ARROW.search(stripped))
    # A balanced equation legitimately names many species; ordinary relations do not.
    if not arrow and len(words) > 8:
        return False
    if arrow:
        return True
    return '=' in stripped and bool(HAS_MARK.search(stripped))


def to_latex(fragment: str) -> str:
    out = fragment.strip().rstrip(DELIMITERS)
    for bangla, latin in BANGLA_DIGITS.items():
        out = out.replace(bangla, latin)

    out = out.replace('−', '-').replace('–', '-')
    reaction = bool(HAS_ARROW.search(out))
    # `Ba²+→` writes the charge as a plain plus; fold it into the run before the
    # operator spacing below can mistake it for a separator. `T²–m` (a graph name)
    # and `x²-1` are left alone because a letter or digit follows.
    out = re.sub(r'([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)\s*([-+])(?=\s*(?:→|⇌|[)\]]|$))',
                 lambda match: match.group(1) + ('⁺' if match.group(2) == '+' else '⁻'), out)
    # Space the operators first so `Fe²⁺+6Fe³⁺` separates the sum from the charge.
    for operator in ('→', '⇌', '=', '+', '<', '>'):
        out = re.sub(rf'\s*\{operator}\s*', f' {operator} ', out)
    out = re.sub(r'\s{2,}', ' ', out).strip()

    def supers(match: re.Match) -> str:
        run, sign, digit = match.group(1), match.group(2) or '', match.group(3) or ''
        body = ''.join(SUPERSCRIPTS[character] for character in run)
        # `S₂O₃²−` carries its charge as a plain minus, `x²-1` does not.
        if sign and not body.endswith(('+', '-')) and not digit:
            body += sign
            sign = ''
        return '^{' + body + '}' + sign + digit

    out = re.sub('([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)([-+]?)([0-9]?)', supers, out)
    out = re.sub('[₀₁₂₃₄₅₆₇₈₉₊₋]+',
                 lambda match: '_{' + ''.join(SUBSCRIPTS[character] for character in match.group(0)) + '}', out)

    for greek, macro in GREEK.items():
        out = out.replace(greek, macro)

    if reaction:
        # In a reaction a sign glued to a species is an ion charge, not a minus.
        out = re.sub(r'(?<=[A-Za-z0-9)}])\s*([-+])(?=\s*(?:→|⇌|[+]|$))', r'^{\1}', out)
        # Atom counts written as plain digits (`C7H6O3`, `S₄O6`) become subscripts.
        out = re.sub(r'(?<=[A-Za-z)])([0-9]+)(?![0-9})])', r'_{\1}', out)
    # `MnO₄−)` carries its charge the same way even without an arrow.
    out = re.sub(r'(?<=[A-Za-z0-9)}])\s*([-+])(?=\s*[)\]])', r'^{\1}', out)

    out = group_radical(out, '√')

    replacements = (
        ('→', r'\rightarrow '), ('⇌', r'\rightleftharpoons '), ('×', r'\times '),
        ('÷', r'\div '), ('≈', r'\approx '), ('∝', r'\propto '), ('≤', r'\leq '),
        ('≥', r'\geq '), ('≠', r'\neq '), ('±', r'\pm '), ('·', r'\cdot '),
        ('∞', r'\infty '), ('√', r'\sqrt '),
    )
    for source, target in replacements:
        out = out.replace(source, target)

    out = re.sub(r'(?<=[A-Za-z0-9)}])_(?!\{)([A-Za-z][A-Za-z0-9]*)',
                 lambda match: '_{\\mathrm{' + match.group(1) + '}}', out)
    out = re.sub(r'(?<![A-Za-z\\])(log|ln|sin|cos|tan)(?=[_({0-9A-Za-z\\])', r'\\\1', out)
    out = re.sub(r'\s+', ' ', out)
    out = re.sub(r'(\\[A-Za-z]+) (?=[_^{}(])', r'\1', out)
    return out.strip()


def group_radical(text: str, marker: str) -> str:
    """Give every radical a braced argument: KaTeX reads `\\sqrt [x]` as an index."""
    out = []
    index = 0
    while index < len(text):
        found = text.find(marker, index)
        if found < 0:
            out.append(text[index:])
            break
        out.append(text[index:found])
        rest = text[found + len(marker):]
        body = rest.lstrip()
        skipped = len(rest) - len(body)
        consumed = None
        if body[:1] in '([':
            opener = body[0]
            closer = ')' if opener == '(' else ']'
            depth = 0
            for position, character in enumerate(body):
                if character == opener:
                    depth += 1
                elif character == closer:
                    depth -= 1
                    if depth == 0:
                        consumed = body[:position + 1]
                        break
        else:
            token = re.match(r'[A-Za-z0-9]+', body)
            if token:
                consumed = token.group(0)
        if consumed is None:
            out.append(marker)
            index = found + len(marker)
            continue
        out.append(marker + '{' + consumed + '}')
        index = found + len(marker) + skipped + len(consumed)
    return ''.join(out)


def repair_sqrt_spans(prose: str) -> str:
    pieces = re.split(r'(\$[^$]*\$)', prose)
    return ''.join(piece if not piece.startswith('$') else group_radical(piece, '\\sqrt')
                   for piece in pieces)


def wrap_chem_maths(prose):
    if not isinstance(prose, str) or not prose:
        return prose

    pieces = re.split(r'(\$[^$]*\$)', prose)
    out = []
    for piece in pieces:
        if piece.startswith('$'):
            out.append(piece)
            continue

        def replace(match: re.Match, piece: str = piece) -> str:
            fragment = match.group(0)
            before = piece[match.start() - 1] if match.start() else ''
            after = piece[match.end()] if match.end() < len(piece) else ''
            rest = piece[match.end():]
            if not is_fragment(fragment, before, after, rest):
                return fragment
            latex = to_latex(fragment)
            if not latex or latex.count('{') != latex.count('}'):
                return fragment
            tail = fragment[len(fragment.rstrip(DELIMITERS)):]
            return f'${latex}${tail}'

        out.append(RELATION.sub(replace, piece))
    return repair_sqrt_spans(''.join(out))


# Frontmatter is rewritten line by line so quoting and indentation survive.
KEY_LINE = re.compile(r'^(?P<indent>\s*)(?P<key>[A-Za-z_][A-Za-z0-9_]*):\s*(?P<value>.*)$')
ITEM_LINE = re.compile(r'^(?P<indent>\s*)-\s+(?P<value>.*)$')


def rewrite(path: Path, verbose: bool) -> int:
    """Rewrite the prose fields of one lab guide, one JSON scalar per line."""
    text = path.read_text(encoding='utf8')
    frontmatter, body = split_mdx(text)
    if (yaml.safe_load(frontmatter) or {}).get('type') != 'experiment':
        return 0

    lines = frontmatter.split('\n')
    current = None
    changed = 0

    def note(key: str, before: str, after: str) -> None:
        nonlocal changed
        changed += 1
        if verbose:
            print(f'{path.relative_to(ROOT)} {key}\n  - {before[:110]}\n  + {after[:110]}')

    for index, line in enumerate(lines):
        match = KEY_LINE.match(line)
        if match and not match.group('indent'):
            current = match.group('key')
            raw = match.group('value').strip()
            if current not in PROSE_KEYS or not raw:
                continue
            value = parsed_value(raw)
            if not isinstance(value, str):
                continue
            updated = wrap_chem_maths(value)
            if updated != value:
                lines[index] = f'{current}: {json.dumps(updated, ensure_ascii=False)}'
                note(current, value, updated)
            continue
        item = ITEM_LINE.match(line)
        if item and current in PROSE_KEYS:
            value = parsed_value(item.group('value'))
            if not isinstance(value, str):
                continue
            updated = wrap_chem_maths(value)
            if updated != value:
                lines[index] = f"{item.group('indent')}- {json.dumps(updated, ensure_ascii=False)}"
                note(current, value, updated)

    if changed:
        path.write_text(join_mdx('\n'.join(lines), body), encoding='utf8')
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report what would change and exit 1')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    total = files = 0
    for path in sorted(CONTENT.rglob('*.mdx')):
        frontmatter, _ = split_mdx(path.read_text(encoding='utf8'))
        if (yaml.safe_load(frontmatter) or {}).get('type') != 'experiment':
            continue
        if args.check:
            data = yaml.safe_load(frontmatter) or {}
            touched = False
            for key, value in data.items():
                if key not in PROSE_KEYS:
                    continue
                for item in (value if isinstance(value, list) else [value]):
                    if not isinstance(item, str):
                        continue
                    wrapped = wrap_chem_maths(item)
                    if wrapped != item:
                        total += 1
                        touched = True
                        print(f'{path.relative_to(ROOT)} {key}\n  - {item[:120]}\n  + {wrapped[:120]}')
                        break
            if touched:
                files += 1
        else:
            count = rewrite(path, args.verbose)
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
