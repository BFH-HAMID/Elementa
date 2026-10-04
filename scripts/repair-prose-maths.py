"""Wrap the last hand-written relations that were left as bare text in prose.

`components/content/MathText.tsx` renders `$...$` with KaTeX, so a sentence such
as "By definition N = N_0/2" must carry its maths inside delimiters. These
entries were authored before that convention and mixed unicode maths
(`E_n = −13.6/n² eV`, `(1 + x)^{1/2} ≈ 1 + x/2`) into Bangla and English prose,
which reads as noise on a phone. One entry also nested `\mathrm` inside `\text`,
which KaTeX rejects outright, and one body paragraph carried double-escaped
`$\\Delta H$`.

Replacements are applied to the *parsed* frontmatter values and re-encoded with
`json.dumps`, so YAML escaping is never hand-written here. Running the script
twice is a no-op.

Run: python3 scripts/repair-prose-maths.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from content_format_lib import FrontmatterLines, join_mdx, parsed_value, split_mdx  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]

# file -> {frontmatter key -> [(old substring, new substring)], 'body' -> [...]}
REPAIRS: dict[str, dict[str, list[tuple[str, str]]]] = {
    'content/chemistry/class-11-12/gibbs-free-energy-enthalpy-entropy.mdx': {
        'derivation': [
            ('Gibbs free energy G=H−TS gives ΔG=ΔH−TΔS.',
             r'Gibbs free energy $G=H-TS$ gives $\Delta G=\Delta H-T\Delta S$.'),
            ('the sign of ΔG indicates', r'the sign of $\Delta G$ indicates'),
        ],
        'derivation_bn': [
            ('গিবস মুক্তশক্তি G=H−TS থেকে ΔG=ΔH−TΔS পাওয়া যায়।',
             r'গিবস মুক্তশক্তি $G=H-TS$ থেকে $\Delta G=\Delta H-T\Delta S$ পাওয়া যায়।'),
            ('নির্দিষ্ট প্রক্রিয়ার ΔG-এর চিহ্ন', r'নির্দিষ্ট প্রক্রিয়ার $\Delta G$-এর চিহ্ন'),
        ],
        'step_en': [
            ('Keep ΔH and TΔS in the same energy units before evaluating ΔG.',
             r'Keep $\Delta H$ and $T\Delta S$ in the same energy units before evaluating $\Delta G$.'),
        ],
        'step_bn': [
            ('ΔG হিসাবের আগে ΔH ও TΔS-এর শক্তির একক একই রাখুন।',
             r'$\Delta G$ হিসাবের আগে $\Delta H$ ও $T\Delta S$-এর শক্তির একক একই রাখুন।'),
        ],
        'body': [
            (r'If $\\Delta H < 0$ and $\\Delta S > 0$, then $\\Delta G$ remains negative',
             r'If $\Delta H < 0$ and $\Delta S > 0$, then $\Delta G$ remains negative'),
            (r'If both $\\Delta H$ and $\\Delta S$ are negative',
             r'If both $\Delta H$ and $\Delta S$ are negative'),
        ],
    },
    'content/chemistry/honours/acid-dissociation-ratio.mdx': {
        # The generator flattened `K_a = a_{H+} a_{A-} / a_{HA}` into the prose
        # "Ka=aH aA/aHA", which no reader can decode.
        'derivation': [
            ('Start from Ka=aH aA/aHA and approximate activities by concentrations under fixed ionic conditions.',
             r'Start from the acid dissociation constant $K_a=\frac{a_{\mathrm{H}^+}\,a_{\mathrm{A}^-}}{a_{\mathrm{HA}}}$ and approximate the activities by concentrations at fixed ionic strength.'),
        ],
        'derivation_bn': [
            ('Ka=aH aA/aHA থেকে স্থির আয়নিক অবস্থায় সক্রিয়তার স্থলে ঘনত্বের অনুমান নিন।',
             r'অম্ল বিয়োজন ধ্রুবক $K_a=\frac{a_{\mathrm{H}^+}\,a_{\mathrm{A}^-}}{a_{\mathrm{HA}}}$ থেকে শুরু করে স্থির আয়নিক শক্তিতে সক্রিয়তার বদলে ঘনত্বের অনুমান নিন।'),
        ],
        'step_en': [
            ('Start from Ka=aH aA/aHA and approximate activities by concentrations under fixed ionic conditions.',
             r'Start from $K_a=\frac{a_{\mathrm{H}^+}\,a_{\mathrm{A}^-}}{a_{\mathrm{HA}}}$ and approximate the activities by concentrations at fixed ionic strength.'),
        ],
        'step_bn': [
            ('Ka=aH aA/aHA থেকে স্থির আয়নিক অবস্থায় সক্রিয়তার স্থলে ঘনত্বের অনুমান নিন।',
             r'$K_a=\frac{a_{\mathrm{H}^+}\,a_{\mathrm{A}^-}}{a_{\mathrm{HA}}}$ থেকে শুরু করে স্থির আয়নিক শক্তিতে সক্রিয়তার বদলে ঘনত্বের অনুমান নিন।'),
        ],
    },
    'content/chemistry/class-11-12/half-life-first-order.mdx': {
        'derivation_bn': [
            ('সংজ্ঞা অনুযায়ী t = t_{1/2} হলে [A] = [A]_0/2।',
             r'সংজ্ঞা অনুযায়ী $t=t_{1/2}$ হলে $[A]=[A]_0/2$।'),
        ],
    },
    'content/chemistry/class-9-10/poh-and-ph-relation.mdx': {
        'latex': [
            (r'\text{\mathrm{pH}} + \text{pOH} = 14\ \text{at }25^\circ\text{C}',
             r'\mathrm{pH}+\mathrm{pOH}=14\ \text{at}\ 25^\circ\mathrm{C}'),
            (r'\text{\mathrm{pH}} + \text{pOH} = \text{p}K_w = 14',
             r'\mathrm{pH}+\mathrm{pOH}=\mathrm{p}K_w=14'),
        ],
        'derivation': [
            ('equilibrium constant K_w = [H⁺][OH⁻]. Taking −log₁₀ of both sides converts the product into a sum of p-functions, giving pH + pOH = pK_w.',
             r'equilibrium constant $K_w=[\mathrm{H}^+][\mathrm{OH}^-]$. Taking $-\log_{10}$ of both sides converts the product into a sum of p-functions, giving $\mathrm{pH}+\mathrm{pOH}=\mathrm{p}K_w$.'),
        ],
        'derivation_bn': [
            ('পানি স্ব-আয়নিত হয়ে K_w = [H⁺][OH⁻] সাম্য ধ্রুবক মেনে চলে। উভয় পক্ষের −log₁₀ নিলে গুণফল যোগফলে পরিণত হয়, ফলে pH + pOH = pK_w।',
             r'পানি স্ব-আয়নিত হয়ে $K_w=[\mathrm{H}^+][\mathrm{OH}^-]$ সাম্য ধ্রুবক মেনে চলে। উভয় পক্ষের $-\log_{10}$ নিলে গুণফল যোগফলে পরিণত হয়, ফলে $\mathrm{pH}+\mathrm{pOH}=\mathrm{p}K_w$।'),
        ],
        'step_en': [
            ('Take −log₁₀ of both sides.', r'Take $-\log_{10}$ of both sides.'),
            ('and insert K_w = 1.0 × 10⁻¹⁴ at 25 °C.', r'and insert $K_w=1.0\times 10^{-14}$ at 25 °C.'),
        ],
        'step_bn': [
            ('উভয় পক্ষের −log₁₀ নিন।', r'উভয় পক্ষের $-\log_{10}$ নিন।'),
            ('এবং ২৫ °C-এ K_w = ১.০ × 10⁻¹⁴ বসান।', r'এবং ২৫ °C-এ $K_w=1.0\times 10^{-14}$ বসান।'),
        ],
    },
    'content/chemistry/honours/boltzmann-distribution.mdx': {
        'step_en': [
            ('Maximise ln W = ln(N! / ∏ N_j!) subject to ΣN_j = N and ΣN_j E_j = E.',
             r'Maximise $\ln W=\ln(N!/\prod N_j!)$ subject to $\sum N_j=N$ and $\sum N_j E_j=E$.'),
            ('Using Stirling’s approximation this gives N_j ∝ e^{−βE_j} with β = 1/(k_BT).',
             r'Using Stirling’s approximation this gives $N_j\propto e^{-\beta E_j}$ with $\beta=1/(k_BT)$.'),
        ],
        'step_bn': [
            ('ΣN_j = N ও ΣN_j E_j = E শর্তে ln W চরমীকরণ করুন।',
             r'$\sum N_j=N$ ও $\sum N_j E_j=E$ শর্তে $\ln W$ চরমীকরণ করুন।'),
            ('স্টার্লিং আসন্ন মান ব্যবহার করলে N_j ∝ e^{−βE_j} পাওয়া যায় যেখানে β = 1/(k_BT)।',
             r'স্টার্লিং আসন্ন মান ব্যবহার করলে $N_j\propto e^{-\beta E_j}$ পাওয়া যায়, যেখানে $\beta=1/(k_BT)$।'),
        ],
    },
    'content/chemistry/honours/rydberg-equation-hydrogen.mdx': {
        'derivation': [
            ('Substituting Bohr’s E_n = −13.6/n² eV into the photon energy relation hc/λ = E_{n_2} − E_{n_1} and collecting constants gives the Rydberg form with R_H the empirical constant.',
             r'Substituting Bohr’s $E_n=-13.6/n^2\ \text{eV}$ into the photon energy relation $hc/\lambda=E_{n_2}-E_{n_1}$ and collecting constants gives the Rydberg form, with $R_H$ the empirical constant.'),
        ],
        'derivation_bn': [
            ('বোরের E_n = −13.6/n² eV কে ফোটন শক্তির সম্পর্ক hc/λ = E_{n_2} − E_{n_1}-এ বসিয়ে ধ্রুবকগুলো একত্রিত করলে রিডবার্গ রূপ পাওয়া যায়।',
             r'বোরের $E_n=-13.6/n^2\ \text{eV}$ কে ফোটন শক্তির সম্পর্ক $hc/\lambda=E_{n_2}-E_{n_1}$-এ বসিয়ে ধ্রুবকগুলো একত্রিত করলে রিডবার্গ রূপ পাওয়া যায়।'),
        ],
        'step_en': [
            ('Insert E_n = −(me⁴)/(8ε_0²h²)(1/n²) and factor the common constant.',
             r'Insert $E_n=-me^4/(8\varepsilon_0^2h^2n^2)$ and factor out the common constant.'),
            ('Identify the prefactor as the Rydberg constant R_H ≈ 1.097 × 10⁷ m⁻¹.',
             r'Identify the prefactor as the Rydberg constant $R_H\approx 1.097\times 10^7\ \text{m}^{-1}$.'),
        ],
        'step_bn': [
            ('E_n-এর রাশি বসিয়ে সাধারণ ধ্রুবক ফ্যাক্টর করুন.',
             r'$E_n$-এর রাশি বসিয়ে সাধারণ ধ্রুবকটি আলাদা করুন।'),
            ('গুণকটিকে রিডবার্গ ধ্রুবক R_H ≈ ১.০৯৭ × 10⁷ m⁻¹ হিসেবে চিহ্নিত করুন।',
             r'গুণকটিকে রিডবার্গ ধ্রুবক $R_H\approx 1.097\times 10^7\ \text{m}^{-1}$ হিসেবে চিহ্নিত করুন।'),
        ],
    },
    'content/physics/class-11-12/half-life-radioactivity.mdx': {
        'derivation': [
            ('the time after which N = N_0/2. Substituting into the exponential decay law and taking the natural logarithm gives T_{1/2} = ln 2 / λ.',
             r'the time after which $N=N_0/2$. Substituting into the exponential decay law and taking the natural logarithm gives $T_{1/2}=\ln 2/\lambda$.'),
        ],
        'derivation_bn': [
            ('সেই সময় যার পরে N = N_0/2 হয়। সূচকীয় ক্ষয় সূত্রে বসিয়ে স্বাভাবিক লগারিদম নিলে T_{1/2} = ln 2 / λ পাওয়া যায়।',
             r'সেই সময় যার পরে $N=N_0/2$ হয়। সূচকীয় ক্ষয় সূত্রে বসিয়ে স্বাভাবিক লগারিদম নিলে $T_{1/2}=\ln 2/\lambda$ পাওয়া যায়।'),
        ],
        'step_en': [
            ('Set N = N_0/2 in the decay law and cancel N_0.',
             r'Set $N=N_0/2$ in the decay law and cancel $N_0$.'),
            ('note the mean lifetime is 1/λ.', r'note that the mean lifetime is $1/\lambda$.'),
        ],
        'step_bn': [
            ('ক্ষয় সূত্রে N = N_0/2 বসিয়ে N_0 বাতিল করুন।',
             r'ক্ষয় সূত্রে $N=N_0/2$ বসিয়ে $N_0$ বাতিল করুন।'),
            ('গড় আয়ু 1/λ উল্লেখ করুন।', r'গড় আয়ু $1/\lambda$ উল্লেখ করুন।'),
        ],
    },
    'content/physics/class-9-10/nth-second-displacement.mdx': {
        'derivation': [
            ('between t = n − 1 and t = n is found', r'between $t=n-1$ and $t=n$ is found'),
        ],
        'derivation_bn': [
            ('n সেকেন্ডে অতিক্রান্ত মোট সরণ থেকে (n − 1) সেকেন্ডে',
             r'$n$ সেকেন্ডে অতিক্রান্ত মোট সরণ থেকে $(n-1)$ সেকেন্ডে'),
        ],
        'step_en': [
            ('total displacements for t = n and t = n − 1 using', r'total displacements for $t=n$ and $t=n-1$ using'),
            ('Subtract S_{n-1} from S_n to isolate', r'Subtract $S_{n-1}$ from $S_n$ to isolate'),
            ('Simplify the algebraic difference n² − (n − 1)² = 2n − 1.',
             r'Simplify the algebraic difference $n^2-(n-1)^2=2n-1$.'),
        ],
        'step_bn': [
            ('ব্যবহার করে n সেকেন্ডে এবং (n − 1) সেকেন্ডে সরণ লিখুন।',
             r'ব্যবহার করে $n$ সেকেন্ডে এবং $(n-1)$ সেকেন্ডে সরণ লিখুন।'),
            ('S_n থেকে S_{n-1} বিয়োগ করুন।', r'$S_n$ থেকে $S_{n-1}$ বিয়োগ করুন।'),
        ],
    },
    'content/physics/class-9-10/speed-of-sound-temperature.mdx': {
        'derivation': [
            ('Sound speed in an ideal gas follows v ∝ √T.', r'Sound speed in an ideal gas follows $v\propto\sqrt{T}$.'),
        ],
        'step_en': [
            ('apply (1 + x)^{1/2} ≈ 1 + x/2 for small x.', r'apply $(1+x)^{1/2}\approx 1+x/2$ for small $x$.'),
            ('Insert v_0 ≈ 332 m/s at 0 °C', r'Insert $v_0\approx 332\ \text{m/s}$ at 0 °C'),
        ],
        'step_bn': [
            ('(1 + x)^{1/2} ≈ 1 + x/2 আসন্ন মান ব্যবহার করে বিস্তৃত করুন।',
             r'$(1+x)^{1/2}\approx 1+x/2$ আসন্ন মান ব্যবহার করে বিস্তৃত করুন।'),
            ('০ °C-এ v_0 ≈ 332 m/s বসিয়ে', r'০ °C-এ $v_0\approx 332\ \text{m/s}$ বসিয়ে'),
        ],
    },
}


def main() -> int:
    applied = missing = 0
    for relative, table in REPAIRS.items():
        path = ROOT / relative
        text = path.read_text(encoding='utf8')
        frontmatter, body = split_mdx(text)
        lines = FrontmatterLines(frontmatter)
        body_edits = table.get('body', [])

        # A key such as `step_en` occurs once per derivation step, so a
        # replacement is only reported missing when no occurrence matched.
        seen: dict[str, set[int]] = {key: set() for key in table if key != 'body'}
        for index, _indent, key, raw, _line in list(lines.entries()):
            replacements = table.get(key)
            if not replacements:
                continue
            value = parsed_value(raw)
            if not isinstance(value, str):
                continue
            updated = value
            for position, (old, new) in enumerate(replacements):
                if old in updated:
                    updated = updated.replace(old, new)
                    seen[key].add(position)
                elif new in updated:
                    seen[key].add(position)
            if updated != value:
                lines.set_line(index, updated)
        for key, matched in seen.items():
            for position, (old, new) in enumerate(table[key]):
                if position in matched:
                    applied += 1
                else:
                    print(f'MISSING {relative} {key}: {old[:70]}')
                    missing += 1

        for old, new in body_edits:
            if old in body:
                body = body.replace(old, new)
                applied += 1
            elif new in body:
                applied += 1
            else:
                print(f'MISSING {relative} body: {old[:70]}')
                missing += 1

        path.write_text(join_mdx(str(lines), body), encoding='utf8')
    print(f'{applied} replacement(s) in place, {missing} missing.')
    return 1 if missing else 0


if __name__ == '__main__':
    raise SystemExit(main())
