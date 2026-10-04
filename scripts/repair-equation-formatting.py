"""Repair equation formatting across `content/**/*.mdx`.

The generated Honours entries concatenated a raw LaTeX string into the prose
`derivation` field and repeated it in the body inside backticks, so readers saw
`1/[A]-1/[A]_0=kt;\quad[A](t_{1/2})=[A]_0/2` mid-sentence, plus `\quad` command
names and monospaced code spans. Variable tables also showed English text in the
Bangla `name_bn` column.

This script, run as `python3 scripts/repair-equation-formatting.py [--check]`:

* normalises every `latex` relation (real fractions, unicode super/subscripts,
  Greek letters, `pH`/`pK_a` upright) and rewrites `A;\quad B` chains as an
  `aligned` block with one relation per line;
* strips the raw LaTeX dump and the filler tail sentence from `derivation` and
  `derivation_bn`, leaving readable prose — the mathematics lives in
  `derivation_steps`, which the detail page renders with KaTeX;
* fills Bangla variable names from `scripts/bn_variable_names.py`;
* removes the body's duplicated "প্রতিপাদনের ব্যাখ্যা / Derivation" section and
  converts any remaining backticked relation into `$$...$$` display maths.

`--check` reports what would change without writing, and exits non-zero so CI can
catch newly generated content with the old formatting.
"""

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bn_variable_names import BN_VARIABLE_NAMES  # noqa: E402
from content_format_lib import (  # noqa: E402
    FrontmatterLines,
    encode_scalar,
    chain_to_aligned,
    join_mdx,
    looks_like_latex,
    normalise_latex,
    parsed_value,
    split_mdx,
)

ROOT = Path(__file__).resolve().parents[1] / 'content'

# Placeholder that keeps `$…$` spans out of the prose cleanups.
SENTINEL = '\x00'

FILLER_TAILS = (
    'Substitute the preceding result and identify the requested relation.',
    'আগের ফল বসিয়ে নির্ণেয় সম্পর্কটি শনাক্ত করুন।',
)

# Some hand-written entries stored LaTeX in YAML *single*-quoted scalars while
# still doubling every backslash (`latex: '\\rho = \\frac{m}{V}'`). Single
# quotes do not process escapes, so KaTeX received `\\rho` — a line break plus
# the word "rho" — and the formula rendered as gibberish on the page.
SINGLE_QUOTED_RE = re.compile(
    r"^(?P<pre>\s*(?:-\s*)?[A-Za-z_][A-Za-z0-9_]*:\s*)'(?P<value>[^']*(?:''[^']*)*)'\s*$"
)


def repair_double_escaped(frontmatter: str) -> tuple[str, int]:
    lines = frontmatter.split('\n')
    fixed = 0
    for index, line in enumerate(lines):
        match = SINGLE_QUOTED_RE.match(line)
        if not match or '\\\\' not in match.group('value'):
            continue
        value = match.group('value').replace("''", "'").replace('\\\\', '\\')
        lines[index] = f"{match.group('pre')}{encode_scalar(value)}"
        fixed += 1
    return '\n'.join(lines), fixed


DERIVATION_HEADING_RE = re.compile(
    r'###\s*প্রতিপাদনের ব্যাখ্যা\s*/\s*Derivation\s*\n+(.*?)(?=\n###\s|\Z)', re.S
)
BACKTICK_MATH_RE = re.compile(r'`([^`\n]+)`')


def tidy_prose(text: str, removed: list[str]) -> str:
    """Remove raw LaTeX dumps and filler sentences from a prose field."""
    # A `$…$` span is typeset on purpose, so it is protected: a step latex
    # that now lives inside one is the relation the sentence is about, not a
    # leftover dump of the same formula.
    spans: list[str] = []

    def protect(match: re.Match) -> str:
        spans.append(match.group(0))
        return SENTINEL + str(len(spans) - 1) + SENTINEL

    prose = re.sub(r'\$[^$]+\$', protect, text)
    for fragment in removed:
        if fragment and len(fragment) > 8 and fragment in prose:
            prose = prose.replace(fragment, ' ')
    for tail in FILLER_TAILS:
        prose = prose.replace(tail, ' ')
    # Drop leftover bare LaTeX such as `\quad` chains the dump did not cover.
    prose = re.sub(r'(?<!\S)(?:\\quad|;\\quad)(?!\S)', ' ', prose)
    prose = re.sub(SENTINEL + r'(\d+)' + SENTINEL,
                   lambda m: spans[int(m.group(1))], prose)
    prose = re.sub(r'\s{2,}', ' ', prose)
    prose = re.sub(r'\s+([,.;:।])', r'\1', prose)
    prose = re.sub(r'([,;:])\s*(?=[,.;:।])', r'\1', prose)
    prose = re.sub(r'^[\s,;:.]+', '', prose)
    prose = re.sub(r'[\s,;:]+$', '', prose)
    if prose and prose[-1] not in '.।?!':
        prose += '।' if re.search(r'[\u0980-\u09FF]', prose[-8:]) else '.'
    return prose.strip()


