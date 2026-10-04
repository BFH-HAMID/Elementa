"""Add the 10–12 point revision brief to every syllabus practical topic.

`content/practical-topics.json` feeds the practical index on `/experiments` and
`/chemistry`. Each topic used to carry one sentence, which is not enough to
revise from; every topic now also carries `points_bn` and `points_en`, rendered
by `components/content/PracticalCatalog.tsx` as a numbered brief.

The point text lives in the `practical_points_*` modules next to this script so
that each subject and stage can be reviewed on its own. This script only merges
them into the JSON, keeps the file's existing key order and indentation, and
normalises the topic relations so KaTeX can render them (`, \quad` chains become
aligned blocks, unicode plain-text maths becomes LaTeX).

Run: python3 scripts/add-practical-topic-points.py [--check]
"""

import argparse
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from content_format_lib import chain_to_aligned, normalise_latex  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'content' / 'practical-topics.json'

POINT_MODULES = [
    'practical_points_physics_school',
    'practical_points_physics_hsc',
    'practical_points_physics_hsc_part2',
    'practical_points_chemistry_school',
    'practical_points_chemistry_hsc',
    'practical_points_chemistry_hsc_part2',
]

# `_{\rm limiting}` reads as italicised maths; `_{\text{limiting}}` reads as a word.
RM_SUBSCRIPT = re.compile(r'_\{\\rm\s+([^{}]+)\}')

# Topic relations that the automatic normaliser cannot improve on its own:
# word fractions, bare italic chemical species, ambiguous trailing factors and
# `;`-joined relations that belong on separate aligned lines.
EQUATION_FIXES = {
    'physics-friction-coefficient-school': r'\mu = \frac{F_{\text{limiting}}}{N}',
    'physics-vernier-callipers-hsc': r'x = \mathrm{MSR} + (\mathrm{VSR} \times \mathrm{LC}) + \text{correction}',
    'physics-thermal-conductivity-hsc': r'Q = \frac{kA\Delta T\,t}{d}',
    'physics-prism-refractive-index-hsc': r'n = \frac{\sin\dfrac{A+\delta_m}{2}}{\sin\dfrac{A}{2}}',
    'physics-venturi-bernoulli-hsc': (
        r'\begin{aligned}'
        r' A_1v_1 &= A_2v_2 \\'
        r' P + \frac{1}{2}\rho v^2 + \rho gh &= \text{constant}'
        r' \end{aligned}'
    ),
    'physics-mass-spring-shm-hsc': r'T = 2\pi\sqrt{\frac{m}{k}}',
    'physics-viscosity-stokes-hsc': r'\eta = \frac{2r^2(\rho_s - \rho_f)g}{9v_t}',
    'physics-logic-gates-hsc': (
        r'\begin{aligned}'
        r' Y_{\text{AND}} &= AB \\'
        r' Y_{\text{OR}} &= A + B \\'
        r' Y_{\text{XOR}} &= A \oplus B'
        r' \end{aligned}'
    ),
    'chemistry-neutralisation-school': r'\text{acid} + \text{base} \rightarrow \text{salt} + \text{water}',
    'chemistry-ph-universal-indicator-school': r'\mathrm{pH} = -\log_{10}[\mathrm{H^+}]',
    'chemistry-hcl-naoh-titration-hsc': r'c_aV_a = c_bV_b',
    'chemistry-sodium-carbonate-hcl-titration-hsc': (
        r'\mathrm{Na_2CO_3} + 2\mathrm{HCl} \rightarrow 2\mathrm{NaCl} + \mathrm{H_2O} + \mathrm{CO_2}'
    ),
    'chemistry-permanganate-redox-titration-hsc': (
        r'\begin{aligned}'
        r' 2\mathrm{MnO_4^-} + 5\mathrm{C_2O_4^{2-}} + 16\mathrm{H^+}'
        r' &\rightarrow 2\mathrm{Mn^{2+}} + 10\mathrm{CO_2} + 8\mathrm{H_2O} \\'
        r' \mathrm{MnO_4^-} + 5\mathrm{Fe^{2+}} + 8\mathrm{H^+}'
        r' &\rightarrow \mathrm{Mn^{2+}} + 5\mathrm{Fe^{3+}} + 4\mathrm{H_2O}'
        r' \end{aligned}'
    ),
    'chemistry-edta-water-hardness-hsc': (
        r'\mathrm{M^{2+}} + \mathrm{EDTA^{4-}} \rightarrow [\mathrm{M(EDTA)}]^{2-}'
    ),
    'chemistry-iodometric-copper-titration-hsc': (
        r'\mathrm{I_2} + 2\mathrm{S_2O_3^{2-}} \rightarrow 2\mathrm{I^-} + \mathrm{S_4O_6^{2-}}'
    ),
    'chemistry-carboxylic-acid-test-hsc': (
        r'\mathrm{RCOOH} + \mathrm{NaHCO_3} \rightarrow \mathrm{RCOONa} + \mathrm{CO_2} + \mathrm{H_2O}'
    ),
    'chemistry-soap-preparation-hsc': (
        r'\text{fat/oil} + 3\mathrm{NaOH} \rightarrow \text{glycerol} + 3\mathrm{RCOONa}'
    ),
    'chemistry-ester-preparation-hsc': (
        r"\mathrm{RCOOH} + \mathrm{R'OH} \rightleftharpoons \mathrm{RCOOR'} + \mathrm{H_2O}"
    ),
    'chemistry-thiosulfate-hcl-rate-hsc': r'\text{rate} \propto \frac{1}{t_{\text{clouding}}}',
    'chemistry-solubility-hsc': r'S = \frac{\text{mass of solute in g}}{100\ \text{g of solvent}}',
    'chemistry-rf-chromatography-hsc': r'R_f = \frac{d_{\text{spot}}}{d_{\text{solvent front}}}',
    'chemistry-buffer-preparation-hsc': (
        r'\mathrm{pH} = \mathrm{p}K_a + \log\frac{[\mathrm{A^-}]}{[\mathrm{HA}]}'
    ),
    'chemistry-galvanic-cell-hsc': r'E_{\text{cell}} = E_{\text{cathode}} - E_{\text{anode}}',
    'chemistry-boyle-law-hsc': r'P_1V_1 = P_2V_2',
}


