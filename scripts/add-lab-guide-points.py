"""Give every lab guide a 10-point brief and a report-writing checklist.

`components/content/ExperimentDetail.tsx` renders `key_points`/`key_points_bn`
as "The whole experiment at a glance" and `report`/`report_bn` as "Writing the
report", but no experiment file carried either field, so both cards stayed
empty. Rather than inventing generic text, this script builds the two lists
from what the guide already states — its aim, apparatus, theory relation, the
one step that is specific to this experiment, the observation-table columns,
the calculation, the first precaution, the first error source and the first
viva question — so each of the 75 guides gets its own brief.

Idempotent: existing key_points/report blocks are replaced, not duplicated.

Run: python3 scripts/add-lab-guide-points.py [--check] [--verbose]
"""

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

from content_format_lib import FrontmatterLines, split_mdx, join_mdx  # noqa: E402
from lab_aims import AIMS  # noqa: E402

# The span wrapper lives in a hyphenated sibling script, so it is loaded by path.
_wrapper_spec = importlib.util.spec_from_file_location(
    'wrap_derivation_prose', Path(__file__).resolve().parent / 'wrap-derivation-prose.py'
)
_wrapper = importlib.util.module_from_spec(_wrapper_spec)
_wrapper_spec.loader.exec_module(_wrapper)
wrap_prose_spans = _wrapper.wrap_prose_spans

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'

INLINE_MATH = re.compile(r'\$[^$]+\$')
EN_SENTENCE = re.compile(r'(?<=[.!?])\s+')
BN_SENTENCE = re.compile(r'(?<=।)\s+')

# Boilerplate inserted by scripts/add-honours-50-labs.py, recognised so that the
# derived brief can quote the step that is actually specific to the experiment.
CALIBRATION_STEP = ('Check the equipment calibration', 'শুরুর আগে যন্ত্রের ক্রমাঙ্কন')
REPEAT_STEP = ('Repeat at least three independent trials', 'অন্তত তিনটি স্বাধন পাঠ নিন')
AIM_LABELS = ('Determine or verify: ', 'উদ্দেশ্য: ', 'Aim: ')

JOIN_EN = ', '


def localised(en: str, bn: str) -> str:
    return f'{en} / {bn}'


def sentences(text: str, bangla: bool) -> list[str]:
    if not text:
        return []
    parts = BN_SENTENCE.split(text) if bangla else EN_SENTENCE.split(text)
    return [part.strip() for part in parts if part.strip()]


def first_sentence(text: str, bangla: bool) -> str:
    found = sentences(text, bangla)
    return found[0].rstrip('.।') if found else text.strip().rstrip('.।')


def strip_label(text: str) -> str:
    for label in AIM_LABELS:
        if text.startswith(label):
            return text[len(label):].strip()
    return text.strip()


def relation(theory: str, calculation: str) -> str:
    for source in (theory, calculation):
        found = INLINE_MATH.search(source or '')
        if found:
            return found.group(0)
    return ''


def specific_index(procedure: list[str]) -> int:
    """Index of the step that is specific to this experiment.

    The generated guides open with a calibration sentence and close with a
    generic repeat-the-trials sentence, so the informative step is the one in
    between. The same index is used for the Bangla list, which is parallel.
    """
    if not procedure:
        return 0
    if len(procedure) > 2 and procedure[0].startswith(CALIBRATION_STEP):
        return 1
    return max(range(len(procedure)), key=lambda i: len(procedure[i]))


def repeat_index(procedure: list[str]) -> int:
    for index, step in enumerate(procedure):
        if step.startswith(REPEAT_STEP):
            return index
    return -1


def join_items(items: list, limit: int = 5) -> str:
    return JOIN_EN.join(str(item) for item in items[:limit])


