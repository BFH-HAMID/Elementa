"""Give every lab observation table Bangla column headings.

The 75 lab guides store one `observation_table.headers` list, so the Bangla
experiment page showed English column names (`sample volume (mL)`,
`initial burette (mL)`, `flow time t (s)`) above an otherwise Bangla table — and
the Bangla "লিখে রাখুন" bullet quoted the same English words.

Symbols, formulas and units are universal and stay exactly as they are
(`I (A)`, `T² (s²)`, `μ (kg/m)`, `V∞−Vt (mL)`, `κstd (S/m)`); only the English
quantity words are translated, through a longest-phrase-first dictionary. Digits
that belong to the heading text (`trial 1 range`) become Bangla numerals.

`headers_bn` is optional in `lib/schemas.ts`, so an untranslated heading simply
falls back to English.

Run: python3 scripts/add-observation-headers-bn.py [--check] [--verbose]
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

TERMS = {
    'initial reactant concentration': 'বিক্রিয়কের প্রাথমিক ঘনমাত্রা',
    'time for 20 cycles': '২০ দোলনের সময়',
    'baseline-to-front': 'বেসলাইন থেকে দ্রাবক-সম্মুখ',
    'baseline-to-spot': 'বেসলাইন থেকে স্পট',
    'dilution-corrected': 'লঘুকরণ-সংশোধিত',
    'blank-corrected titre': 'ব্ল্যাঙ্ক-সংশোধিত টাইট্রেশন পাঠ',
    'crucible+precipitate': 'ক্রুসিবল+অবক্ষেপ',
    'percentage difference': 'শতকরা পার্থক্য',
    'salicylic acid mass': 'স্যালিসিলিক অ্যাসিডের ভর',
    'ascorbic acid': 'অ্যাসকরবিক অ্যাসিড',
    'atmospheric pressure': 'বায়ুমণ্ডলীয় চাপ',
    'surface tension ratio': 'পৃষ্ঠটানের অনুপাত',
    'surface tension': 'পৃষ্ঠটান',
    'equilibrant mass': 'ভারসাম্যকারী ভর',
    'equilibrant angle': 'ভারসাম্যকারী কোণ',
    'equilibrant': 'ভারসাম্যকারী',
    'aspirin dry mass': 'অ্যাসপিরিনের শুষ্ক ভর',
    'theoretical mass': 'তাত্ত্বিক ভর',
    'precipitate mass': 'অবক্ষেপের ভর',
    'BaSO₄ mass': 'BaSO₄-এর ভর',
    'crucible+BaSO₄': 'ক্রুসিবল+BaSO₄',
    'SO₄²− mass': 'SO₄²−-এর ভর',
    'Ni mass': 'নিকেলের ভর',
    'Na₂CO₃ mass': 'Na₂CO₃-এর ভর',
    'solute mass': 'দ্রবের ভর',
    'solvent mass': 'দ্রাবকের ভর',
    'mixture mass': 'মিশ্রণের ভর',
    'charcoal m': 'কয়লার ভর',
    'total mass': 'মোট ভর',
    'sample volume': 'নমুনার আয়তন',
    'sample mass': 'নমুনার ভর',
    'sample angle': 'নমুনার কোণ',
    'water mass': 'পানির ভর',
    'final T': 'চূড়ান্ত তাপমাত্রা',
    'aliquot volume': 'অ্যালিকোট আয়তন',
    'organic volume': 'জৈব স্তরের আয়তন',
    'aqueous volume': 'জলীয় স্তরের আয়তন',
    'acid volume': 'অম্লের আয়তন',
    'base volume added': 'যোগ করা ক্ষারের আয়তন',
    'total volume': 'মোট আয়তন',
    'equivalence volume': 'তুল্যতা আয়তন',
    'Ce⁴⁺ volume': 'Ce⁴⁺-এর আয়তন',
    'screen distance': 'পর্দার দূরত্ব',
    'Object distance': 'বস্তুর দূরত্ব',
    'Image distance': 'বিম্বের দূরত্ব',
    'Focal length': 'ফোকাস দূরত্ব',
    'Potential difference': 'বিভব পার্থক্য',
    'head difference': 'উচ্চতা পার্থক্য',
    'path length': 'পথের দৈর্ঘ্য',
    'launch angle': 'নিক্ষেপ কোণ',
    'gauge pressure': 'গেজ চাপ',
    'measured unknown': 'পরিমাপিত অজানা রোধ',
    'corrected absorbance': 'সংশোধিত শোষণ',
    'initial burette': 'বুরেটের প্রাথমিক পাঠ',
    'final burette': 'বুরেটের চূড়ান্ত পাঠ',
    'raw titre': 'কাঁচা টাইট্রেশন পাঠ',
    'blank titre': 'ব্ল্যাঙ্ক টাইট্রেশন পাঠ',
    'HCl titre': 'HCl টাইট্রেশন পাঠ',
    'NaOH titre': 'NaOH টাইট্রেশন পাঠ',
    'SCN− titre': 'SCN− টাইট্রেশন পাঠ',
    'flow time': 'প্রবাহকাল',
    'clock time': 'ঘড়ির সময়',
    'mean period': 'গড় পর্যায়কাল',
    'drop count': 'ফোঁটার সংখ্যা',
    'fringe intervals': 'ঝালর ব্যবধান',
    'slit gap': 'চিরের ব্যবধান',
    'viscosity ratio': 'সান্দ্রতার অনুপাত',
    'dilution factor': 'লঘুকরণ গুণক',
    'melting range': 'গলনাঙ্ক পরিসর',
    'empty crucible': 'খালি ক্রুসিবল',
    'tentative cation': 'সম্ভাব্য ক্যাটায়ন',
    'observed colour': 'পর্যবেক্ষিত রং',
    'blank colour': 'ব্ল্যাঙ্কের রং',
    'standard colour': 'প্রমাণ রং',
    'sample ID': 'নমুনার পরিচয়',
    'spot ID': 'স্পটের পরিচয়',
    'reference Rf': 'রেফারেন্স Rf',
    'x estimate': 'x-এর অনুমান',
    'Ka estimate': 'Ka-এর অনুমান',
    'measured pH': 'পরিমাপিত pH',
    'acid concentration C': 'অম্লের ঘনমাত্রা C',
    'acid C and V': 'অম্লের ঘনমাত্রা ও আয়তন',
    'acid C': 'অম্লের ঘনমাত্রা C',
    'base C': 'ক্ষারের ঘনমাত্রা C',
    'iodine C': 'আয়োডিনের ঘনমাত্রা C',
    'dichromate C': 'ডাইক্রোমেটের ঘনমাত্রা C',
    'thiosulfate C': 'থায়োসালফেটের ঘনমাত্রা C',
    'AgNO₃ C': 'AgNO₃-এর ঘনমাত্রা C',
    'Cu²⁺ C': 'Cu²⁺-এর ঘনমাত্রা C',
    'Fe²⁺ C': 'Fe²⁺-এর ঘনমাত্রা C',
    'SCN− C': 'SCN−-এর ঘনমাত্রা C',
    'base C and V': 'ক্ষারের ঘনমাত্রা ও আয়তন',
    'organic C': 'জৈব স্তরের ঘনমাত্রা',
    'aqueous C': 'জলীয় স্তরের ঘনমাত্রা',
    'thiosulfate amount': 'থায়োসালফেটের পরিমাণ',
    'AgNO₃ added': 'যোগ করা AgNO₃',
    'EDTA molarity': 'EDTA মোলারিটি',
    'acid molarity': 'অম্লের মোলারিটি',
    'KMnO₄ molarity': 'KMnO₄ মোলারিটি',
    'Fe²⁺ molarity': 'Fe²⁺ মোলারিটি',
    'Fe sample': 'Fe নমুনা',
    'measured G': 'পরিমাপিত G',
    'P cumulative': 'P ক্রমযোজিত',
    'M cumulative': 'M ক্রমযোজিত',
    'OH− moles': 'OH− মোল',
    'CO₃²− moles': 'CO₃²− মোল',
    'ln ratio': 'ln অনুপাত',
    'peak T': 'শীর্ষ তাপমাত্রা',
    'initial T': 'প্রাথমিক তাপমাত্রা',
    'pure Tf': 'বিশুদ্ধ Tf',
    'solution Tf': 'দ্রবণের Tf',
    'time for 20 oscillations': '২০ দোলনের সময়',
    'accelerating voltage': 'ত্বরণ ভোল্টেজ',
    'collector current': 'সংগ্রাহক তড়িৎপ্রবাহ',
    'voltage spacing': 'ভোল্টেজ ব্যবধান',
    'extremum number': 'চূড়ার সংখ্যা',
    'elapsed time': 'অতিক্রান্ত সময়',
    'initial mirror position': 'প্রাথমিক দর্পণ অবস্থান',
    'source wavelength': 'উৎসের তরঙ্গদৈর্ঘ্য',
    'sheet thickness': 'পাতের পুরুত্ব',
    'disc mass': 'চাকতির ভর',
    'loop count': 'লুপ সংখ্যা',
    'mark distance': 'দাগের দূরত্ব',
    'tube radius': 'নলের ব্যাসার্ধ',
    'load current': 'লোড তড়িৎপ্রবাহ',
    'first length': 'প্রথম দৈর্ঘ্য',
    'second length': 'দ্বিতীয় দৈর্ঘ্য',
    'mean range': 'গড় পরিসর',
    'left angle': 'বাম কোণ',
    'right angle': 'ডান কোণ',
    'blank angle': 'ব্ল্যাঙ্ক কোণ',
    'left position': 'বাম অবস্থান',
    'right position': 'ডান অবস্থান',
    'final position': 'চূড়ান্ত অবস্থান',
    'mirror position': 'দর্পণ অবস্থান',
    'range': 'পরিসর',
    'position': 'অবস্থান',
    'mirror': 'দর্পণ',
    'oscillations': 'দোলন',
    'oscillation': 'দোলন',
    'elapsed': 'অতিক্রান্ত',
    'collector': 'সংগ্রাহক',
    'accelerating': 'ত্বরণ',
    'extremum': 'চূড়া',
    'spacing': 'ব্যবধান',
    'voltage': 'ভোল্টেজ',
    'disc': 'চাকতি',
    'sheet': 'পাত',
    'thickness': 'পুরুত্ব',
    'width': 'প্রস্থ',
    'loop': 'লুপ',
    'wire': 'তার',
    'mark': 'দাগ',
    'source': 'উৎস',
    'tube': 'নল',
    'load': 'ভার',
    'left': 'বাম',
    'right': 'ডান',
    'first': 'প্রথম',
    'second': 'দ্বিতীয়',
    'number': 'সংখ্যা',
    'extension': 'প্রসারণ',
    'temperature': 'তাপমাত্রা',
    'concentration': 'ঘনমাত্রা',
    'molarity': 'মোলারিটি',
    'molality': 'মোলালিটি',
    'absorbance': 'শোষণ',
    'transmittance': 'প্রেরণ',
    'percentage': 'শতকরা',
    'difference': 'পার্থক্য',
    'wavelength': 'তরঙ্গদৈর্ঘ্য',
    'frequency': 'কম্পাঙ্ক',
    'amplitude': 'বিস্তার',
    'resistance': 'রোধ',
    'capacitance': 'ধারকত্ব',
    'inductance': 'আবেশ',
    'equilibrant': 'ভারসাম্যকারী',
    'theoretical': 'তাত্ত্বিক',
    'predicted': 'প্রত্যাশিত',
    'calculated': 'নির্ণীত',
    'measured': 'পরিমাপিত',
    'corrected': 'সংশোধিত',
    'observed': 'পর্যবেক্ষিত',
    'cumulative': 'ক্রমযোজিত',
    'tentative': 'সম্ভাব্য',
    'equivalence': 'তুল্যতা',
    'precipitate': 'অবক্ষেপ',
    'crucible': 'ক্রুসিবল',
    'chloride': 'ক্লোরাইড',
    'thiosulfate': 'থায়োসালফেট',
    'dichromate': 'ডাইক্রোমেট',
    'iodine': 'আয়োডিন',
    'hardness': 'কঠোরতা',
    'viscosity': 'সান্দ্রতা',
    'density': 'ঘনত্ব',
    'volume': 'আয়তন',
    'pressure': 'চাপ',
    'burette': 'বুরেট',
    'radius': 'ব্যাসার্ধ',
    'diameter': 'ব্যাস',
    'length': 'দৈর্ঘ্য',
    'height': 'উচ্চতা',
    'depth': 'গভীরতা',
    'angle': 'কোণ',
    'screen': 'পর্দা',
    'distance': 'দূরত্ব',
    'interval': 'ব্যবধান',
    'fringe': 'ঝালর',
    'baseline': 'বেসলাইন',
    'solvent': 'দ্রাবক',
    'solute': 'দ্রব',
    'solution': 'দ্রবণ',
    'reactant': 'বিক্রিয়ক',
    'cation': 'ক্যাটায়ন',
    'anion': 'অ্যানায়ন',
    'colour': 'রং',
    'melting': 'গলন',
    'yield': 'উৎপাদন',
    'sample': 'নমুনা',
    'aliquot': 'অ্যালিকোট',
    'organic': 'জৈব',
    'aqueous': 'জলীয়',
    'unknown': 'অজানা',
    'standard': 'প্রমাণ',
    'reference': 'রেফারেন্স',
    'initial': 'প্রাথমিক',
    'final': 'চূড়ান্ত',
    'empty': 'খালি',
    'liquid': 'তরল',
    'setting': 'সেটিং',
    'balance': 'ভারসাম্য',
    'current': 'তড়িৎপ্রবাহ',
    'cycles': 'দোলন',
    'period': 'পর্যায়কাল',
    'mean': 'গড়',
    'total': 'মোট',
    'moles': 'মোল',
    'mole': 'মোল',
    'titre': 'টাইট্রেশন পাঠ',
    'emf': 'তড়িৎচালক শক্তি',
    'time': 'সময়',
    'mass': 'ভর',
    'trial': 'পরীক্ষণ',
    'count': 'সংখ্যা',
    'drops': 'ফোঁটা',
    'drop': 'ফোঁটা',
    'span': 'স্প্যান',
    'slit': 'চির',
    'spot': 'স্পট',
    'front': 'সম্মুখ',
    'ratio': 'অনুপাত',
    'pure': 'বিশুদ্ধ',
    'area': 'ক্ষেত্রফল',
    'flow': 'প্রবাহ',
    'head': 'উচ্চতা',
    'peak': 'শীর্ষ',
    'acid': 'অম্ল',
    'base': 'ক্ষার',
    'salt': 'লবণ',
    'water': 'পানি',
    'estimate': 'অনুমান',
    'added': 'যোগ করা',
    'raw': 'কাঁচা',
    'dry': 'শুষ্ক',
    'absolute': 'পরম',
    'gauge': 'গেজ',
    'launch': 'নিক্ষেপ',
    'and': 'ও',
    'or': 'বা',
    'fraction': 'ভগ্নাংশ',
    'ID': 'পরিচয়',
}

# Notation stays exactly as written: anything carrying a non-ASCII mark (Greek,
# a sub/superscript, a minus sign) and the glued subscript forms that earlier
# passes left in headers (`Gstd`, `Kcell`, `Gunknown`, `Cthio`).
GLUED_LABEL = (
    'std|cell|unknown|ref|raw|sol|cal|elec|thio|titre|blank|sample|acid|base|'
    'organic|aqueous|initial|final|total|theory|theoretical|vap|fus'
)
PROTECTED = re.compile(
    r'(?<!\S)(?:[A-Za-zΑ-Ωα-ω]|[^\x00-\x7F\s])(?:' + GLUED_LABEL + r')(?!\S)'
)
UNIT_PART = re.compile(r'^(?P<body>.*?)\s*\((?P<unit>[^()]*)\)$')
BANGLA_DIGITS = str.maketrans('0123456789', '০১২৩৪৫৬৭৮৯')
WORD = re.compile(r'[A-Za-z][A-Za-z\-]*')


def translate(body: str) -> str:
    """Translate the words of a heading, leaving every symbol untouched."""
    if not WORD.search(body):
        return body

    store: list[str] = []

    def protect(match: re.Match) -> str:
        store.append(match.group(0))
        return f'\x00{len(store) - 1}\x00'

    text = PROTECTED.sub(protect, body)
    for phrase in sorted(TERMS, key=len, reverse=True):
        pattern = re.compile(r'(?<![A-Za-z])' + re.escape(phrase) + r'(?![A-Za-z])', re.IGNORECASE)
        text = pattern.sub(TERMS[phrase], text)
    text = re.sub(r'\x00(\d+)\x00', lambda m: store[int(m.group(1))], text)
    # Digits that belong to the heading text read better as Bangla numerals.
    text = re.sub(r'(?:(?<=\s)|^)(\d+)(?=\s|$)',
                  lambda m: m.group(1).translate(BANGLA_DIGITS), text)
    return re.sub(r'\s{2,}', ' ', text).strip()


def heading(header: str) -> str:
    match = UNIT_PART.match(header)
    if match:
        unit = translate(match.group('unit'))
        return f"{translate(match.group('body'))} ({unit})"
    return translate(header)


def headings_for(data: dict) -> list[str] | None:
    table = data.get('observation_table')
    if not isinstance(table, dict):
        return None
    headers = table.get('headers')
    if not isinstance(headers, list) or not headers:
        return None
    return [heading(str(item)) for item in headers]


def rewrite(path: Path, verbose: bool) -> int:
    text = path.read_text(encoding='utf8')
    frontmatter, body = split_mdx(text)
    try:
        data = yaml.safe_load(frontmatter) or {}
    except yaml.YAMLError:
        return 0
    wanted = headings_for(data)
    if not wanted:
        return 0
    if data.get('observation_table', {}).get('headers_bn') == wanted:
        return 0

    lines = frontmatter.split('\n')
    index = next((i for i, line in enumerate(lines) if line.rstrip() == 'observation_table:'), None)
    if index is None:
        return 0
    headers_at = next((i for i in range(index + 1, min(index + 40, len(lines)))
                       if lines[i].startswith('  headers:')), None)
    if headers_at is None:
        return 0

    indent = '    '
    block = ['  headers_bn:'] + [f'{indent}- {json.dumps(item, ensure_ascii=False)}' for item in wanted]
    existing = next((i for i in range(index + 1, min(index + 40, len(lines)))
                     if lines[i].startswith('  headers_bn:')), None)
    if existing is not None:
        end = existing + 1
        while end < len(lines) and (lines[end].startswith(f'{indent}-') or lines[end].startswith(f'{indent} ')):
            end += 1
        lines[existing:end] = block
    else:
        # Insert after the `headers` list so `rows` stays last.
        end = headers_at + 1
        while end < len(lines) and lines[end].startswith('    -'):
            end += 1
        lines[end:end] = block

    path.write_text(join_mdx('\n'.join(lines), body), encoding='utf8')
    if verbose:
        print(f'--- {path.relative_to(ROOT)}')
        for source, target in zip(data['observation_table']['headers'], wanted):
            if source != target:
                print(f'    {source}  ->  {target}')
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='print the proposed headings and exit 1')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    changed = 0
    untranslated = 0
    for path in sorted(CONTENT.rglob('*.mdx')):
        frontmatter, _ = split_mdx(path.read_text(encoding='utf8'))
        try:
            data = yaml.safe_load(frontmatter) or {}
        except yaml.YAMLError:
            continue
        wanted = headings_for(data)
        if not wanted:
            continue
        if args.check:
            current = data.get('observation_table', {}).get('headers_bn')
            if current != wanted:
                changed += 1
                for source, target in zip(data['observation_table']['headers'], wanted):
                    if source == target:
                        continue
                    if WORD.search(target):
                        untranslated += 1
                    print(f'{path.relative_to(ROOT)}: {source}  ->  {target}')
            continue
        changed += rewrite(path, args.verbose)

    if args.check:
        print(f'{changed} file(s) would change; {untranslated} heading(s) still contain English words.')
        return 1 if changed else 0
    print(f'added Bangla headings to {changed} lab guide(s).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