def repair_frontmatter(frontmatter: str) -> tuple[str, list[str]]:
    frontmatter, escaped = repair_double_escaped(frontmatter)
    lines = FrontmatterLines(frontmatter)
    notes: list[str] = []
    if escaped:
        notes.append(f'{escaped} double-escaped relation(s) fixed')

    entries = list(lines.entries())
    step_latex: list[str] = []
    variable_names: dict[int, str] = {}
    pending_name_index: int | None = None

    for index, indent, key, raw, _line in entries:
        value = parsed_value(raw)
        if not isinstance(value, str):
            continue
        if key == 'name' and indent >= 4:
            pending_name_index = index
        elif key == 'name_bn' and indent >= 4 and pending_name_index is not None:
            variable_names[index] = value
            pending_name_index = None
        elif key == 'latex':
            step_latex.append(value)
            normalised = chain_to_aligned(normalise_latex(value))
            if normalised != value:
                step_latex.append(normalised)

    # Relations: headline, derivation steps and reference collections.
    for index, indent, key, raw, _line in entries:
        if key != 'latex' or not isinstance(parsed_value(raw), str):
            continue
        current = parsed_value(raw)
        repaired = chain_to_aligned(normalise_latex(current))
        if repaired != current:
            lines.set_line(index, repaired)
            notes.append('latex normalised')

    # Bangla variable names.
    for index, value in variable_names.items():
        replacement = BN_VARIABLE_NAMES.get(value)
        if replacement and replacement != value:
            lines.set_line(index, replacement)
            notes.append('name_bn translated')

    # Prose derivations: drop the embedded LaTeX dump and the filler tail.
    for index, indent, key, raw, _line in entries:
        if indent != 0 or key not in ('derivation', 'derivation_bn'):
            continue
        current = parsed_value(raw)
        if not isinstance(current, str):
            continue
        repaired = tidy_prose(current, step_latex)
        if repaired != current:
            lines.set_line(index, repaired)
            notes.append(f'{key} cleaned')

    return str(lines), notes


def repair_body(body: str) -> tuple[str, list[str]]:
    notes: list[str] = []
    text = body

    match = DERIVATION_HEADING_RE.search(text)
    if match:
        # The detail page already renders `derivation` plus the numbered steps
        # directly above the body, so this section only repeated them with raw
        # LaTeX in backticks.
        text = (text[:match.start()] + text[match.end():]).strip('\n')
        notes.append('duplicate derivation section removed')

    def unbacktick(match: re.Match) -> str:
        payload = match.group(1).strip()
        if not looks_like_latex(payload) and '=' not in payload:
            return match.group(0)
        notes.append('backticked maths converted')
        return f'\n\n$$\n{chain_to_aligned(normalise_latex(payload))}\n$$\n\n'

    text = BACKTICK_MATH_RE.sub(unbacktick, text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip('\n')
    return text, notes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report changes without writing')
    parser.add_argument('--verbose', action='store_true', help='list every repaired file')
    args = parser.parse_args()

    changed = 0
    for path in sorted(ROOT.glob('*/*/*.mdx')):
        original = path.read_text(encoding='utf8')
        if not re.search(r'^type:\s*"?equation', original, re.M):
            continue
        frontmatter, body = split_mdx(original)
        new_frontmatter, notes = repair_frontmatter(frontmatter)
        new_body, body_notes = repair_body(body)
        notes.extend(body_notes)
        if not notes:
            continue
        changed += 1
        if args.verbose or args.check:
            print(f'{path.relative_to(ROOT.parent)}: {", ".join(sorted(set(notes)))}')
        if not args.check:
            path.write_text(join_mdx(new_frontmatter, new_body), encoding='utf8')

    verb = 'would repair' if args.check else 'repaired'
    print(f'{verb} {changed} equation files.')
    return 1 if args.check and changed else 0


if __name__ == '__main__':
    raise SystemExit(main())
