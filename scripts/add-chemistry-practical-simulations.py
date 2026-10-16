#!/usr/bin/env python3
"""Add ten extra practicals (each with an interactive simulation) to the Chemistry Lab.

Every practical in ``data/experiments.json`` has an interactive simulation model in
``engine/chemPracticals``. This script adds ten more classic school/college practicals
— rates, water of crystallisation, molar volume, Faraday's law, a Daniell cell,
catalysis, a solubility curve, purification of rock salt and Le Chatelier's principle —
together with the chemicals and reaction rules the virtual bench needs so that each
one can also be worked through as a guided walkthrough with auto-checked steps.

The script is idempotent: chemicals, reactions and experiments whose ``id``/``slug``
already exist are left untouched, and the ``count`` fields are recomputed.

Run it from the repository root:

    python3 scripts/add-chemistry-practical-simulations.py
"""
from __future__ import annotations

import importlib.util
import json
import re
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

_spec = importlib.util.spec_from_file_location("lab_practicals", Path(__file__).with_name("add-chemistry-lab-practicals.py"))
_base = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_base)
vessel, step, quiz, experiment = _base.vessel, _base.step, _base.quiz, _base.experiment

# ── Chemicals ─────────────────────────────────────────────────────────────────


def chemical(**fields) -> dict:
    base = {"shelf": False, "hazard": "none", "opacity": 0.4, "soluble": True, "precipitate": False, "amphoteric": False}
    base.update(fields)
    return base


CHEMICALS = [
    chemical(shelf=True, hazard="irritant", opacity=0.35, id="Na2S2O3", formula="Na₂S₂O₃", name_en="Sodium thiosulfate", name_bn="সোডিয়াম থায়োসালফেট",
             category="salt", state="liquid", color="#f2f6f9", molarMass=158.11, concentrationM=0.15, acidity={"kind": "neutral"},
             notes_en="“Hypo”: turns cloudy with acid as sulfur forms; also titrates iodine.",
             notes_bn="“হাইপো”: অ্যাসিডে সালফার তৈরি হয়ে ঘোলা হয়; আয়োডিন টাইট্রেশনেও ব্যবহৃত।"),
    chemical(opacity=1, soluble=False, precipitate=True, id="S", formula="S", name_en="Sulfur", name_bn="সালফার",
             category="salt", state="solid", color="#f1e39a", molarMass=32.06, acidity={"kind": "neutral"},
             notes_en="Pale-yellow colloidal sulfur.", notes_bn="হালকা হলুদ কলয়েডীয় সালফার।"),
    chemical(shelf=True, hazard="oxidiser", opacity=0.3, id="H2O2", formula="H₂O₂", name_en="Hydrogen peroxide (3%)", name_bn="হাইড্রোজেন পারক্সাইড (৩%)",
             category="solvent", state="liquid", color="#eef6fb", molarMass=34.01, concentrationM=0.9, acidity={"kind": "neutral"},
             notes_en="Slowly decomposes to water and oxygen; manganese(IV) oxide speeds it up enormously.",
             notes_bn="ধীরে পানি ও অক্সিজেনে বিয়োজিত হয়; ম্যাঙ্গানিজ(IV) অক্সাইড একে বহুগুণ দ্রুত করে।"),
    chemical(shelf=True, hazard="irritant", opacity=1, id="CuSO4-5H2O", formula="CuSO₄·5H₂O", name_en="Copper(II) sulphate crystals", name_bn="কপার(II) সালফেট কেলাস (তুঁতে)",
             category="salt", state="solid", color="#2f6fd0", molarMass=249.69, acidity={"kind": "salt", "saltOf": {"acid": "H2SO4", "base": "Cu(OH)2"}},
             notes_en="Blue vitriol: blue crystals holding five molecules of water of crystallisation.",
             notes_bn="নীল তুঁতে: পাঁচ অণু কেলাস পানিযুক্ত নীল কেলাস।"),
    chemical(hazard="irritant", opacity=1, id="CuSO4-anh", formula="CuSO₄", name_en="Anhydrous copper(II) sulphate", name_bn="অনার্দ্র কপার(II) সালফেট",
             category="salt", state="solid", color="#f1f1ec", molarMass=159.61, acidity={"kind": "neutral"},
             notes_en="White powder that turns blue with water — a test for water.", notes_bn="সাদা গুঁড়া, পানিতে নীল হয় — পানির পরীক্ষা।"),
    chemical(shelf=True, hazard="irritant", opacity=0.35, id="KSCN", formula="KSCN", name_en="Potassium thiocyanate", name_bn="পটাশিয়াম থায়োসায়ানেট",
             category="salt", state="liquid", color="#f2f6f9", molarMass=97.18, concentrationM=0.1, acidity={"kind": "neutral"},
             notes_en="Gives a blood-red colour with Fe³⁺ ions.", notes_bn="Fe³⁺ আয়নের সাথে রক্ত-লাল রং দেয়।"),
    chemical(hazard="irritant", opacity=0.85, id="FeSCN", formula="[Fe(SCN)]Cl₂", name_en="Iron(III) thiocyanate complex", name_bn="আয়রন(III) থায়োসায়ানেট জটিল যৌগ",
             category="salt", state="liquid", color="#9b1414", molarMass=184.83, concentrationM=0.1, acidity={"kind": "neutral"},
             notes_en="The blood-red complex ion [Fe(SCN)]²⁺.", notes_bn="রক্ত-লাল জটিল আয়ন [Fe(SCN)]²⁺।"),
    chemical(shelf=True, opacity=1, soluble=False, precipitate=True, id="SiO2", formula="SiO₂", name_en="Sand (silica)", name_bn="বালি (সিলিকা)",
             category="salt", state="solid", color="#d8c08f", molarMass=60.08, acidity={"kind": "neutral"},
             notes_en="Insoluble in water — the impurity in rock salt.", notes_bn="পানিতে অদ্রবণীয় — খনিজ লবণের অপদ্রব্য।"),
]

# Existing chemicals that now go on the shelf.
SHELVE = {"MnO2": {}, "KNO3": {"concentrationM": 1.0}}

# ── Reactions ─────────────────────────────────────────────────────────────────


def reaction(rid, category, reactants, products, *, equation, equation_bn, observation_en, observation_bn, heat=False, min_temp=None,
             electrolysis=False, inert=False, hazard="none", priority=1, tags=None, hazard_en=None, hazard_bn=None, **effects) -> dict:
    fx = {"colorTo": None, "gas": None, "gasRate": 0, "precipitate": None, "smoke": None, "deltaT": 0, "flame": None, "glow": False, "sound": None, "dissolve": False}
    fx.update(effects)
    item = {
        "category": category,
        "reactants": [{"id": i, "coefficient": c} for i, c in reactants],
        "products": [{"id": i, "coefficient": c, "state": s} for i, c, s in products],
        "trigger": {"heat": heat, "minTempC": min_temp, "spark": False, "electrolysis": electrolysis, "light": False},
        "inert": inert,
        "effects": fx,
        "hazard": hazard,
        "priority": priority,
        "tags": tags or [],
        "id": rid,
        "equation": equation,
        "equation_bn": equation_bn,
        "observation_en": observation_en,
        "observation_bn": observation_bn,
    }
    if hazard_en:
        item["hazard_en"] = hazard_en
        item["hazard_bn"] = hazard_bn
    return item