def build_key_points(data: dict) -> tuple[list[str], list[str]]:
    apparatus = data.get('apparatus') or []
    apparatus_bn = data.get('apparatus_bn') or apparatus
    procedure = data.get('procedure') or []
    procedure_bn = data.get('procedure_bn') or procedure
    precautions = data.get('precautions') or []
    precautions_bn = data.get('precautions_bn') or precautions
    errors = data.get('sources_of_error') or []
    errors_bn = data.get('sources_of_error_bn') or errors
    viva = data.get('viva') or []
    table = data.get('observation_table') or {}
    headers = table.get('headers') or []
    headers_bn = table.get('headers_bn') or headers
    theory = data.get('theory') or ''
    theory_bn = data.get('theory_bn') or theory
    calculation = data.get('calculation') or ''
    calculation_bn = data.get('calculation_bn') or calculation
    aim = strip_label(data.get('aim') or '')
    aim_bn = strip_label(data.get('aim_bn') or aim)
    # A relation bullet is only worth its line when the theory states one; if it
    # would merely repeat the calculation bullet, it is left out.
    maths = relation(theory, '') or relation(theory_bn, '') or relation(calculation, '')
    index = specific_index(procedure)
    step = procedure[index] if index < len(procedure) else ''
    step_bn = procedure_bn[index] if index < len(procedure_bn) else step
    repeat = repeat_index(procedure)
    repeat_text = procedure[repeat] if repeat >= 0 else ''
    repeat_text_bn = procedure_bn[repeat] if 0 <= repeat < len(procedure_bn) else repeat_text
    first_viva = viva[0] if viva else {}

    en = [
        f'Aim: {aim.rstrip(".")}.',
        f'Apparatus: {join_items(apparatus)}.',
        f'Principle: {first_sentence(theory, False)}.',
        f'Key step: {step.rstrip(".")}.',
        f'Record: {join_items(headers, 8)} for every trial, with units.',
        f'Calculation: {first_sentence(calculation, False)}.',
        f'Repeat: {repeat_text.rstrip(".") or "take at least three readings and use the mean, keeping the raw values in the report"}.',
        f'Take care: {precautions[0].rstrip(".") if precautions else "follow the lab safety rules and handle the apparatus as instructed"}.',
        f'Error sources: {errors[0].rstrip(".") if errors else "note every reading error you can think of and how it shifts the result"}.',
    ]
    bn = [
        f'উদ্দেশ্য: {aim_bn.rstrip("।")}।',
        f'যন্ত্রপাতি: {join_items(apparatus_bn)}।',
        f'মূলনীতি: {first_sentence(theory_bn, True)}।',
        f'মূল ধাপ: {step_bn.rstrip("।")}।',
        f'লিখে রাখুন: প্রতি পাঠে এককসহ {join_items(headers_bn, 8)}।',
        f'হিসাব: {first_sentence(calculation_bn, True)}।',
        f'পুনরাবৃত্তি: {repeat_text_bn.rstrip("।") or "অন্তত তিনটি পাঠ নিয়ে গড় ব্যবহার করুন এবং কাঁচা পাঠ প্রতিপাদনে রাখুন"}।',
        f'সতর্কতা: {precautions_bn[0].rstrip("।") if precautions_bn else "ল্যাবের নিরাপত্তা নিয়ম মেনে যন্ত্রপাতি ব্যবহার করুন"}।',
        f'ভুলের উৎস: {errors_bn[0].rstrip("।") if errors_bn else "পাঠের সম্ভাব্য ভুলগুলো এবং তা ফলকে কীভাবে বদলায় তা লিখুন"}।',
    ]
    if maths:
        en.insert(3, f'Relation to use: {maths}.')
        bn.insert(3, f'ব্যবহৃত সম্পর্ক: {maths}।')
    if first_viva:
        en.append(f'Viva: {str(first_viva.get("q", "")).rstrip("?")}?')
        bn.append(f'ভাইভা: {str(first_viva.get("q_bn") or first_viva.get("q", "")).rstrip("?")}?')
    return en, bn


