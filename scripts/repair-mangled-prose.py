"""Repair lab-guide prose fields that earlier passes half-wrapped.

Five Honours guides carry damage from the first formatting passes: subscripts
lost their separator (`q_solution` became `qsolution`), a decimal point was read
as a fraction (`κ_std = 1.0 S/m` became `1.\frac{0 S}{m}`), and a `$…$` span was
closed in the middle of an expression (`$(\frac{mg}{L})=Cthio\times (Vtitre-Vblank$`).
Every one of those reads as noise to a student, which is the "লেখার ফরমেট বোঝা
যাচ্ছে না" complaint.

Automated rules cannot recover the intended meaning, so the corrected strings are
written out here by hand — one entry per field, Bangla and English together — and
applied verbatim. `scripts/check-math.mjs` then renders every span with KaTeX, and
`scripts/add-lab-guide-points.py` regenerates the derived key points and report
bullets from these sources.

Run: python3 scripts/repair-mangled-prose.py [--check] [--verbose]
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

# path -> key -> replacement. A string replaces a scalar field; a dict replaces
# single items of a list field by position, leaving the other items alone.
FIXES = {
    'content/chemistry/honours/weak-acid-ph-approx-lab.mdx': {
        'aim': r'Estimate $K_{\mathrm{a}}$ from the pH of a known analytical concentration of a monoprotic weak acid.',
        'aim_bn': r'জানা প্রাথমিক ঘনত্বের এক-প্রোটনীয় দুর্বল অম্লের pH থেকে $K_{\mathrm{a}}$ নির্ণয়।',
        'theory': (
            r'For $HA \rightleftharpoons H^{+} + A^{-}$, $x \approx [H^{+}]$ and '
            r'$K_{\mathrm{a}} = \frac{x^{2}}{C-x}$ when activity corrections and water '
            r'autoionization are negligible. If $x \ll C$, $[H^{+}] \approx \sqrt{K_{\mathrm{a}}C}$. '
            r'pH reports hydrogen-ion activity rather than exact concentration.'
        ),
        'theory_bn': (
            r'$HA \rightleftharpoons H^{+} + A^{-}$ বিক্রিয়ায় সক্রিয়তার সংশোধন ও পানির স্ববিয়োজন '
            r'নগণ্য হলে $x \approx [H^{+}]$ এবং $K_{\mathrm{a}} = \frac{x^{2}}{C-x}$। '
            r'$x \ll C$ হলে $[H^{+}] \approx \sqrt{K_{\mathrm{a}}C}$। '
            r'pH ঠিক ঘনত্ব নয়, $H^{+}$-এর সক্রিয়তা দেয়।'
        ),
        'calculation': (
            r'If $C = 0.10$ M and $\mathrm{pH} \approx 3$, then $x \approx 0.001$ M and '
            r'$K_{\mathrm{a}} \approx \frac{(0.001)^{2}}{0.099} = 1.01 \times 10^{-5}$ M.'
        ),
        'calculation_bn': (
            r'$C = 0.10$ M ও $\mathrm{pH} \approx 3$ হলে $x \approx 0.001$ M এবং '
            r'$K_{\mathrm{a}} \approx \frac{(0.001)^{2}}{0.099} = 1.01 \times 10^{-5}$ M।'
        ),
        'procedure': {
            2: r'Estimate $x$ from the pH under a dilute-solution approximation and calculate $K_{\mathrm{a}} = \frac{x^{2}}{C-x}$.',
            3: r'Check $\frac{x}{C}$ and compare $K_{\mathrm{a}}$ across concentrations; note activity and $CO_{2}$ effects.',
        },
        'procedure_bn': {
            2: r'বিরল দ্রবণের অনুমানে pH থেকে $x$ বের করে $K_{\mathrm{a}} = \frac{x^{2}}{C-x}$ হিসাব করুন।',
            3: r'$\frac{x}{C}$ যাচাই করে ঘনত্বভেদে $K_{\mathrm{a}}$ তুলনা করুন; সক্রিয়তা ও $CO_{2}$-এর প্রভাব লিখুন।',
        },
    },
    'content/physics/honours/joules-heat-equivalent.mdx': {
        'theory': (
            r'Electrical input $VIt$ heats the water and the calorimeter: '
            r'$VIt \approx (m_{\mathrm{w}}c_{\mathrm{w}} + C_{\mathrm{c}})\Delta T$ plus losses. '
            r'The historical mechanical equivalent $J$ connects calories to joules; in SI, compare '
            r'the two energies directly.'
        ),
        'theory_bn': (
            r'বৈদ্যুতিক শক্তি $VIt$ পানি ও ক্যালরিমিটার গরম করে: '
            r'$VIt \approx (m_{\mathrm{w}}c_{\mathrm{w}} + C_{\mathrm{c}})\Delta T$, সঙ্গে কিছু ক্ষতি। '
            r'পুরোনো যান্ত্রিক সমতুল্য $J$ ক্যালরিকে জুলে রূপান্তর করে; SI পদ্ধতিতে সরাসরি শক্তি তুলনা করুন।'
        ),
        'calculation': (
            r'Compute $E_{\mathrm{elec}} = VIt$ and '
            r'$Q_{\mathrm{water+cal}} = (m_{\mathrm{w}}c_{\mathrm{w}} + C_{\mathrm{c}})\Delta T$; '
            r'compare them and report the loss rather than a fabricated efficiency above 100%.'
        ),
        'calculation_bn': (
            r'$E_{\mathrm{elec}} = VIt$ ও '
            r'$Q_{\mathrm{water+cal}} = (m_{\mathrm{w}}c_{\mathrm{w}} + C_{\mathrm{c}})\Delta T$ '
            r'তুলনা করে ক্ষতি লিখুন; ১০০%-এর বেশি কাল্পনিক দক্ষতা নয়।'
        ),
    },
    'content/chemistry/honours/conductance-cell-constant-lab.mdx': {
        'theory': (
            r'For a cell of length $l$ and electrode area $A$ the effective cell constant is '
            r'$K_{\mathrm{cell}} = \frac{l}{A}$, and the conductivity is '
            r'$\kappa = G K_{\mathrm{cell}}$. A standard of known conductivity '
            r'$\kappa_{\mathrm{std}}$ gives $K_{\mathrm{cell}} = \frac{\kappa_{\mathrm{std}}}{G_{\mathrm{std}}}$. '
            r'Use an AC meter to reduce polarization and keep the temperature matched.'
        ),
        'theory_bn': (
            r'দৈর্ঘ্য $l$ ও তড়িৎদ্বারের ক্ষেত্রফল $A$ হলে কার্যকর কোষধ্রুবক '
            r'$K_{\mathrm{cell}} = \frac{l}{A}$ এবং পরিবাহিতা $\kappa = G K_{\mathrm{cell}}$। '
            r'জানা পরিবাহিতার মান দ্রবণ $\kappa_{\mathrm{std}}$ থেকে '
            r'$K_{\mathrm{cell}} = \frac{\kappa_{\mathrm{std}}}{G_{\mathrm{std}}}$। '
            r'মেরুকরণ কমাতে AC মিটার ব্যবহার করুন এবং তাপমাত্রা একই রাখুন।'
        ),
        'calculation': (
            r'If $\kappa_{\mathrm{std}} = 1.0$ S/m and $G_{\mathrm{std}} = 0.010$ S, then '
            r'$K_{\mathrm{cell}} = 100$ m⁻¹; for the unknown, $G = 0.005$ S gives '
            r'$\kappa = 0.50$ S/m.'
        ),
        'calculation_bn': (
            r'$\kappa_{\mathrm{std}} = 1.0$ S/m ও $G_{\mathrm{std}} = 0.010$ S হলে '
            r'$K_{\mathrm{cell}} = 100$ m⁻¹; অজানা দ্রবণে $G = 0.005$ S হলে $\kappa = 0.50$ S/m।'
        ),
        'procedure': {
            1: r'Read the conductance of the standard at least three times and compute $K_{\mathrm{cell}}$ from its certified $\kappa_{\mathrm{std}}$.',
            2: r'Rinse with the unknown, read the conductance at the same temperature and compute $\kappa_{\mathrm{unknown}}$.',
        },
        'procedure_bn': {
            1: r'মান দ্রবণের পরিবাহন অন্তত তিনবার মেপে তার প্রমাণিত $\kappa_{\mathrm{std}}$ থেকে $K_{\mathrm{cell}}$ হিসাব করুন।',
            2: r'অজানা দ্রবণে ধুয়ে একই তাপমাত্রায় পরিবাহন মেপে $\kappa_{\mathrm{unknown}}$ বের করুন।',
        },
    },
    'content/chemistry/honours/dissolved-oxygen-winkler.mdx': {
        'theory': (
            r'Dissolved $O_{2}$ oxidizes $Mn^{2+}$ in alkaline medium; after acidification the '
            r'oxidized manganese liberates iodine from iodide, '
            r'$MnO_{2} + 2I^{-} + 4H^{+} \rightarrow Mn^{2+} + I_{2} + 2H_{2}O$. The iodine is '
            r'titrated with thiosulfate, $I_{2} + 2S_{2}O_{3}^{2-} \rightarrow 2I^{-} + S_{4}O_{6}^{2-}$, '
            r'so one $O_{2}$ corresponds to four thiosulfate ions.'
        ),
        'theory_bn': (
            r'দ্রবীভূত $O_{2}$ ক্ষারীয় মাধ্যমে $Mn^{2+}$-কে জারিত করে; অম্লীয় করলে জারিত ম্যাঙ্গানিজ '
            r'আয়োডাইড থেকে আয়োডিন মুক্ত করে, '
            r'$MnO_{2} + 2I^{-} + 4H^{+} \rightarrow Mn^{2+} + I_{2} + 2H_{2}O$। '
            r'সেই আয়োডিন থায়োসালফেট দিয়ে টাইট্রেট করা হয়, '
            r'$I_{2} + 2S_{2}O_{3}^{2-} \rightarrow 2I^{-} + S_{4}O_{6}^{2-}$; '
            r'তাই মোট বিক্রিয়ায় এক $O_{2}$-এর জন্য চার থায়োসালফেট আয়ন লাগে।'
        ),
        'calculation': (
            r'Dissolved oxygen $= C_{\mathrm{thio}} \times (V_{\mathrm{titre}} - V_{\mathrm{blank}}) '
            r'\times \frac{32.00}{4} \times \frac{1000}{V_{\mathrm{sample}}}$ in mg/L, with every '
            r'volume in litres and the reagent-displaced sample volume corrected.'
        ),
        'calculation_bn': (
            r'দ্রবীভূত অক্সিজেন $= C_{\mathrm{thio}} \times (V_{\mathrm{titre}} - V_{\mathrm{blank}}) '
            r'\times \frac{32.00}{4} \times \frac{1000}{V_{\mathrm{sample}}}$ mg/L এককে; প্রতিটি আয়তন '
            r'লিটারে নিন এবং বিকারকে সরানো নমুনা আয়তন সংশোধন করুন।'
        ),
        'procedure': {
            1: r'Collect the water without bubbles, fix the oxygen at once with manganese sulfate and alkaline iodide, acidify, and titrate the released iodine with thiosulfate.',
        },
        'procedure_bn': {
            1: r'বুদ্‌বুদ ছাড়া পানি নিয়ে সঙ্গে সঙ্গে ম্যাঙ্গানিজ সালফেট ও ক্ষারীয় আয়োডাইডে অক্সিজেন স্থির করুন; অম্লীয় করে উৎপন্ন আয়োডিন থায়োসালফেট দিয়ে টাইট্রেট করুন।',
        },
    },
    'content/chemistry/honours/mohr-chloride-titration.mdx': {
        'theory': (
            r'$Ag^{+}$ first precipitates $Cl^{-}$ as $AgCl$. After the equivalence point, excess '
            r'$Ag^{+}$ produces brick-red $Ag_{2}CrO_{4}$ with the chromate indicator. Keep the '
            r'solution near neutral pH.'
        ),
        'theory_bn': (
            r'$Ag^{+}$ আগে $Cl^{-}$-কে $AgCl$ হিসেবে অধঃক্ষেপ করে। সমাপ্তির পর অতিরিক্ত $Ag^{+}$ '
            r'ক্রোমেট নির্দেশকে ইট-লাল $Ag_{2}CrO_{4}$ দেয়। pH প্রায় নিরপেক্ষ রাখুন।'
        ),
        'calculation': (
            r'$n(Cl^{-}) = C_{\mathrm{Ag}}(V_{\mathrm{raw}} - V_{\mathrm{blank}})$; multiply by '
            r'35.45 g/mol and divide by the sample volume to obtain mg/L.'
        ),
        'calculation_bn': (
            r'$n(Cl^{-}) = C_{\mathrm{Ag}}(V_{\mathrm{raw}} - V_{\mathrm{blank}})$; ৩৫.৪৫ g/mol দিয়ে '
            r'গুণ করে নমুনার আয়তন দিয়ে ভাগ করলে mg/L পাওয়া যাবে।'
        ),
        'procedure': {
            1: r'Titrate a measured chloride sample at near-neutral pH with standardized $AgNO_{3}$ until a persistent faint brick-red colour appears; run a blank.',
        },
        'procedure_bn': {
            1: r'প্রায় নিরপেক্ষ pH-এ জানা ক্লোরাইড নমুনায় মান $AgNO_{3}$ দিয়ে স্থায়ী ফিকে ইট-লাল রং পর্যন্ত টাইট্রেট করুন; একটি blank নিন।',
        },
    },
    'content/chemistry/honours/neutralization-calorimetry.mdx': {
        'theory': (
            r'For dilute strong acid and base, $H^{+} + OH^{-} \rightarrow H_{2}O$; at roughly '
            r'constant pressure, $q_{\mathrm{solution}} \approx (m_{\mathrm{sol}}c + C_{\mathrm{c}})\Delta T$ '
            r'and $\Delta H_{\mathrm{neutralization}} \approx -\frac{q_{\mathrm{solution}}}{n_{\mathrm{water}}}$ '
            r'for the water formed.'
        ),
        'theory_bn': (
            r'বিরল শক্ত অম্ল-ক্ষারে $H^{+} + OH^{-} \rightarrow H_{2}O$; প্রায় স্থির চাপে '
            r'$q_{\mathrm{solution}} \approx (m_{\mathrm{sol}}c + C_{\mathrm{c}})\Delta T$ এবং '
            r'উৎপন্ন পানির মোল সংখ্যা দিয়ে '
            r'$\Delta H_{\mathrm{neutralization}} \approx -\frac{q_{\mathrm{solution}}}{n_{\mathrm{water}}}$।'
        ),
        'calculation': (
            r'Compute the moles of water from the limiting $H^{+}$ or $OH^{-}$; '
            r'$\Delta H = -\frac{(m_{\mathrm{sol}}c + C_{\mathrm{c}})\Delta T}{n_{\mathrm{water}}}$. '
            r'If the cup heat capacity $C_{\mathrm{c}}$ is unknown, state the approximation explicitly.'
        ),
        'calculation_bn': (
            r'সীমাবদ্ধ $H^{+}$ বা $OH^{-}$ থেকে পানির মোল বের করুন; '
            r'$\Delta H = -\frac{(m_{\mathrm{sol}}c + C_{\mathrm{c}})\Delta T}{n_{\mathrm{water}}}$; '
            r'পাত্রের তাপধারণ ক্ষমতা অজানা হলে অনুমানটি স্পষ্ট করে লিখুন।'
        ),
    },
    'content/chemistry/honours/aspirin-synthesis-lab.mdx': {
        'calculation': (
            r'With excess anhydride the 1:1 mole ratio gives '
            r'$m_{\mathrm{theory}} = m_{\mathrm{salicylic}} \times \frac{180.16}{138.12}$, and the '
            r'percentage yield is $100 \times \frac{m_{\mathrm{dry}}}{m_{\mathrm{theory}}}$. For 2.00 g '
            r'of salicylic acid the theoretical aspirin mass is 2.61 g (three significant figures); '
            r'wet crystals give an artificially high yield.'
        ),
        'calculation_bn': (
            r'অ্যানহাইড্রাইড অতিরিক্ত থাকলে ১:১ মোল অনুপাতে তাত্ত্বিক ভর '
            r'$m_{\mathrm{theory}} = m_{\mathrm{salicylic}} \times \frac{180.16}{138.12}$ এবং শতকরা উৎপাদ '
            r'$= 100 \times \frac{m_{\mathrm{dry}}}{m_{\mathrm{theory}}}$। ২.০০ g স্যালিসিলিক অ্যাসিডে '
            r'তাত্ত্বিক অ্যাসপিরিন ২.৬১ g (৩টি তাৎপর্যপূর্ণ অঙ্ক); ভেজা স্ফটিকে কৃত্রিমভাবে বেশি উৎপাদ দেখা যায়।'
        ),
    },
    'content/chemistry/honours/nickel-dmg-gravimetry.mdx': {
        'calculation': (
            r'$m(\mathrm{Ni}) = m(\mathrm{Ni(DMG)_{2}}) \times \frac{58.693}{288.91}$. '
            r'Report if interfering metal ions were not removed.'
        ),
        'calculation_bn': (
            r'$m(\mathrm{Ni}) = m(\mathrm{Ni(DMG)_{2}}) \times \frac{58.693}{288.91}$; '
            r'বাধাসৃষ্টিকারী ধাতু বাদ দেওয়া হয়েছে কি না লিখুন।'
        ),
    },
    'content/chemistry/honours/sulfate-gravimetry-baso4.mdx': {
        'calculation': (
            r'$m(\mathrm{sulfate}) = m(\mathrm{BaSO_{4}}) \times \frac{96.06}{233.39}$. '
            r'For 0.23339 g of $\mathrm{BaSO_{4}}$ the sulfate mass is 0.09606 g.'
        ),
        'calculation_bn': (
            r'$m(\mathrm{sulfate}) = m(\mathrm{BaSO_{4}}) \times \frac{96.06}{233.39}$; '
            r'০.২৩৩৩৯ g $\mathrm{BaSO_{4}}$-এ সালফেট ০.০৯৬০৬ g।'
        ),
    },
    'content/chemistry/honours/volhard-chloride-back-titration.mdx': {
        'theory': (
            r'Add a known excess of $AgNO_{3}$ to precipitate the chloride, then back-titrate the '
            r'leftover $Ag^{+}$ with $SCN^{-}$: $Ag^{+} + SCN^{-} \rightarrow AgSCN(s)$. A ferric '
            r'indicator turns red with excess $SCN^{-}$; keep $AgCl$ from reacting with $SCN^{-}$ by '
            r'filtration or a validated procedure.'
        ),
        'theory_bn': (
            r'জানা অতিরিক্ত $AgNO_{3}$ দিয়ে $Cl^{-}$ অধঃক্ষেপ করে বাকি $Ag^{+}$ কে $SCN^{-}$ দিয়ে '
            r'মাপুন: $Ag^{+} + SCN^{-} \rightarrow AgSCN$। $Fe^{3+}$ নির্দেশকে বাড়তি $SCN^{-}$ লাল রং '
            r'দেয়; $AgCl$-এর সঙ্গে $SCN^{-}$ বিক্রিয়া ঠেকাতে ছেঁকে নেওয়া বা অনুমোদিত পদ্ধতি অনুসরণ করুন।'
        ),
        'calculation': (
            r'$n(Cl^{-}) = n(Ag^{+})_{\mathrm{added}} - n(SCN^{-})_{\mathrm{used}}$; subtract a '
            r'suitable blank and convert to mass if needed.'
        ),
        'calculation_bn': (
            r'যোগকৃত $Ag^{+}$-এর মোল থেকে ব্যবহৃত $SCN^{-}$-এর মোল বাদ দিলে $n(Cl^{-})$ পাওয়া যায়; '
            r'প্রয়োজনীয় blank বাদ দিয়ে ভর বের করুন।'
        ),
    },
    'content/physics/honours/hall-effect-lab.mdx': {
        'theory': (
            r'For a single dominant carrier type, the transverse force balance '
            r'$qE_{\mathrm{H}} = qv_{\mathrm{d}}B$ and $I = nqv_{\mathrm{d}}wt$ give '
            r'$V_{\mathrm{H}} = \frac{IB}{nqt}$, where $t$ is the thickness along $B$. The signed '
            r'Hall coefficient $R_{\mathrm{H}} = \frac{V_{\mathrm{H}}t}{IB} = \frac{1}{nq}$ '
            r'identifies the carrier by its sign; multiple carrier types invalidate the simple '
            r'density formula.'
        ),
        'theory_bn': (
            r'এক প্রধান ধরনের বাহকের জন্য আনুপ্রস্থ বলের সাম্য '
            r'$qE_{\mathrm{H}} = qv_{\mathrm{d}}B$ এবং $I = nqv_{\mathrm{d}}wt$ থেকে '
            r'$V_{\mathrm{H}} = \frac{IB}{nqt}$; এখানে $t$ হলো $B$-এর দিকের পুরুত্ব। চিহ্নযুক্ত হল সহগ '
            r'$R_{\mathrm{H}} = \frac{V_{\mathrm{H}}t}{IB} = \frac{1}{nq}$; চিহ্ন থেকে বাহকের প্রকৃতি '
            r'বোঝা যায়। একাধিক বাহক থাকলে সহজ ঘনত্বের সূত্র প্রযোজ্য নয়।'
        ),
        'calculation': (
            r'$V_{\mathrm{H}} = \frac{V(+B) - V(-B)}{2}$; if the slope is '
            r'$s = \frac{dV_{\mathrm{H}}}{dB}$ at fixed $I$, then $R_{\mathrm{H}} = \frac{st}{I}$ in '
            r'm³/C and, for one carrier species, $n = \frac{1}{|R_{\mathrm{H}}|e}$ in m⁻³. Record the '
            r'polarity convention before interpreting the sign.'
        ),
        'calculation_bn': (
            r'$V_{\mathrm{H}} = \frac{V(+B) - V(-B)}{2}$; স্থির $I$-তে ঢাল '
            r'$s = \frac{dV_{\mathrm{H}}}{dB}$ হলে $R_{\mathrm{H}} = \frac{st}{I}$ (m³/C এককে) এবং '
            r'এক ধরনের বাহকের জন্য $n = \frac{1}{|R_{\mathrm{H}}|e}$ (m⁻³ এককে)। চিহ্ন ব্যাখ্যার আগে '
            r'মেরুতার রীতি লিখুন।'
        ),
    },
    'content/physics/honours/rigidity-torsion-pendulum.mdx': {
        'theory': (
            r'For a long circular wire of length $L$ and radius $r$, the torsion constant is '
            r'$\kappa = \frac{\pi G r^{4}}{2L}$. With an attached moment of inertia $I$, '
            r'$T = 2\pi \sqrt{I/\kappa}$.'
        ),
        'theory_bn': (
            r'$L$ দৈর্ঘ্য ও $r$ ব্যাসার্ধের বৃত্তাকার তারে পাক ধ্রুবক $\kappa = \frac{\pi G r^{4}}{2L}$। '
            r'যুক্ত জড়তার ভ্রামক $I$ হলে $T = 2\pi \sqrt{I/\kappa}$।'
        ),
        'calculation': (
            r'Compute $\kappa = 4\pi^{2}\frac{I}{T^{2}}$ and $G = \frac{2L\kappa}{\pi r^{4}}$. '
            r'Compare the periods for several oscillation counts.'
        ),
        'calculation_bn': (
            r'$\kappa = 4\pi^{2}\frac{I}{T^{2}}$ এবং $G = \frac{2L\kappa}{\pi r^{4}}$ হিসাব করুন; '
            r'বিভিন্ন দোলনসংখ্যায় পর্যায়কাল তুলনা করুন।'
        ),
    },
    'content/chemistry/honours/beer-transmittance-lab.mdx': {
        'calculation': (
            r'If $T = 0.10$ then $A = 1.00$; with $l = 1$ cm, '
            r'$\epsilon = \frac{100\ \mathrm{L}}{\mathrm{mol\,cm}}$ and '
            r'$c = 0.010\ \mathrm{mol/L}$.'
        ),
        'calculation_bn': (
            r'$T = 0.10$ হলে $A = 1.00$; $l = 1$ cm ও '
            r'$\epsilon = \frac{100\ \mathrm{L}}{\mathrm{mol\,cm}}$ হলে '
            r'$c = 0.010\ \mathrm{mol/L}$।'
        ),
    },
    'content/chemistry/honours/ester-hydrolysis-kinetics.mdx': {
        'calculation': (
            r'Plot $\ln\frac{V_{\infty}-V_{0}}{V_{\infty}-V_{t}}$ against $t$; the slope '
            r'is $k$ in reciprocal time. Blank-correct the acid catalyst contribution.'
        ),
    },
    'content/chemistry/honours/hydrogen-peroxide-decomposition.mdx': {
        'calculation': (
            r'If the first-order form is validated, plot $\ln(V_{\infty}-V_{t})$ against $t$ '
            r'and take $k = -\text{slope}$; control gas pressure and water-vapour effects.'
        ),
    },
    'content/chemistry/honours/naoh-oxalic-standardization.mdx': {
        'calculation': (
            r'$C_{\mathrm{NaOH}} = \frac{2C_{\mathrm{acid}}V_{\mathrm{acid}}}{V_{\mathrm{NaOH}}}$ '
            r'with matching volume units. For $0.0500$ M acid, $20.00$ mL of acid and '
            r'$20.00$ mL of base, $C_{\mathrm{NaOH}} = 0.1000$ M.'
        ),
    },
    'content/chemistry/honours/ostwald-viscometer-relative.mdx': {
        'calculation': (
            r'$\frac{\eta_{\mathrm{unknown}}}{\eta_{\mathrm{reference}}} = '
            r'\frac{\rho_{\mathrm{unknown}}t_{\mathrm{unknown}}}'
            r'{\rho_{\mathrm{reference}}t_{\mathrm{reference}}}$. '
            r'Report the mean and the timing spread.'
        ),
        'calculation_bn': (
            r'$\frac{\eta_{\mathrm{unknown}}}{\eta_{\mathrm{reference}}} = '
            r'\frac{\rho_{\mathrm{unknown}}t_{\mathrm{unknown}}}'
            r'{\rho_{\mathrm{reference}}t_{\mathrm{reference}}}$; '
            r'গড় ও সময়ের বিচ্যুতি লিখুন।'
        ),
    },
    'content/chemistry/honours/stalagmometer-surface-tension.mdx': {
        'calculation': (
            r'$\frac{\gamma_{\mathrm{unknown}}}{\gamma_{\mathrm{ref}}} = '
            r'\frac{\rho_{\mathrm{unknown}}n_{\mathrm{ref}}}'
            r'{\rho_{\mathrm{ref}}n_{\mathrm{unknown}}}$ under the drop-count '
            r'approximation; report the limitation of the method.'
        ),
        'calculation_bn': (
            r'ফোঁটা-গণনা অনুমানে $\frac{\gamma_{\mathrm{unknown}}}{\gamma_{\mathrm{ref}}} = '
            r'\frac{\rho_{\mathrm{unknown}}n_{\mathrm{ref}}}'
            r'{\rho_{\mathrm{ref}}n_{\mathrm{unknown}}}$; পদ্ধতির সীমা লিখুন।'
        ),
    },
    'content/chemistry/honours/thin-layer-chromatography-honours.mdx': {
        'theory': (
            r'On a TLC plate, $R_{\mathrm{f}} = \frac{\text{distance travelled by the spot centre}}'
            r'{\text{distance travelled by the solvent front}}$, both measured from the same '
            r'pencil origin; for a given system $R_{\mathrm{f}}$ depends on adsorption and on the '
            r'mobile-phase composition.'
        ),
    },
    'content/chemistry/honours/vitamin-c-iodimetry.mdx': {
        'calculation': (
            r'The titration gives $n(\text{ascorbic acid}) = n(I_{2}) = C_{I_{2}}V_{I_{2}}$; '
            r'multiply by $176.12\ \mathrm{g/mol}$ and the dilution factor to recover the '
            r'original sample amount.'
        ),
    },
    'content/physics/honours/capillary-rise-tension.mdx': {
        'theory': (
            r'For a clean circular capillary the vertical surface force $2\pi r\gamma\cos\theta$ '
            r'balances the weight of the liquid column $\pi r^{2}h\rho g$, so '
            r'$\gamma = \frac{\rho grh}{2\cos\theta}$ (a meniscus correction may be needed).'
        ),
        'theory_bn': (
            r'পরিষ্কার বৃত্তাকার নলে $2\pi r\gamma\cos\theta$ বল ও $\pi r^{2}h\rho g$ '
            r'তরলস্তম্ভের ওজন সমান, তাই $\gamma = \frac{\rho grh}{2\cos\theta}$ '
            r'(তরলতলের সংশোধন লাগতে পারে)।'
        ),
    },
    'content/physics/honours/franck-hertz-mercury.mdx': {
        'calculation': (
            r'Average several adjacent spacings $\Delta V$ and estimate $\Delta E = e\Delta V$ '
            r'(in eV the numerical value equals $\Delta V$ in V); report the scatter.'
        ),
    },
    'content/physics/honours/meldes-string-frequency.mdx': {
        'calculation': (
            r'Compute $\lambda = \frac{2L}{n}$ and the string wave speed '
            r'$v = f_{\text{string}}\lambda$, then compare $v^{2}$ with $\mathcal{T}/\mu$. '
            r'Use the correct vibrator-to-string frequency ratio.'
        ),
        'calculation_bn': (
            r'$\lambda = \frac{2L}{n}$ ও তারের বেগ $v = f_{\text{string}}\lambda$ বের করে '
            r'$v^{2}$-এর সঙ্গে $\mathcal{T}/\mu$ তুলনা করুন; কম্পক ও তারের কম্পাঙ্কের '
            r'সঠিক অনুপাত নিন।'
        ),
    },
    'content/physics/honours/newtons-rings-radius.mdx': {
        'calculation': (
            r'Fit $D_{m}^{2}$ against $m$; the slope is $4\lambda R$, so '
            r'$\lambda = \frac{\text{slope}}{4R}$. Note whether the central spot is perfectly dark.'
        ),
    },
    'content/physics/honours/photoelectric-planck-honours.mdx': {
        'calculation': (
            r'Fit $V_{s}$ against $f$ and calculate $h = e\times\text{slope}$. '
            r'Exclude below-threshold illumination from the linear fit.'
        ),
    },
    'content/physics/honours/polarimetry-sugar.mdx': {
        'calculation': (
            r'Fit $\alpha$ against $c$ at fixed $l$: the slope is $[\alpha]l$. To estimate an '
            r'unknown $c$ use $c = \frac{\alpha}{[\alpha]l}$ at the same wavelength and temperature.'
        ),
    },
    'content/physics/honours/stefan-boltzmann-verification-lab.mdx': {
        'calculation': (
            r'For a fit through the origin the slope $m = \frac{P_{\mathrm{rad}}}{T^{4}-T_{0}^{4}}$ '
            r'has units $\frac{\mathrm{W}}{\mathrm{K}^{4}}$, and $\sigma = \frac{m}{\epsilon A}$ '
            r'only if $\epsilon$ and $A$ are independently known. A nonzero intercept may indicate '
            r'background offsets.'
        ),
    },
    'content/physics/honours/wave-energy-string-lab.mdx': {
        'theory': (
            r'For a string fixed at both ends the fundamental has $\lambda = 2L$ and '
            r'$v = f\lambda = 2Lf$, hence $(2Lf)^{2} = \mathcal{T}/\mu$. Use '
            r'$\mathcal{T} \approx Mg$ only if pulley friction is negligible.'
        ),
        'calculation': (
            r'With $L = 0.50$ m and $f = 100$ Hz, $v = \frac{100\ \mathrm{m}}{\mathrm{s}}$; '
            r'if $\mu = 0.001\ \mathrm{kg/m}$, the predicted tension is $\mathcal{T} = 10$ N.'
        ),
        'calculation_bn': (
            r'$L = 0.50$ m ও $f = 100$ Hz-এ $v = \frac{100\ \mathrm{m}}{\mathrm{s}}$; '
            r'$\mu = 0.001\ \mathrm{kg/m}$ হলে প্রত্যাশিত টান $\mathcal{T} = 10$ N।'
        ),
    },
    'content/physics/class-11-12/venturi-bernoulli.mdx': {
        'calculation': (
            r'Find $v_{1}=\frac{Q}{A_{1}}$ and $v_{2}=\frac{Q}{A_{2}}$. For equal heights, '
            r'Bernoulli predicts $P_{2}-P_{1}=\frac{1}{2}\rho(v_{1}^{2}-v_{2}^{2})$. '
            r'Convert the manometer level difference to pressure with '
            r'$\Delta P=\rho_{\mathrm{water}}g\Delta h$ when the manometer fluid is water; '
            r'use the density of the actual fluid otherwise.'
        ),
        'calculation_bn': (
            r'$v_{1}=\frac{Q}{A_{1}}$ ও $v_{2}=\frac{Q}{A_{2}}$ বের করুন। উচ্চতা সমান হলে '
            r'বার্নৌলি সূত্রে $P_{2}-P_{1}=\frac{1}{2}\rho(v_{1}^{2}-v_{2}^{2})$। '
            r'পানিভরা ম্যানোমিটারে পাঠের পার্থক্য থেকে '
            r'$\Delta P=\rho_{\mathrm{water}}g\Delta h$; অন্য তরলে তার সঠিক ঘনত্ব বসান।'
        ),
    },
    'content/chemistry/class-11-12/acid-base-titration.mdx': {
        'aim_bn': r'প্রমাণ ক্ষারক দিয়ে অম্লকে প্রশমিত করে এবং নির্দেশকের প্রান্তবিন্দু নির্ণয় করে অম্লের ঘনমাত্রা নির্ধারণ করা।',
        'theory_bn': (
            r'তুল্যতা বিন্দুতে অম্ল ও ক্ষারক ঠিক স্টয়কিওমেট্রিক পরিমাণে বিক্রিয়া শেষ করে। '
            r'১:১ সবল অম্ল–সবল ক্ষারক বিক্রিয়ায় $c_{1}V_{1} = c_{2}V_{2}$; তীব্র pH লাফের '
            r'কাছেই নির্দেশক রং বদলায়।'
        ),
        'calculation': (
            r'For a 1:1 reaction, $c_{\mathrm{acid}} = c_{\mathrm{base}} \times '
            r'\frac{V_{\mathrm{base}}}{V_{\mathrm{acid}}}$. Use the mean concordant titre and '
            r'keep every volume in the same unit.'
        ),
        'calculation_bn': (
            r'১:১ বিক্রিয়ার জন্য $c_{\mathrm{acid}} = c_{\mathrm{base}} \times '
            r'\frac{V_{\mathrm{base}}}{V_{\mathrm{acid}}}$। সামঞ্জস্যপূর্ণ টাইট্রেশন পাঠের গড় নিন '
            r'এবং সব আয়তন একই এককে রাখুন।'
        ),
        'apparatus_bn': {
            0: r'বুরেট ও স্ট্যান্ড',
            1: r'ভলিউমেট্রিক পিপেট',
            2: r'কোনিক ফ্লাস্ক',
            3: r'প্রমাণ সোডিয়াম হাইড্রোক্সাইড দ্রবণ',
            4: r'অজানা ঘনমাত্রার হাইড্রোক্লোরিক অ্যাসিড',
            5: r'ফেনফথ্যালিন বা উপযুক্ত নির্দেশক',
        },
        'procedure_bn': {
            0: r'টাইট্র্যান্ট দিয়ে বুরেট ধুয়ে শূন্য দাগের ওপরে পর্যন্ত ভর্তি করুন।',
            1: r'পিপেট দিয়ে নির্দিষ্ট আয়তনের অম্ল ফ্লাস্কে নিন এবং দুই ফোঁটা নির্দেশক যোগ করুন।',
            2: r'শুরুতে ক্ষারক দ্রুত, আর রং বদলের কাছে ফোঁটায় ফোঁটায় যোগ করুন।',
            3: r'ফ্লাস্ক ক্রমাগত নাড়তে থাকুন এবং প্রথম স্থায়ী হালকা প্রান্তবিন্দুর রঙে থামুন।',
            4: r'সামঞ্জস্যপূর্ণ টাইট্রেশন পাঠ না পাওয়া পর্যন্ত পুনরাবৃত্তি করুন।',
        },
        'precautions_bn': {
            0: r'চোখের সমতলে থেকে মেনিস্কাসের পাঠ নিন।',
            1: r'নির্দেশক অল্পই ব্যবহার করুন।',
            2: r'প্রান্তবিন্দু পার করে ফেলবেন না; প্রয়োজনে পাতিত পানি দিয়ে ফ্লাস্কের গা ধুয়ে নিন।',
        },
        'sources_of_error_bn': {
            0: r'রঙের প্রান্তবিন্দু পার হয়ে যাওয়া',
            1: r'বুরেটের পাঠে প্যারালাক্স ত্রুটি',
            2: r'বুরেটের ককের নিচে বায়ুর বুদ্‌বুদ',
        },
    },
}

KEY_LINE = re.compile(r'^(?P<indent>\s*)(?P<key>[A-Za-z_][A-Za-z0-9_]*):\s*(?P<value>.*)$')
ITEM_LINE = re.compile(r'^(?P<indent>\s*)-\s+(?P<value>.*)$')


def apply_fixes(path: Path, fixes: dict, verbose: bool) -> int:
    text = path.read_text(encoding='utf8')
    frontmatter, body = split_mdx(text)
    lines = frontmatter.split('\n')
    current = None
    item_index = 0
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
            item_index = 0
            if current not in fixes:
                continue
            replacement = fixes[current]
            if isinstance(replacement, dict):
                continue
            value = parsed_value(match.group('value').strip())
            if value != replacement:
                lines[index] = f'{current}: {json.dumps(replacement, ensure_ascii=False)}'
                note(current, value if isinstance(value, str) else '', replacement)
            continue

        item = ITEM_LINE.match(line)
        if item and current in fixes and isinstance(fixes[current], dict):
            replacement = fixes[current].get(item_index)
            item_index += 1
            if replacement is None:
                continue
            value = parsed_value(item.group('value'))
            if value != replacement:
                lines[index] = f"{item.group('indent')}- {json.dumps(replacement, ensure_ascii=False)}"
                note(f'{current}[{item_index - 1}]', value if isinstance(value, str) else '', replacement)

    if changed:
        path.write_text(join_mdx('\n'.join(lines), body), encoding='utf8')
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report what would change and exit 1')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    total = files = 0
    for relative, fixes in FIXES.items():
        path = ROOT / relative
        if not path.exists():
            print(f'missing: {relative}')
            continue
        if args.check:
            frontmatter, _ = split_mdx(path.read_text(encoding='utf8'))
            data = yaml.safe_load(frontmatter) or {}
            touched = False
            for key, replacement in fixes.items():
                current = data.get(key)
                if isinstance(replacement, dict):
                    for position, wanted in replacement.items():
                        if isinstance(current, list) and len(current) > position and current[position] != wanted:
                            total += 1
                            touched = True
                            print(f'{relative} {key}[{position}]\n  - {current[position][:110]}\n  + {wanted[:110]}')
                elif current != replacement:
                    total += 1
                    touched = True
                    shown = current if isinstance(current, str) else ''
                    print(f'{relative} {key}\n  - {shown[:110]}\n  + {replacement[:110]}')
            if touched:
                files += 1
            continue
        count = apply_fixes(path, fixes, args.verbose)
        if count:
            files += 1
            total += count

    if args.check:
        print(f'{total} field(s) in {files} file(s) need repair.')
        return 1 if total else 0
    print(f'repaired {total} field(s) in {files} file(s).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