REACTIONS = [
    reaction("na2s2o3-hcl", "redox", [("Na2S2O3", 1), ("HCl", 2)], [("NaCl", 2, "aq"), ("S", 1, "s"), ("SO2", 1, "g"), ("H2O", 1, "l")],
             equation="Na₂S₂O₃(aq) + 2HCl(aq) → 2NaCl(aq) + S(s)↓ + SO₂(g) + H₂O(l)",
             equation_bn="Na₂S₂O₃(দ্রব) + 2HCl(দ্রব) → 2NaCl(দ্রব) + S(কঠি)↓ + SO₂(গ্যা) + H₂O(ত)",
             observation_en="The clear solution slowly turns cloudy pale yellow as colloidal sulfur forms — the cross underneath disappears.",
             observation_bn="সালফার তৈরি হওয়ায় স্বচ্ছ দ্রবণ ধীরে ঘোলাটে হালকা হলুদ হয় — নিচের ক্রস অদৃশ্য হয়ে যায়।",
             hazard="caution", priority=2, tags=["rate"],
             hazard_en="Sulfur dioxide is a choking gas — work in a well-ventilated room.",
             hazard_bn="সালফার ডাই-অক্সাইড শ্বাসরোধী গ্যাস — বায়ুচলাচলযুক্ত ঘরে কাজ করো।",
             colorTo="#f1ead0", gas="SO2", gasRate=0.2, precipitate={"id": "S", "color": "#f1e39a", "density": 0.4}, deltaT=1),
    reaction("h2o2-mno2", "decomposition", [("H2O2", 2), ("MnO2", 1)], [("H2O", 2, "l"), ("O2", 1, "g"), ("MnO2", 1, "s")],
             equation="2H₂O₂(aq) →[MnO₂] 2H₂O(l) + O₂(g)↑",
             equation_bn="2H₂O₂(দ্রব) →[MnO₂] 2H₂O(ত) + O₂(গ্যা)↑",
             observation_en="Vigorous fizzing — oxygen pours off and the black manganese(IV) oxide is left unchanged: it is a catalyst.",
             observation_bn="তীব্র বুদবুদ — অক্সিজেন বের হয় এবং কালো ম্যাঙ্গানিজ(IV) অক্সাইড অপরিবর্তিত থাকে: এটি প্রভাবক।",
             hazard="caution", priority=2, tags=["catalysis"], gas="O2", gasRate=1, deltaT=8, sound="fizz"),
    reaction("cuso4-5h2o-heat", "decomposition", [("CuSO4-5H2O", 1)], [("CuSO4-anh", 1, "s")],
             equation="CuSO₄·5H₂O(s) →[Δ] CuSO₄(s) + 5H₂O(g)↑",
             equation_bn="CuSO₄·5H₂O(কঠি) →[তাপ] CuSO₄(কঠি) + 5H₂O(গ্যা)↑",
             observation_en="Steam is driven off and the blue crystals crumble to a white powder of anhydrous copper(II) sulphate.",
             observation_bn="বাষ্প বেরিয়ে যায় এবং নীল কেলাস ভেঙে অনার্দ্র কপার(II) সালফেটের সাদা গুঁড়া হয়।",
             heat=True, min_temp=110, tags=["water-of-crystallisation"], colorTo="#f1f1ec", smoke={"color": "#eef4f8", "density": 0.5}),
    reaction("cuso4-anh-h2o", "combination", [("CuSO4-anh", 1), ("H2O", 5)], [("CuSO4-5H2O", 1, "s")],
             equation="CuSO₄(s) + 5H₂O(l) → CuSO₄·5H₂O(s)",
             equation_bn="CuSO₄(কঠি) + 5H₂O(ত) → CuSO₄·5H₂O(কঠি)",
             observation_en="The white powder turns blue again and gets hot — the reaction is reversible, and this is a test for water.",
             observation_bn="সাদা গুঁড়া আবার নীল হয় ও গরম হয়ে ওঠে — বিক্রিয়াটি উভমুখী, আর এটিই পানির পরীক্ষা।",
             priority=2, tags=["water-of-crystallisation"], colorTo="#2f6fd0", deltaT=20, sound="hiss"),
    reaction("fecl3-kscn", "complex", [("FeCl3", 1), ("KSCN", 1)], [("FeSCN", 1, "aq"), ("KCl", 1, "aq")],
             equation="FeCl₃(aq) + KSCN(aq) ⇌ [Fe(SCN)]Cl₂(aq) + KCl(aq)",
             equation_bn="FeCl₃(দ্রব) + KSCN(দ্রব) ⇌ [Fe(SCN)]Cl₂(দ্রব) + KCl(দ্রব)",
             observation_en="A deep blood-red colour appears at once — the [Fe(SCN)]²⁺ complex ion.",
             observation_bn="সাথে সাথে গাঢ় রক্ত-লাল রং দেখা দেয় — [Fe(SCN)]²⁺ জটিল আয়ন।",
             tags=["equilibrium"], colorTo="#9b1414"),
    reaction("cuso4-electrolysis", "electrolysis", [("CuSO4", 2), ("H2O", 2)], [("Cu", 2, "s"), ("H2SO4", 2, "aq"), ("O2", 1, "g")],
             equation="2CuSO₄(aq) + 2H₂O(l) →[electricity] 2Cu(s) + 2H₂SO₄(aq) + O₂(g)↑",
             equation_bn="2CuSO₄(দ্রব) + 2H₂O(ত) →[বিদ্যুৎ] 2Cu(কঠি) + 2H₂SO₄(দ্রব) + O₂(গ্যা)↑",
             observation_en="Pink-brown copper plates the cathode, oxygen bubbles at the anode and the blue colour slowly fades.",
             observation_bn="ক্যাথোডে গোলাপি-বাদামি কপার জমে, অ্যানোডে অক্সিজেনের বুদবুদ ওঠে এবং নীল রং ধীরে ফিকে হয়।",
             electrolysis=True, priority=3, tags=["electrolysis", "faraday"],
             colorTo="#9cc3ea", gas="O2", gasRate=0.5, precipitate={"id": "Cu", "color": "#c8763c", "density": 0.6}, deltaT=2),
    reaction("kno3-dissolve-heat", "physical", [("KNO3", 1)], [],
             equation="KNO₃(s) ⇌ K⁺(aq) + NO₃⁻(aq) — solubility rises steeply with temperature",
             equation_bn="KNO₃(কঠি) ⇌ K⁺(দ্রব) + NO₃⁻(দ্রব) — তাপমাত্রার সাথে দ্রাব্যতা দ্রুত বাড়ে",
             observation_en="All the potassium nitrate dissolves in the hot water; as it cools, needle-shaped crystals reappear.",
             observation_bn="গরম পানিতে সব পটাশিয়াম নাইট্রেট দ্রবীভূত হয়; ঠান্ডা হলে সুচের মতো কেলাস আবার দেখা দেয়।",
             heat=True, min_temp=60, inert=True, tags=["solubility"]),
]

# ── Experiments ───────────────────────────────────────────────────────────────

EXPERIMENTS: list[dict] = []