def build_report(data: dict) -> tuple[list[str], list[str]]:
    title = data.get('title_en') or ''
    title_bn = data.get('title_bn') or title
    aim = strip_label(data.get('aim') or '')
    aim_bn = strip_label(data.get('aim_bn') or aim)
    apparatus = data.get('apparatus') or []
    apparatus_bn = data.get('apparatus_bn') or apparatus
    theory = data.get('theory') or ''
    theory_bn = data.get('theory_bn') or theory
    calculation = data.get('calculation') or ''
    calculation_bn = data.get('calculation_bn') or calculation
    table = data.get('observation_table') or {}
    headers = table.get('headers') or []
    headers_bn = table.get('headers_bn') or headers
    errors = data.get('sources_of_error') or []
    errors_bn = data.get('sources_of_error_bn') or errors
    # A relation bullet is only worth its line when the theory states one; if it
    # would merely repeat the calculation bullet, it is left out.
    maths = relation(theory, '') or relation(theory_bn, '') or relation(calculation, '')
    graph = any(word in f'{theory} {calculation} {" ".join(data.get("procedure") or [])}'.lower()
                for word in ('plot', 'graph', 'curve', 'slope'))
    graph_bn = graph or any(word in f'{theory_bn} {calculation_bn} {" ".join(data.get("procedure_bn") or [])}'
                            for word in ('লেখচিত্র', 'গ্রাফ', 'ঢাল'))

    en = [
        f'Heading: the title “{title}”, the date, your name and your partner’s name, then the aim in one sentence — {first_sentence(aim, False)}.',
        f'Apparatus: list what you actually used — {join_items(apparatus, 6)} — with the range or least count of every measuring instrument.',
        f'Theory: two or three lines naming the model and its assumptions, then the working relation {maths or "(quote the relation from the theory section)"}.',
        f'Observation table: reproduce the columns {join_items(headers, 8)}, enter each raw reading with its unit as you take it, and never overwrite an entry.',
        f'Calculation: {first_sentence(calculation, False)}. Show the substitution, then the final value with its unit and the mean of your repeated trials.',
        ('Graph: plot the quantities the procedure asks for on labelled axes, mark every point and draw the best-fit line, then quote the slope or intercept you used.'
         if graph else
         'Result: state the final value with its unit and the accepted or model value beside it, then give the percentage difference.'),
        f'Discussion: say whether the observation supports the model, then explain how the main error source — {first_sentence(errors[0], False) if errors else "reading and instrument error"} — shifts the result, and which precaution reduces it.',
    ]
    bn = [
        f'শিরোনাম: “{title_bn}”, তারিখ, আপনার ও সঙ্গীর নাম, তারপর এক বাক্যে উদ্দেশ্য — {first_sentence(aim_bn, True)}।',
        f'যন্ত্রপাতি: আপনি যা ব্যবহার করেছেন তা লিখুন — {join_items(apparatus_bn, 6)} — এবং প্রতিটি মাপক যন্ত্রের পরিসর বা লঘিষ্ঠ গণন উল্লেখ করুন।',
        f'তত্ত্ব: দুই-তিন লাইনে মডেল ও তার অনুমানগুলো লিখুন, তারপর কার্যকর সম্পর্ক {maths or "(তত্ত্ব অংশের সম্পর্কটি লিখুন)"}।',
        f'পর্যবেক্ষণ সারণি: {join_items(headers_bn, 8)} কলামগুলো তুলে ধরুন, প্রতিটি কাঁচা পাঠ এককসহ সঙ্গে সঙ্গে লিখুন এবং কোনো এন্ট্রি মুছে বা ওপরে লিখবেন না।',
        f'হিসাব: {first_sentence(calculation_bn, True)}। বসানোর ধাপগুলো দেখান, তারপর এককসহ চূড়ান্ত মান এবং পুনরাবৃত্তি পাঠের গড় লিখুন।',
        ('লেখচিত্র: ধাপ অনুযায়ী রাশিগুলোকে চিহ্নিত অক্ষে সাজান, প্রতিটি বিন্দু দিন, সর্বোত্তম রেখা টানুন এবং ব্যবহৃত ঢাল বা ছেদক লিখুন।'
         if graph_bn else
         'ফল: এককসহ চূড়ান্ত মান এবং স্বীকৃত বা মডেল মান পাশাপাশি লিখে শতকরা পার্থক্য দিন।'),
        f'আলোচনা: পর্যবেক্ষণ মডেলকে সমর্থন করে কি না বলুন, তারপর প্রধান ভুলের উৎস — {first_sentence(errors_bn[0], True) if errors_bn else "পাঠ ও যন্ত্রের ত্রুটি"} — ফলকে কীভাবে বদলায় এবং কোন সতর্কতা তা কমায় তা ব্যাখ্যা করুন।',
    ]
    return en, bn