def load_points() -> dict:
    points: dict[str, dict] = {}
    for name in POINT_MODULES:
        try:
            module = __import__(name)
        except ModuleNotFoundError:
            continue
        for slug, entry in module.POINTS.items():
            if slug in points:
                raise SystemExit(f'duplicate points for {slug} in {name}')
            if len(entry['bn']) != len(entry['en']):
                raise SystemExit(f'{slug}: {len(entry["bn"])} Bangla points vs {len(entry["en"])} English points')
            if not 10 <= len(entry['en']) <= 12:
                raise SystemExit(f'{slug}: expected 10–12 points, found {len(entry["en"])}')
            points[slug] = entry
    return points


def normalise_equation(slug: str, value: str) -> str:
    if slug in EQUATION_FIXES:
        return EQUATION_FIXES[slug]  # already final LaTeX; do not re-normalise
    return chain_to_aligned(normalise_latex(RM_SUBSCRIPT.sub(lambda m: '_{\\text{' + m.group(1) + '}}', value)))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report topics that still have no points')
    args = parser.parse_args()

    catalog = json.loads(TARGET.read_text(encoding='utf8'), object_pairs_hook=OrderedDict)
    points = load_points()
    written = missing = 0

    for group in catalog['groups']:
        for topic in group['topics']:
            entry = points.get(topic['slug'])
            if entry:
                rebuilt = OrderedDict()
                for key, value in topic.items():
                    if key in ('points_bn', 'points_en'):
                        continue  # re-inserted below, in the same place
                    if key == 'equation' and isinstance(value, str):
                        value = normalise_equation(topic['slug'], value)
                    rebuilt[key] = value
                    if key == 'note_bn':
                        rebuilt['points_bn'] = entry['bn']
                        rebuilt['points_en'] = entry['en']
                if 'points_bn' not in rebuilt:
                    rebuilt['points_bn'] = entry['bn']
                    rebuilt['points_en'] = entry['en']
                topic.clear()
                topic.update(rebuilt)
                written += 1
            elif not topic.get('points_bn'):
                missing += 1
                print(f'no points yet: {group["id"]} {topic["slug"]}')
            elif isinstance(topic.get('equation'), str):
                topic['equation'] = normalise_equation(topic['slug'], topic['equation'])

    if args.check:
        print(f'{written} topic(s) supplied by the point modules, {missing} still without points.')
        return 1 if missing else 0

    TARGET.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    total = sum(len(group['topics']) for group in catalog['groups'])
    print(f'wrote points for {written} of {total} topics ({missing} still pending).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