EXPERIMENTS.append(experiment(
    order=0, slug="rate-thiosulfate-concentration", level="class-11-12", duration=15,
    apparatus=["conical-flask", "measuring-cylinder", "dropper"],
    chemicals=["Na2S2O3", "HCl", "H2O"],
    vessels=[
        vessel("conical-flask", "Concentrated thiosulfate", "ঘন থায়োসালফেট", [("Na2S2O3", 40), ("H2O", 10)]),
        vessel("conical-flask", "Dilute thiosulfate", "লঘু থায়োসালফেট", [("Na2S2O3", 10), ("H2O", 40)]),
    ],
    steps=[
        step(1, "Stand the first flask on a paper cross and add dilute hydrochloric acid: the thiosulfate reacts.", "প্রথম ফ্লাস্কটি কাগজে আঁকা ক্রসের উপর রেখে লঘু হাইড্রোক্লোরিক অ্যাসিড দাও: থায়োসালফেট বিক্রিয়া করে।",
             {"type": "reactionFired", "reactionId": "na2s2o3-hcl"}),
        step(2, "Pale-yellow sulfur clouds the flask until the cross can no longer be seen.", "হালকা হলুদ সালফার ফ্লাস্ক ঘোলা করে, শেষে ক্রস আর দেখা যায় না।",
             {"type": "contains", "vessel": 0, "chemicalId": "S"}),
        step(3, "The sulfur dioxide formed dissolves in the water as sulphurous acid.", "উৎপন্ন সালফার ডাই-অক্সাইড পানিতে দ্রবীভূত হয়ে সালফিউরাস অ্যাসিড হয়।",
             {"type": "contains", "vessel": 0, "chemicalId": "H2SO3"}),
        step(4, "Repeat with the more dilute thiosulfate in the second flask — it takes much longer to cloud.", "দ্বিতীয় ফ্লাস্কের লঘু থায়োসালফেট দিয়ে আবার করো — ঘোলা হতে অনেক বেশি সময় লাগে।",
             {"type": "contains", "vessel": 1, "chemicalId": "S"}),
    ],
    safety={"level": "caution",
            "en": "Sulfur dioxide is given off — keep the room ventilated and do not breathe over the flask.",
            "bn": "সালফার ডাই-অক্সাইড বের হয় — ঘর বায়ুচলাচলযুক্ত রাখো এবং ফ্লাস্কের উপর শ্বাস নিয়ো না।"},
    expected=["na2s2o3-hcl"],
    quizzes=[quiz(
        "Halving the thiosulfate concentration roughly…",
        "থায়োসালফেটের ঘনমাত্রা অর্ধেক করলে প্রায়…",
        ["Halves the time", "Doubles the time for the cross to vanish", "Has no effect", "Stops the reaction"],
        ["সময় অর্ধেক হয়", "ক্রস অদৃশ্য হতে দ্বিগুণ সময় লাগে", "কোনো প্রভাব নেই", "বিক্রিয়া থেমে যায়"],
        1,
        "The rate is proportional to [S₂O₃²⁻] (first order), so half the concentration takes twice as long to make the same amount of sulfur.",
        "হার [S₂O₃²⁻]-এর সমানুপাতিক (প্রথম ক্রম), তাই অর্ধেক ঘনমাত্রায় একই পরিমাণ সালফার তৈরি হতে দ্বিগুণ সময় লাগে।"),
        quiz(
            "Why is 1/t used as a measure of rate?",
            "হারের পরিমাপ হিসেবে 1/t কেন ব্যবহার করা হয়?",
            ["t is always 1", "The same amount of sulfur forms each time, so rate ∝ 1/t", "It makes the numbers bigger", "Because the acid is in excess"],
            ["t সবসময় 1", "প্রতিবার একই পরিমাণ সালফার তৈরি হয়, তাই হার ∝ 1/t", "সংখ্যা বড় করতে", "কারণ অ্যাসিড বেশি"],
            1,
            "The cross vanishes when a fixed amount of sulfur has formed, so a faster reaction means a shorter time: rate ∝ 1/t.",
            "নির্দিষ্ট পরিমাণ সালফার তৈরি হলেই ক্রস অদৃশ্য হয়, তাই দ্রুত বিক্রিয়া মানে কম সময়: হার ∝ 1/t।"),
    ],
    tags=["rate", "kinetics", "simulation"],
    title_en="Rate of reaction: concentration and the disappearing cross",
    title_bn="বিক্রিয়ার হার: ঘনমাত্রা ও অদৃশ্য ক্রস",
    aim_en="Time how long sodium thiosulfate and hydrochloric acid take to hide a paper cross at different concentrations, and find the order of reaction.",
    aim_bn="বিভিন্ন ঘনমাত্রায় সোডিয়াম থায়োসালফেট ও হাইড্রোক্লোরিক অ্যাসিড কাগজের ক্রস ঢাকতে কত সময় নেয় তা মেপে বিক্রিয়ার ক্রম নির্ণয় করা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="rate-thiosulfate-temperature", level="class-11-12", duration=18,
    apparatus=["conical-flask", "bunsen-burner", "thermometer", "dropper"],
    chemicals=["Na2S2O3", "HCl", "H2O"],
    vessels=[vessel("conical-flask", "Thiosulfate to warm", "গরম করার থায়োসালফেট", [("Na2S2O3", 10), ("H2O", 40)])],
    steps=[
        step(1, "Warm the thiosulfate solution gently.", "থায়োসালফেট দ্রবণটি মৃদু গরম করো।", {"type": "heating", "vessel": 0}),
        step(2, "Let it reach at least 40 °C.", "অন্তত ৪০ °C পর্যন্ত গরম হতে দাও।", {"type": "temperature", "vessel": 0, "min": 40}),
        step(3, "Add the hydrochloric acid and start timing.", "হাইড্রোক্লোরিক অ্যাসিড দিয়ে সময় মাপা শুরু করো।", {"type": "reactionFired", "reactionId": "na2s2o3-hcl"}),
        step(4, "Sulfur clouds the warm flask far faster than it did at room temperature.", "কক্ষ তাপমাত্রার চেয়ে অনেক দ্রুত সালফার গরম ফ্লাস্কটি ঘোলা করে।", {"type": "contains", "vessel": 0, "chemicalId": "S"}),
    ],
    safety={"level": "caution",
            "en": "Warm gently (below 60 °C) — hot acid mixtures release more sulfur dioxide.",
            "bn": "মৃদু গরম করো (৬০ °C-এর নিচে) — গরম অ্যাসিড মিশ্রণ থেকে বেশি সালফার ডাই-অক্সাইড বের হয়।"},
    expected=["na2s2o3-hcl"],
    quizzes=[quiz(
        "A 10 °C rise in temperature roughly…",
        "তাপমাত্রা ১০ °C বাড়লে প্রায়…",
        ["Halves the rate", "Doubles the rate", "Leaves the rate unchanged", "Changes the products"],
        ["হার অর্ধেক হয়", "হার দ্বিগুণ হয়", "হার একই থাকে", "উৎপাদ বদলে যায়"],
        1,
        "Many more collisions have energy above the activation energy, so the rate roughly doubles for every 10 °C near room temperature.",
        "অনেক বেশি সংঘর্ষের শক্তি সক্রিয়ন শক্তির চেয়ে বেশি হয়, তাই কক্ষ তাপমাত্রার কাছে প্রতি ১০ °C-এ হার প্রায় দ্বিগুণ হয়।"),
        quiz(
            "In an Arrhenius plot of ln(1/t) against 1/T the slope equals…",
            "ln(1/t) বনাম 1/T আরহেনিয়াস লেখের ঢাল সমান…",
            ["+Ea/R", "−Ea/R", "R/Ea", "ln A"],
            ["+Ea/R", "−Ea/R", "R/Ea", "ln A"],
            1,
            "ln k = ln A − Ea/(RT), and 1/t is proportional to k, so the slope is −Ea/R.",
            "ln k = ln A − Ea/(RT), আর 1/t, k-এর সমানুপাতিক, তাই ঢাল −Ea/R।"),
    ],
    tags=["rate", "kinetics", "activation-energy", "simulation"],
    title_en="Rate of reaction: temperature and activation energy",
    title_bn="বিক্রিয়ার হার: তাপমাত্রা ও সক্রিয়ন শক্তি",
    aim_en="Repeat the disappearing-cross reaction at 20–60 °C and use an Arrhenius plot to find the activation energy.",
    aim_bn="২০–৬০ °C তাপমাত্রায় অদৃশ্য ক্রস বিক্রিয়াটি করে আরহেনিয়াস লেখ থেকে সক্রিয়ন শক্তি নির্ণয় করা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="water-of-crystallisation", level="class-9-10", duration=15,
    apparatus=["evaporating-dish", "bunsen-burner", "tripod-stand", "dropper"],
    chemicals=["CuSO4-5H2O", "H2O"],
    vessels=[vessel("evaporating-dish", "Blue copper sulphate crystals", "নীল কপার সালফেট কেলাস", [("CuSO4-5H2O", 2.5)])],
    steps=[
        step(1, "Heat the blue crystals gently.", "নীল কেলাসগুলো মৃদু উত্তপ্ত করো।", {"type": "heating", "vessel": 0}),
        step(2, "Let the dish pass 110 °C.", "পাত্রটির তাপমাত্রা ১১০ °C ছাড়াতে দাও।", {"type": "temperature", "vessel": 0, "min": 110}),
        step(3, "Steam is driven off and the crystals crumble.", "বাষ্প বেরিয়ে যায় এবং কেলাস ভেঙে যায়।", {"type": "reactionFired", "reactionId": "cuso4-5h2o-heat"}),
        step(4, "A white powder of anhydrous copper(II) sulphate is left.", "অনার্দ্র কপার(II) সালফেটের সাদা গুঁড়া থেকে যায়।", {"type": "contains", "vessel": 0, "chemicalId": "CuSO4-anh"}),
        step(5, "When it has cooled, add a few drops of water.", "ঠান্ডা হলে কয়েক ফোঁটা পানি দাও।", {"type": "reactionFired", "reactionId": "cuso4-anh-h2o"}),
        step(6, "It turns blue again and gets hot: the blue hydrate is back.", "আবার নীল হয় ও গরম হয়: নীল সোদক লবণ ফিরে আসে।", {"type": "contains", "vessel": 0, "chemicalId": "CuSO4-5H2O"}),
    ],
    safety={"level": "caution",
            "en": "Hot porcelain stays hot for a long time — use tongs, and let the dish cool before adding water (it can spit).",
            "bn": "গরম চীনামাটি অনেকক্ষণ গরম থাকে — চিমটা ব্যবহার করো এবং পানি দেওয়ার আগে পাত্র ঠান্ডা হতে দাও (ছিটকে যেতে পারে)।"},
    expected=["cuso4-5h2o-heat", "cuso4-anh-h2o"],
    quizzes=[quiz(
        "2.50 g of blue crystals leave 1.60 g of white powder. How many waters of crystallisation (x)?",
        "২.৫০ g নীল কেলাস উত্তপ্ত করলে ১.৬০ g সাদা গুঁড়া থাকে। কেলাস পানির সংখ্যা (x) কত?",
        ["1", "3", "5", "7"], ["১", "৩", "৫", "৭"],
        2,
        "Water lost = 0.90 g = 0.050 mol; CuSO₄ = 1.60 g = 0.0100 mol; x = 0.050 ÷ 0.0100 = 5.",
        "হারানো পানি = ০.৯০ g = ০.০৫০ mol; CuSO₄ = ১.৬০ g = ০.০১০০ mol; x = ০.০৫০ ÷ ০.০১০০ = ৫।"),
        quiz(
            "Why must the crystals be heated to constant mass?",
            "কেলাসগুলো কেন স্থির ভর পর্যন্ত উত্তপ্ত করতে হয়?",
            ["To melt the dish", "To be sure all the water has gone", "To make the powder blue", "To add oxygen"],
            ["পাত্র গলাতে", "সব পানি বেরিয়ে গেছে তা নিশ্চিত হতে", "গুঁড়া নীল করতে", "অক্সিজেন যোগ করতে"],
            1,
            "If the mass is still falling, some water is left and x comes out too small.",
            "ভর তখনও কমতে থাকলে কিছু পানি রয়ে গেছে, ফলে x কম আসবে।"),
    ],
    tags=["water-of-crystallisation", "heating", "stoichiometry", "simulation"],
    title_en="Water of crystallisation in blue vitriol",
    title_bn="তুঁতের কেলাস পানি নির্ণয়",
    aim_en="Heat hydrated copper(II) sulphate to constant mass, find x in CuSO₄·xH₂O, and reverse the change with water.",
    aim_bn="সোদক কপার(II) সালফেট স্থির ভর পর্যন্ত উত্তপ্ত করে CuSO₄·xH₂O-তে x নির্ণয় করা এবং পানি দিয়ে পরিবর্তনটি উল্টে দেখা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="molar-volume-hydrogen", level="class-11-12", duration=15,
    apparatus=["conical-flask", "gas-jar", "delivery-tube", "spatula"],
    chemicals=["Mg", "HCl"],
    vessels=[
        vessel("conical-flask", "Acid flask", "অ্যাসিড ফ্লাস্ক", [("HCl", 30)]),
        vessel("gas-jar", "Gas syringe / jar", "গ্যাস সিরিঞ্জ / জার", []),
    ],
    steps=[
        step(1, "Drop a weighed strip of magnesium ribbon into the excess acid: it fizzes away.", "ওজন করা ম্যাগনেসিয়াম ফিতার টুকরো অতিরিক্ত অ্যাসিডে ফেলো: বুদবুদ তুলে শেষ হয়ে যায়।",
             {"type": "reactionFired", "reactionId": "mg-hcl"}),
        step(2, "All the magnesium has gone into solution as magnesium chloride.", "সব ম্যাগনেসিয়াম ম্যাগনেসিয়াম ক্লোরাইড হয়ে দ্রবণে চলে গেছে।", {"type": "contains", "vessel": 0, "chemicalId": "MgCl2"}),
        step(3, "Hydrogen fills the flask's headspace.", "ফ্লাস্কের ফাঁকা অংশ হাইড্রোজেনে ভরে যায়।", {"type": "contains", "vessel": 0, "chemicalId": "H2"}),
        step(4, "Collect the gas and measure its volume.", "গ্যাস সংগ্রহ করে এর আয়তন মাপো।", {"type": "contains", "vessel": 1, "chemicalId": "H2"}),
        step(5, "Confirm it is hydrogen with a lighted splint.", "জ্বলন্ত কাঠি দিয়ে নিশ্চিত হও যে এটি হাইড্রোজেন।", {"type": "spark", "vessel": 1}),
    ],
    safety={"level": "caution",
            "en": "Hydrogen is flammable — keep flames away until the test, and test only a small sample.",
            "bn": "হাইড্রোজেন দাহ্য — পরীক্ষার আগে শিখা দূরে রাখো এবং কেবল অল্প নমুনা পরীক্ষা করো।"},
    expected=["mg-hcl"],
    quizzes=[quiz(
        "0.048 g of Mg (Ar 24) gives 48 mL of H₂. The molar volume is…",
        "০.০৪৮ g Mg (Ar ২৪) থেকে ৪৮ mL H₂ পাওয়া যায়। মোলার আয়তন…",
        ["12 L mol⁻¹", "24 L mol⁻¹", "48 L mol⁻¹", "22.4 L mol⁻¹ always"],
        ["১২ L mol⁻¹", "২৪ L mol⁻¹", "৪৮ L mol⁻¹", "সবসময় ২২.৪ L mol⁻¹"],
        1,
        "n(Mg) = n(H₂) = 0.002 mol; 48 mL ÷ 0.002 mol = 24 000 mL = 24 L mol⁻¹ at room temperature and pressure.",
        "n(Mg) = n(H₂) = ০.০০২ mol; ৪৮ mL ÷ ০.০০২ mol = ২৪ ০০০ mL = কক্ষ তাপমাত্রা ও চাপে ২৪ L mol⁻¹।"),
        quiz(
            "Why must the acid be in excess?",
            "অ্যাসিড কেন অতিরিক্ত নিতে হয়?",
            ["So all the magnesium reacts", "To make more acid", "To cool the flask", "So less gas forms"],
            ["যাতে সব ম্যাগনেসিয়াম বিক্রিয়া করে", "আরও অ্যাসিড তৈরি করতে", "ফ্লাস্ক ঠান্ডা করতে", "যাতে কম গ্যাস হয়"],
            0,
            "The volume of hydrogen must depend only on the mass of magnesium, so every bit of it has to react.",
            "হাইড্রোজেনের আয়তন কেবল ম্যাগনেসিয়ামের ভরের উপর নির্ভর করতে হবে, তাই এর সবটুকু বিক্রিয়া করা চাই।"),
    ],
    tags=["mole-concept", "gases", "simulation"],
    title_en="Molar volume of hydrogen",
    title_bn="হাইড্রোজেনের মোলার আয়তন",
    aim_en="React weighed magnesium with excess acid, collect the hydrogen in a gas syringe and find the volume of one mole of gas.",
    aim_bn="ওজন করা ম্যাগনেসিয়াম অতিরিক্ত অ্যাসিডের সাথে বিক্রিয়া করিয়ে হাইড্রোজেন গ্যাস সিরিঞ্জে সংগ্রহ করা এবং এক মোল গ্যাসের আয়তন নির্ণয় করা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="copper-electrolysis-faraday", level="class-11-12", duration=20,
    apparatus=["beaker", "electrolysis-cell"],
    chemicals=["CuSO4", "H2O"],
    vessels=[vessel("beaker", "Copper(II) sulphate cell", "কপার(II) সালফেট কোষ", [("CuSO4", 40), ("H2O", 20)])],
    steps=[
        step(1, "Connect the cell and pass a steady current.", "কোষটি যুক্ত করে স্থির তড়িৎপ্রবাহ চালাও।", {"type": "electrolysis", "vessel": 0}),
        step(2, "Copper(II) sulphate is electrolysed.", "কপার(II) সালফেট তড়িৎবিশ্লেষিত হয়।", {"type": "reactionFired", "reactionId": "cuso4-electrolysis"}),
        step(3, "Pink-brown copper is deposited on the cathode.", "ক্যাথোডে গোলাপি-বাদামি কপার জমে।", {"type": "contains", "vessel": 0, "chemicalId": "Cu"}),
        step(4, "Sulphuric acid builds up in the solution (with an inert anode).", "দ্রবণে সালফিউরিক অ্যাসিড জমে (নিষ্ক্রিয় অ্যানোডে)।", {"type": "contains", "vessel": 0, "chemicalId": "H2SO4"}),
    ],
    safety={"level": "caution",
            "en": "Copper(II) sulphate is harmful if swallowed; use a low-voltage supply and switch off before touching the electrodes.",
            "bn": "কপার(II) সালফেট গিললে ক্ষতিকর; কম ভোল্টেজের সরবরাহ ব্যবহার করো এবং তড়িৎদ্বার ছোঁয়ার আগে বন্ধ করো।"},
    expected=["cuso4-electrolysis"],
    quizzes=[quiz(
        "How much copper is deposited by 0.50 A for 30 minutes (F = 96 500 C mol⁻¹)?",
        "০.৫০ A প্রবাহ ৩০ মিনিট চালালে কত কপার জমে (F = ৯৬ ৫০০ C mol⁻¹)?",
        ["0.15 g", "0.30 g", "0.59 g", "1.19 g"], ["০.১৫ g", "০.৩০ g", "০.৫৯ g", "১.১৯ g"],
        1,
        "Q = 0.50 × 1800 = 900 C; n(e⁻) = 900 ÷ 96 500 = 0.00933 mol; n(Cu) = 0.00466 mol; m = 0.00466 × 63.5 = 0.30 g.",
        "Q = ০.৫০ × ১৮০০ = ৯০০ C; n(e⁻) = ৯০০ ÷ ৯৬ ৫০০ = ০.০০৯৩৩ mol; n(Cu) = ০.০০৪৬৬ mol; m = ০.০০৪৬৬ × ৬৩.৫ = ০.৩০ g।"),
        quiz(
            "With copper electrodes the blue colour of the solution…",
            "কপার তড়িৎদ্বার ব্যবহার করলে দ্রবণের নীল রং…",
            ["Fades quickly", "Stays the same", "Turns green", "Turns colourless at once"],
            ["দ্রুত ফিকে হয়", "একই থাকে", "সবুজ হয়", "সাথে সাথে বর্ণহীন হয়"],
            1,
            "The copper anode dissolves as fast as copper is deposited on the cathode, so [Cu²⁺] does not change.",
            "ক্যাথোডে যত দ্রুত কপার জমে, কপার অ্যানোড তত দ্রুত দ্রবীভূত হয়, তাই [Cu²⁺] বদলায় না।"),
    ],
    tags=["electrolysis", "faraday", "simulation"],
    title_en="Electrolysis of copper(II) sulphate: Faraday’s first law",
    title_bn="কপার(II) সালফেটের তড়িৎবিশ্লেষণ: ফ্যারাডের প্রথম সূত্র",
    aim_en="Weigh the copper deposited on the cathode for different charges passed and find the Faraday constant.",
    aim_bn="বিভিন্ন পরিমাণ আধান প্রবাহিত করে ক্যাথোডে জমা কপারের ভর মেপে ফ্যারাডে ধ্রুবক নির্ণয় করা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="solubility-curve-kno3", level="class-9-10", duration=20,
    apparatus=["test-tube", "beaker", "bunsen-burner", "thermometer"],
    chemicals=["KNO3", "H2O"],
    vessels=[vessel("test-tube", "KNO₃ in water", "পানিতে KNO₃", [("KNO3", 5), ("H2O", 5)])],
    steps=[
        step(1, "Warm the tube in a water bath.", "নলটি পানির গামলায় গরম করো।", {"type": "heating", "vessel": 0}),
        step(2, "Heat above 60 °C, stirring with the thermometer.", "থার্মোমিটার দিয়ে নাড়তে নাড়তে ৬০ °C-এর উপরে গরম করো।", {"type": "temperature", "vessel": 0, "min": 60}),
        step(3, "All the potassium nitrate dissolves.", "সব পটাশিয়াম নাইট্রেট দ্রবীভূত হয়।", {"type": "reactionFired", "reactionId": "kno3-dissolve-heat"}),
        step(4, "Let it cool and note the temperature at which crystals first appear.", "ঠান্ডা হতে দাও এবং যে তাপমাত্রায় প্রথম কেলাস দেখা দেয় তা লেখো।", {"type": "contains", "vessel": 0, "chemicalId": "KNO3"}),
    ],
    safety={"level": "caution",
            "en": "Potassium nitrate is an oxidiser — keep it away from flames and fuels; heat in a water bath, not directly.",
            "bn": "পটাশিয়াম নাইট্রেট জারক — শিখা ও জ্বালানি থেকে দূরে রাখো; সরাসরি নয়, পানির গামলায় গরম করো।"},
    expected=["kno3-dissolve-heat"],
    quizzes=[quiz(
        "6.0 g of KNO₃ in 10 g of water starts to crystallise at 38 °C. The solubility at 38 °C is…",
        "১০ g পানিতে ৬.০ g KNO₃ ৩৮ °C-এ কেলাসিত হতে শুরু করে। ৩৮ °C-এ দ্রাব্যতা…",
        ["6 g per 100 g water", "38 g per 100 g water", "60 g per 100 g water", "600 g per 100 g water"],
        ["প্রতি ১০০ g পানিতে ৬ g", "প্রতি ১০০ g পানিতে ৩৮ g", "প্রতি ১০০ g পানিতে ৬০ g", "প্রতি ১০০ g পানিতে ৬০০ g"],
        2,
        "Solubility is quoted per 100 g of water: 6.0 g × (100 ÷ 10) = 60 g.",
        "দ্রাব্যতা প্রতি ১০০ g পানির হিসাবে বলা হয়: ৬.০ g × (১০০ ÷ ১০) = ৬০ g।"),
        quiz(
            "Why does KNO₃ crystallise when its hot solution cools?",
            "গরম দ্রবণ ঠান্ডা হলে KNO₃ কেলাসিত হয় কেন?",
            ["It decomposes", "Its solubility falls with temperature", "Water evaporates instantly", "It reacts with air"],
            ["এটি বিয়োজিত হয়", "তাপমাত্রা কমলে এর দ্রাব্যতা কমে", "পানি সাথে সাথে বাষ্পীভূত হয়", "এটি বায়ুর সাথে বিক্রিয়া করে"],
            1,
            "Less KNO₃ can stay dissolved at the lower temperature, so the excess comes out of solution as crystals.",
            "কম তাপমাত্রায় কম KNO₃ দ্রবীভূত থাকতে পারে, তাই বাড়তিটুকু কেলাস হিসেবে বেরিয়ে আসে।"),
    ],
    tags=["solubility", "crystallisation", "simulation"],
    title_en="Solubility curve of potassium nitrate",
    title_bn="পটাশিয়াম নাইট্রেটের দ্রাব্যতা লেখ",
    aim_en="Find the temperature at which different masses of KNO₃ in 10 g of water start to crystallise and draw its solubility curve.",
    aim_bn="১০ g পানিতে বিভিন্ন ভরের KNO₃ কোন তাপমাত্রায় কেলাসিত হতে শুরু করে তা নির্ণয় করে দ্রাব্যতা লেখ আঁকা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="electrochemical-cell", level="class-11-12", duration=15,
    apparatus=["beaker", "test-tube", "spatula"],
    chemicals=["ZnSO4", "CuSO4", "Zn", "Cu"],
    vessels=[
        vessel("beaker", "Zinc half-cell (ZnSO₄)", "জিঙ্ক অর্ধকোষ (ZnSO₄)", [("ZnSO4", 40)]),
        vessel("beaker", "Copper half-cell (CuSO₄)", "কপার অর্ধকোষ (CuSO₄)", [("CuSO4", 40)]),
        vessel("test-tube", "Zinc straight into CuSO₄", "সরাসরি CuSO₄-এ জিঙ্ক", [("CuSO4", 5)]),
    ],
    steps=[
        step(1, "Dip a zinc strip into the zinc sulphate solution.", "জিঙ্ক সালফেট দ্রবণে একটি জিঙ্ক পাত ডুবাও।", {"type": "contains", "vessel": 0, "chemicalId": "Zn"}),
        step(2, "Dip a copper strip into the copper(II) sulphate solution and join the beakers with a salt bridge.", "কপার(II) সালফেট দ্রবণে একটি কপার পাত ডুবাও এবং লবণ সেতু দিয়ে বিকার দুটি যুক্ত করো।",
             {"type": "contains", "vessel": 1, "chemicalId": "Cu"}),
        step(3, "Now drop zinc straight into copper(II) sulphate: the same reaction, but the energy is wasted as heat.", "এবার জিঙ্ক সরাসরি কপার(II) সালফেটে দাও: একই বিক্রিয়া, কিন্তু শক্তি তাপ হিসেবে নষ্ট হয়।",
             {"type": "reactionFired", "reactionId": "zn-cuso4"}),
        step(4, "Copper is displaced — in the cell the electrons travel through the wire instead.", "কপার প্রতিস্থাপিত হয় — কোষে ইলেকট্রনগুলো বরং তারের মধ্য দিয়ে যায়।", {"type": "contains", "vessel": 2, "chemicalId": "Cu"}),
    ],
    safety={"level": "caution",
            "en": "Copper(II) and zinc salts are harmful if swallowed — wash your hands after handling the electrodes.",
            "bn": "কপার(II) ও জিঙ্ক লবণ গিললে ক্ষতিকর — তড়িৎদ্বার ধরার পর হাত ধুয়ে নাও।"},
    expected=["zn-cuso4"],
    quizzes=[quiz(
        "The standard EMF of the Daniell cell (E°Cu = +0.34 V, E°Zn = −0.76 V) is…",
        "ড্যানিয়েল কোষের প্রমাণ EMF (E°Cu = +০.৩৪ V, E°Zn = −০.৭৬ V)…",
        ["0.42 V", "1.10 V", "−1.10 V", "0.34 V"], ["০.৪২ V", "১.১০ V", "−১.১০ V", "০.৩৪ V"],
        1,
        "E°cell = E°(cathode) − E°(anode) = 0.34 − (−0.76) = 1.10 V.",
        "E°cell = E°(ক্যাথোড) − E°(অ্যানোড) = ০.৩৪ − (−০.৭৬) = ১.১০ V।"),
        quiz(
            "What does the salt bridge do?",
            "লবণ সেতুর কাজ কী?",
            ["Supplies electrons", "Completes the circuit by letting ions flow", "Heats the solutions", "Stops the reaction"],
            ["ইলেকট্রন সরবরাহ করে", "আয়ন চলাচলের মাধ্যমে বর্তনী সম্পূর্ণ করে", "দ্রবণ গরম করে", "বিক্রিয়া থামায়"],
            1,
            "Ions move through the bridge to keep both solutions electrically neutral; without it no current flows.",
            "দুই দ্রবণকে তড়িৎ-নিরপেক্ষ রাখতে আয়ন সেতুর মধ্য দিয়ে চলে; এটি ছাড়া প্রবাহ চলে না।"),
    ],
    tags=["electrochemistry", "cells", "simulation"],
    title_en="Daniell cell and the electrochemical series",
    title_bn="ড্যানিয়েল কোষ ও তড়িৎরাসায়নিক সারি",
    aim_en="Build zinc–copper and other cells with a salt bridge, measure their EMF and see how concentration changes it.",
    aim_bn="লবণ সেতু দিয়ে জিঙ্ক–কপার ও অন্যান্য কোষ তৈরি করে এদের EMF মাপা এবং ঘনমাত্রায় তা কীভাবে বদলায় দেখা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="catalytic-decomposition-h2o2", level="class-9-10", duration=12,
    apparatus=["conical-flask", "test-tube", "delivery-tube", "spatula", "bunsen-burner"],
    chemicals=["H2O2", "MnO2"],
    vessels=[
        vessel("conical-flask", "Hydrogen peroxide", "হাইড্রোজেন পারক্সাইড", [("H2O2", 20)]),
        vessel("test-tube", "Collecting tube", "সংগ্রাহক নল", []),
    ],
    steps=[
        step(1, "Tip a spatula of black manganese(IV) oxide into the peroxide.", "পারক্সাইডে এক চামচ কালো ম্যাঙ্গানিজ(IV) অক্সাইড দাও।", {"type": "contains", "vessel": 0, "chemicalId": "MnO2"}),
        step(2, "The peroxide decomposes rapidly.", "পারক্সাইড দ্রুত বিয়োজিত হয়।", {"type": "reactionFired", "reactionId": "h2o2-mno2"}),
        step(3, "Oxygen fizzes off.", "অক্সিজেন বুদবুদ তুলে বের হয়।", {"type": "contains", "vessel": 0, "chemicalId": "O2"}),
        step(4, "Collect the oxygen in a test tube.", "অক্সিজেন একটি টেস্টটিউবে সংগ্রহ করো।", {"type": "contains", "vessel": 1, "chemicalId": "O2"}),
        step(5, "Hold a glowing splint in the tube…", "নলে একটি ধূমায়িত কাঠি ধরো…", {"type": "heating", "vessel": 1}),
        step(6, "…it relights: the gas is oxygen.", "…এটি আবার জ্বলে ওঠে: গ্যাসটি অক্সিজেন।", {"type": "reactionFired", "reactionId": "o2-glowing-splint"}),
        step(7, "The manganese(IV) oxide is still there — a catalyst is not used up.", "ম্যাঙ্গানিজ(IV) অক্সাইড তখনও আছে — প্রভাবক খরচ হয় না।", {"type": "contains", "vessel": 0, "chemicalId": "MnO2"}),
    ],
    safety={"level": "caution",
            "en": "Hydrogen peroxide irritates skin and eyes; the reaction is exothermic and froths — use dilute (3%) peroxide only.",
            "bn": "হাইড্রোজেন পারক্সাইড ত্বক ও চোখে জ্বালা করে; বিক্রিয়াটি তাপোৎপাদী ও ফেনা তোলে — কেবল লঘু (৩%) পারক্সাইড ব্যবহার করো।"},
    expected=["h2o2-mno2", "o2-glowing-splint"],
    quizzes=[quiz(
        "After the reaction the MnO₂ is filtered, dried and weighed. Its mass is…",
        "বিক্রিয়ার পর MnO₂ ছেঁকে, শুকিয়ে ওজন করা হলো। এর ভর…",
        ["Zero", "The same as before", "Doubled", "Halved"], ["শূন্য", "আগের সমান", "দ্বিগুণ", "অর্ধেক"],
        1,
        "A catalyst speeds up a reaction without being used up, so the same mass is recovered.",
        "প্রভাবক নিজে খরচ না হয়ে বিক্রিয়া দ্রুত করে, তাই একই ভর ফিরে পাওয়া যায়।"),
        quiz(
            "10.0 mL of H₂O₂ gives 60 mL of O₂ (24 L mol⁻¹). Its concentration is…",
            "১০.০ mL H₂O₂ থেকে ৬০ mL O₂ পাওয়া যায় (২৪ L mol⁻¹)। এর ঘনমাত্রা…",
            ["0.25 M", "0.50 M", "1.0 M", "2.5 M"], ["০.২৫ M", "০.৫০ M", "১.০ M", "২.৫ M"],
            1,
            "n(O₂) = 0.060 ÷ 24 = 0.0025 mol; n(H₂O₂) = 2 × 0.0025 = 0.005 mol in 0.010 L → 0.50 M.",
            "n(O₂) = ০.০৬০ ÷ ২৪ = ০.০০২৫ mol; n(H₂O₂) = ২ × ০.০০২৫ = ০.০০৫ mol, ০.০১০ L-এ → ০.৫০ M।"),
    ],
    tags=["catalysis", "gases", "simulation"],
    title_en="Catalytic decomposition of hydrogen peroxide",
    title_bn="হাইড্রোজেন পারক্সাইডের প্রভাবকীয় বিয়োজন",
    aim_en="Use manganese(IV) oxide to decompose hydrogen peroxide, follow the oxygen volume with time and show the catalyst is unchanged.",
    aim_bn="ম্যাঙ্গানিজ(IV) অক্সাইড দিয়ে হাইড্রোজেন পারক্সাইড বিয়োজিত করে সময়ের সাথে অক্সিজেনের আয়তন অনুসরণ করা এবং প্রভাবক অপরিবর্তিত থাকে দেখানো।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="rock-salt-purification", level="class-6-8", duration=20,
    apparatus=["beaker", "evaporating-dish", "bunsen-burner", "tripod-stand"],
    chemicals=["NaCl", "SiO2", "H2O"],
    vessels=[
        vessel("beaker", "Crushed rock salt", "গুঁড়া খনিজ লবণ", [("NaCl", 30), ("SiO2", 3)]),
        vessel("evaporating-dish", "Filtrate", "পরিস্রুত", [("NaCl", 10), ("H2O", 10)]),
    ],
    steps=[
        step(1, "Add water to the crushed rock salt and stir.", "গুঁড়া খনিজ লবণে পানি দিয়ে নাড়ো।", {"type": "contains", "vessel": 0, "chemicalId": "H2O"}),
        step(2, "The salt dissolves; the sand does not and is left on the filter paper.", "লবণ দ্রবীভূত হয়; বালি হয় না, ছাঁকনি কাগজে থেকে যায়।", {"type": "contains", "vessel": 0, "chemicalId": "SiO2"}),
        step(3, "The clear filtrate in the evaporating basin contains the salt.", "বাষ্পীভবন পাত্রের স্বচ্ছ পরিস্রুতে লবণ আছে।", {"type": "contains", "vessel": 1, "chemicalId": "NaCl"}),
        step(4, "Heat the filtrate.", "পরিস্রুত উত্তপ্ত করো।", {"type": "heating", "vessel": 1}),
        step(5, "Bring it to the boil.", "এটি ফুটিয়ে তোলো।", {"type": "temperature", "vessel": 1, "min": 100}),
        step(6, "The water boils away and salt crystals are left behind.", "পানি বাষ্পীভূত হয়ে যায় এবং লবণের কেলাস থেকে যায়।", {"type": "reactionFired", "reactionId": "h2o-boil"}),
    ],
    safety={"level": "caution",
            "en": "Hot salt spits near dryness — turn the flame down at the end and keep your face away.",
            "bn": "শুকানোর কাছাকাছি গরম লবণ ছিটকে আসে — শেষে শিখা কমাও এবং মুখ দূরে রাখো।"},
    expected=["h2o-boil"],
    quizzes=[quiz(
        "Which part of rock salt stays on the filter paper?",
        "খনিজ লবণের কোন অংশ ছাঁকনি কাগজে থেকে যায়?",
        ["Salt", "Sand", "Water", "Nothing"], ["লবণ", "বালি", "পানি", "কিছুই না"],
        1,
        "Sand is insoluble in water, so it is the residue; dissolved salt passes through in the filtrate.",
        "বালি পানিতে অদ্রবণীয়, তাই এটিই অবশেষ; দ্রবীভূত লবণ পরিস্রুতের সাথে চলে যায়।"),
        quiz(
            "10.0 g of rock salt gives 7.5 g of pure salt. The percentage of salt is…",
            "১০.০ g খনিজ লবণ থেকে ৭.৫ g বিশুদ্ধ লবণ পাওয়া যায়। লবণের শতকরা পরিমাণ…",
            ["7.5%", "25%", "75%", "133%"], ["৭.৫%", "২৫%", "৭৫%", "১৩৩%"],
            2,
            "7.5 ÷ 10.0 × 100 = 75%.",
            "৭.৫ ÷ ১০.০ × ১০০ = ৭৫%।"),
    ],
    tags=["separation", "filtration", "evaporation", "simulation"],
    title_en="Purifying rock salt",
    title_bn="খনিজ লবণ বিশোধন",
    aim_en="Separate salt from sand by dissolving, filtering and evaporating, and work out the percentage of salt in rock salt.",
    aim_bn="দ্রবীভূত করে, ছেঁকে ও বাষ্পীভূত করে বালি থেকে লবণ আলাদা করা এবং খনিজ লবণে লবণের শতকরা পরিমাণ নির্ণয় করা।",
))