def block_lines(key: str, values: list[str]) -> list[str]:
    lines = [f'{key}:']
    for value in values:
        lines.append('  - ' + json.dumps(value, ensure_ascii=False))
    return lines


def find_block(view: FrontmatterLines, key: str) -> tuple[int, int] | None:
    start = None
    for index, _indent, found, _value, _line in view.entries():
        if found == key and start is None:
            start = index
        elif start is not None:
            return start, index
    if start is None:
        return None
    end = start + 1
    while end < len(view.lines) and view.lines[end].startswith('  '):
        end += 1
    return start, end


def apply_file(path: Path, verbose: bool) -> bool:
    text = path.read_text(encoding='utf8')
    frontmatter, body = split_mdx(text)
    data = yaml.safe_load(frontmatter) or {}
    if data.get('type') != 'experiment':
        return False

    curated = AIMS.get(data.get('slug', ''))
    if curated:
        data['aim'] = curated['en']
        data['aim_bn'] = curated['bn']

    key_points, key_points_bn = build_key_points(data)
    report, report_bn = build_report(data)
    # Quoted column headers and relations still carry bare notation
    # (`T₀ (K)`, `P_radiative (W)`, `T⁴−T₀⁴-এর`), so they are typeset here too.
    key_points = [wrap_prose_spans(item) for item in key_points]
    key_points_bn = [wrap_prose_spans(item) for item in key_points_bn]
    report = [wrap_prose_spans(item) for item in report]
    report_bn = [wrap_prose_spans(item) for item in report_bn]
    view = FrontmatterLines(frontmatter)

    for key, value in (('aim', curated['en'] if curated else None), ('aim_bn', curated['bn'] if curated else None)):
        if not value:
            continue
        span = find_block(view, key)
        if not span:
            raise SystemExit(f'{path}: no {key} line to replace')
        view.set_line(span[0], value)

    for key, values in (('report_bn', report_bn), ('report', report),
                        ('key_points_bn', key_points_bn), ('key_points', key_points)):
        span = find_block(view, key)
        block = block_lines(key, values)
        if span:
            start, end = span
            view.lines[start:end] = block
        else:
            anchor = find_block(view, 'aim_bn') or find_block(view, 'aim')
            if not anchor:
                raise SystemExit(f'{path}: no aim field to anchor the new blocks')
            view.lines[anchor[1]:anchor[1]] = block

    updated = join_mdx(str(view), body)
    if updated == text:
        return False
    if verbose:
        print(f'--- {path.relative_to(ROOT)}')
        for line in key_points[:3]:
            print('   ', line[:110])
    path.write_text(updated, encoding='utf8')
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='list guides that have no key points yet')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    if args.check:
        missing = []
        for path in sorted(CONTENT.rglob('*.mdx')):
            frontmatter, _ = split_mdx(path.read_text(encoding='utf8'))
            data = yaml.safe_load(frontmatter) or {}
            if data.get('type') != 'experiment':
                continue
            if not data.get('key_points') or not data.get('report'):
                missing.append(str(path.relative_to(ROOT)))
        print('\n'.join(missing) or 'every lab guide has key points and report guidance.')
        return 1 if missing else 0

    changed = 0
    for path in sorted(CONTENT.rglob('*.mdx')):
        if apply_file(path, args.verbose):
            changed += 1
    print(f'updated {changed} lab guide(s).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
