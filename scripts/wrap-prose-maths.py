"""Typeset the bare relations left inside prose fields.

`components/content/MathText.tsx` renders `$...$` with KaTeX. Fields such as
`theory`, `calculation`, `derivation` and the derivation step prose were authored
with unicode "plain text" maths (`Y=FL/(AΔL)`, `−d[A]/dt=k[A]²`, `η=Ps/Pp<১`),
so a page could show one typeset relation next to one raw string — and Bangla
numerals inside a formula, which no textbook does.

The conversion is deliberately conservative and all-or-nothing per field (see
`wrap_plain_maths`): numeric worked examples with parenthesised values are left
untouched rather than risk changing their meaning.

Run: python3 scripts/wrap-prose-maths.py [--check]
"""

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from content_format_lib import (  # noqa: E402
    FrontmatterLines,
    join_mdx,
    parsed_value,
    split_mdx,
    wrap_plain_maths,
)

ROOT = Path(__file__).resolve().parents[1] / 'content'

PROSE_KEYS = {
    'equation': ('derivation', 'derivation_bn', 'step_en', 'step_bn'),
    'experiment': ('theory', 'theory_bn', 'calculation', 'calculation_bn'),
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report fields that would change')
    args = parser.parse_args()

    changed_files = changed_fields = 0
    for path in sorted(ROOT.glob('*/*/*.mdx')):
        text = path.read_text(encoding='utf8')
        match = re.search(r'^type:\s*"?(\w+)', text, re.M)
        kind = match.group(1) if match else 'equation'
        keys = PROSE_KEYS.get(kind, ())
        if not keys:
            continue
        frontmatter, body = split_mdx(text)
        lines = FrontmatterLines(frontmatter)
        touched = False
        for index, _indent, key, raw, _line in list(lines.entries()):
            if key not in keys:
                continue
            value = parsed_value(raw)
            if not isinstance(value, str):
                continue
            updated = wrap_plain_maths(value)
            if updated != value:
                touched = True
                changed_fields += 1
                if args.check:
                    print(f'{path.name} {key}\n  - {value[:120]}\n  + {updated[:120]}')
                else:
                    lines.set_line(index, updated)
        if touched:
            changed_files += 1
            if not args.check:
                path.write_text(join_mdx(str(lines), body), encoding='utf8')

    verb = 'would rewrite' if args.check else 'rewrote'
    print(f'{verb} {changed_fields} prose field(s) in {changed_files} file(s).')
    return 1 if args.check and changed_fields else 0


if __name__ == '__main__':
    raise SystemExit(main())