EXPERIMENTS.append(experiment(
    order=0, slug="iron-thiocyanate-equilibrium", level="class-11-12", duration=15,
    apparatus=["test-tube", "dropper"],
    chemicals=["FeCl3", "KSCN", "NaOH"],
    vessels=[
        vessel("test-tube", "Iron(III) chloride A", "আয়রন(III) ক্লোরাইড A", [("FeCl3", 3)]),
        vessel("test-tube", "Iron(III) chloride B", "আয়রন(III) ক্লোরাইড B", [("FeCl3", 3)]),
    ],
    steps=[
        step(1, "Add a little potassium thiocyanate to tube A.", "A নলে অল্প পটাশিয়াম থায়োসায়ানেট দাও।", {"type": "reactionFired", "reactionId": "fecl3-kscn"}),
        step(2, "A blood-red complex forms at once.", "সাথে সাথে রক্ত-লাল জটিল যৌগ তৈরি হয়।", {"type": "contains", "vessel": 0, "chemicalId": "FeSCN"}),
        step(3, "Make the same red solution in tube B.", "B নলেও একই লাল দ্রবণ তৈরি করো।", {"type": "contains", "vessel": 1, "chemicalId": "FeSCN"}),
        step(4, "Add sodium hydroxide to tube B: it removes Fe³⁺ as a brown precipitate…", "B নলে সোডিয়াম হাইড্রোক্সাইড দাও: এটি Fe³⁺-কে বাদামি অধঃক্ষেপ হিসেবে সরিয়ে দেয়…",
             {"type": "reactionFired", "reactionId": "fecl3-naoh"}),
        step(5, "…so the equilibrium shifts to the left and the red colour fades.", "…তাই সাম্যাবস্থা বামে সরে এবং লাল রং ফিকে হয়।", {"type": "contains", "vessel": 1, "chemicalId": "Fe(OH)3"}),
    ],
    safety={"level": "caution",
            "en": "Iron(III) chloride stains and irritates; sodium hydroxide is corrosive — wear goggles.",
            "bn": "আয়রন(III) ক্লোরাইড দাগ ফেলে ও জ্বালা করে; সোডিয়াম হাইড্রোক্সাইড ক্ষয়কারী — গগলস পরো।"},
    expected=["fecl3-kscn", "fecl3-naoh"],
    quizzes=[quiz(
        "Adding more Fe³⁺ to the red equilibrium mixture makes it…",
        "লাল সাম্য মিশ্রণে আরও Fe³⁺ যোগ করলে এটি…",
        ["Paler", "Deeper red", "Colourless", "Blue"], ["হালকা", "গাঢ় লাল", "বর্ণহীন", "নীল"],
        1,
        "Le Chatelier: the equilibrium shifts right to use up the added Fe³⁺, making more red [Fe(SCN)]²⁺.",
        "লা শাতেলিয়ে: যোগ করা Fe³⁺ খরচ করতে সাম্যাবস্থা ডানে সরে, ফলে বেশি লাল [Fe(SCN)]²⁺ তৈরি হয়।"),
        quiz(
            "The forward reaction is exothermic. Warming the mixture…",
            "সম্মুখ বিক্রিয়াটি তাপোৎপাদী। মিশ্রণ গরম করলে…",
            ["Makes it deeper red", "Makes it paler", "Changes nothing", "Makes it green"],
            ["গাঢ় লাল হয়", "হালকা হয়", "কিছুই বদলায় না", "সবুজ হয়"],
            1,
            "Heat favours the endothermic (backward) direction, so the equilibrium shifts left and Kc gets smaller.",
            "তাপ তাপহারী (পশ্চাৎমুখী) দিককে সুবিধা দেয়, তাই সাম্যাবস্থা বামে সরে এবং Kc ছোট হয়।"),
    ],
    tags=["equilibrium", "le-chatelier", "simulation"],
    title_en="Le Chatelier’s principle with iron(III) thiocyanate",
    title_bn="আয়রন(III) থায়োসায়ানেট দিয়ে লা শাতেলিয়ের নীতি",
    aim_en="Disturb the blood-red Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ equilibrium by adding reagents, heating and cooling, and predict which way it shifts.",
    aim_bn="বিকারক যোগ করে, গরম ও ঠান্ডা করে রক্ত-লাল Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ সাম্যাবস্থা বিঘ্নিত করা এবং কোন দিকে সরে তা নির্ণয় করা।",
))


def _js_number(token: str) -> str:
    """Format a float the way JavaScript's JSON.stringify does (keeps the data diff clean)."""
    x = float(token)
    if x == 0:
        return "0"
    if 1e-6 <= abs(x) < 1e21:
        text = format(Decimal(repr(x)), "f")
        return text.rstrip("0").rstrip(".") if "." in text else text
    mantissa, exponent = repr(x).split("e")
    return f"{mantissa}e{int(exponent):+d}".replace("e+-", "e-") if int(exponent) > 0 else f"{mantissa}e{int(exponent)}"


def write(path: Path, payload: dict) -> None:
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    text = re.sub(r"(:\s|^\s+)(-?\d+(?:\.\d+)?e[-+]\d+)(,?)$", lambda m: m.group(1) + _js_number(m.group(2)) + m.group(3), text, flags=re.M)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    chem_path = DATA / "chemicals.json"
    chem = json.loads(chem_path.read_text(encoding="utf-8"))
    have = {c["id"] for c in chem["chemicals"]}
    added_chem = [c["id"] for c in CHEMICALS if c["id"] not in have]
    chem["chemicals"].extend(c for c in CHEMICALS if c["id"] not in have)
    for c in chem["chemicals"]:
        if c["id"] in SHELVE:
            c["shelf"] = True
            for k, v in SHELVE[c["id"]].items():
                c.setdefault(k, v)
    chem["count"] = len(chem["chemicals"])
    chem["shelfCount"] = sum(1 for c in chem["chemicals"] if c.get("shelf"))
    write(chem_path, chem)

    rx_path = DATA / "reactions.json"
    rx = json.loads(rx_path.read_text(encoding="utf-8"))
    have_rx = {r["id"] for r in rx["reactions"]}
    added_rx = [r["id"] for r in REACTIONS if r["id"] not in have_rx]
    rx["reactions"].extend(r for r in REACTIONS if r["id"] not in have_rx)
    rx["count"] = len(rx["reactions"])
    write(rx_path, rx)

    exp_path = DATA / "experiments.json"
    exp = json.loads(exp_path.read_text(encoding="utf-8"))
    have_exp = {e["slug"] for e in exp["experiments"]}
    next_order = max((e.get("order", 0) for e in exp["experiments"]), default=0)
    added_exp = []
    for item in EXPERIMENTS:
        if item["slug"] in have_exp:
            continue
        next_order += 1
        item["order"] = next_order
        exp["experiments"].append(item)
        added_exp.append(item["slug"])
    exp["count"] = len(exp["experiments"])
    write(exp_path, exp)

    print(f"chemicals: +{len(added_chem)} → {chem['count']} ({chem['shelfCount']} on the shelf)")
    print(f"reactions: +{len(added_rx)} → {rx['count']}")
    print(f"experiments: +{len(added_exp)} → {exp['count']}")
    for slug in added_exp:
        print(f"  + {slug}")


if __name__ == "__main__":
    main()
