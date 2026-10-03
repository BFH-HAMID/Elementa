# Elementa Chemistry Lab — content and code guide

The Chemistry Lab is a bilingual (বাংলা + English) virtual wet lab that runs entirely in the
browser: no backend, no database, no API keys, no paid service. Everything a student can pour,
heat, spark or electrolyse is described in JSON under [`data/`](data), and a set of **pure
functions** in [`engine/`](engine) decides what happens. Components only draw the result.

Open it from the header button **Chemistry Lab / কেমিস্ট্রি ল্যাব**, or go straight to
`/bn/lab/chemistry` (Bangla) and `/en/lab/chemistry` (English).

```text
/bn|/en/lab/chemistry                    the bench: shelf, vessels, notebooks
/bn|/en/lab/experiments                  catalog of the guided walkthroughs
/bn|/en/lab/experiments/<slug>           one walkthrough, printed as a lab manual
/bn|/en/lab/chemistry?experiment=<slug>  the bench with that walkthrough pre-loaded
```

---

## 1. How the pieces fit together

```text
data/*.json  ──►  lib/labData.ts  ──►  engine/*.ts (pure)  ──►  store/labStore.ts  ──►  components/lab/*
  content           typed access         chemistry rules         actions + history        SVG + panels
```

| Layer | Files | Responsibility |
| --- | --- | --- |
| Content | `data/chemicals.json`, `data/apparatus.json`, `data/reactions.json`, `data/experiments.json`, `data/elements.json` | Every chemical, every piece of glassware, every reaction rule, every guided experiment, all 118 elements. Adding content never requires touching TypeScript. |
| Access | `lib/labData.ts` | Loads the JSON once, indexes it by id, and exposes helpers (`chemicalName`, `apparatusName`, `capacityOf`, `partnerIdsFor`, `getExperiment`, `datasetStats`). |
| Engine | `engine/reactionEngine.ts`, `engine/phCalc.ts`, `engine/heatModel.ts`, `engine/colorMixer.ts`, `engine/vesselView.ts`, `engine/experimentChecks.ts`, `engine/types.ts` | Pure functions: pick a reaction, apply stoichiometry, compute pH, step the heat model, mix colours, project a `VesselView` for drawing, check guided-experiment steps. No React, no store, no clock of their own — they take data and return data. |
| State | `store/labStore.ts` | Zustand store: bench contents, burner, effects, notebook, history (undo/redo), localStorage save/load, guided-experiment progress, the 5 Hz `tick()` that advances heat and settles gases. |
| UI | `components/lab/**` | `ChemistryLab` (drag-and-drop shell), `Shelf`, `Workbench`, `VesselStation`, `Apparatus/*` (SVG glassware), `LiquidView`, `EffectsLayer`, `PhMeter`, `EquationBox`, `ObservationPanel`, `ExperimentGuidePanel`, `SafetyOverlay`, `LabToolbar`, `ElementReference`. |
| Copy | `lib/i18n.ts`, `messages/{bn,en}.json` | All lab strings live in `lib/i18n.ts` as one bilingual dictionary (`labT(locale, key, vars)`); only the header button label is in `messages/*.json` (`nav.chemistryLab`). |
| Tests | `engine/__tests__/*.test.ts` | Vitest unit tests for the engine — currently 85 assertions across 5 files. |

**Rule of thumb:** if a piece of chemistry is wrong, fix it in `data/` or `engine/` and add a
test. If something only looks wrong, fix it in `components/lab/`.

---

## 2. Units and conventions

| Quantity | Unit in the data | Notes |
| --- | --- | --- |
| Liquid amount | mL | Stored per portion as `mL` **and** `moles`. |
| Solid amount | g | The same `mL` field carries grams for `state: "solid"`; the UI labels it correctly. |
| Gas amount | mL at RTP | `MOLAR_VOLUME_ML = 24000` (24 L/mol at room temperature and pressure). Gas volumes are capped by the vessel headspace for display; `moles` is always the true amount. |
| Molar mass | g/mol | `molarMass` on the chemical. |
| Solution strength | mol/L | `concentrationM`; used to convert mL ↔ moles. |
| Temperature | °C | Ambient is `AMBIENT_C = 25`. |
| Heat of reaction | °C change | `effects.deltaT`, applied through `applyDeltaT` scaled by the liquid volume. |

Portions are always converted to **moles** internally, so stoichiometry works whatever units the
student poured in. `volumeFor()` converts back for display.

---

## 3. Add a chemical

Append a record to `data/chemicals.json` → `chemicals[]` and update `count` (and `shelfCount` if
the chemical appears on the shelf).

```json
{
  "id": "Pb(NO3)2",
  "formula": "Pb(NO₃)₂",
  "name_en": "Lead(II) nitrate",
  "name_bn": "লেড(II) নাইট্রেট",
  "category": "salt",
  "state": "liquid",
  "color": "#eef3f8",
  "opacity": 0.6,
  "molarMass": 331.2,
  "shelf": true,
  "hazard": "toxic",
  "soluble": true,
  "precipitate": false,
  "concentrationM": 0.5,
  "acidity": { "kind": "salt", "saltOf": { "acid": "HNO3", "base": "Pb(OH)2" } },
  "notes_en": "Used for the golden-rain precipitation demo.",
  "notes_bn": "গোল্ডেন রেইন অধঃক্ষেপণ পরীক্ষায় ব্যবহৃত হয়।"
}
```

Field reference:

| Field | Values | Effect |
| --- | --- | --- |
| `id` | unique, ASCII | Referenced by reactions, experiments and shelf chips. |
| `formula` | display string | Subscripts are written with Unicode (`H₂SO₄`). |
| `category` | `acid` · `base` · `salt` · `metal` · `gas` · `indicator` · `solvent` · `organic` · `oxide` · `other` | Shelf tab and grouping. |
| `state` | `solid` · `liquid` · `gas` | Units (g / mL / mL at RTP), pour behaviour, whether it enters the headspace. |
| `color`, `opacity` | hex, 0–1 | Base colour of the liquid drawn by `LiquidView`. |
| `molarMass`, `concentrationM` | numbers | Mole conversion. Omit `concentrationM` for pure solids/metals. |
| `shelf` | boolean | `true` puts it on the shelf; `false` keeps it available to the engine (products such as `AgCl` are off-shelf). |
| `hazard` | `none` · `irritant` · `corrosive` · `toxic` · `flammable` · `oxidiser` · `dangerous` | Chip colour and label on the shelf (`shelf.hazard.*` in `lib/i18n.ts`). |
| `soluble`, `precipitate` | booleans | `precipitate: true` means the chemical drops to the bottom as sediment instead of colouring the liquid. Metals are `precipitate: false` and sink as sediment too. |
| `amphoteric` | boolean | Lets hydroxides redissolve in excess base (e.g. `Zn(OH)2` + `NaOH`). |
| `acidity` | `{ kind: "acid" \| "base" \| "salt" \| "neutral", strength, protons \| hydroxides, ka \| kb, saltOf }` | Drives the pH model. Salts of a weak acid/base hydrolyse slightly. |
| `activity` | number | Reactivity-series position, used to decide displacement reactions. |
| `flameColor` | hex | Flame-test colour when the chemical is heated strongly. |
| `indicator` | `litmus` · `phenolphthalein` · `methyl-orange` · `universal` | Makes the chemical an indicator: its colour is mixed into the liquid according to pH. |
| `gasTest` | `{ name_en, name_bn }` | Text shown for the classic confirming test of a gas. |

`data/elements.json` is reference data only (all 118 elements, bilingual names, group, period,
block, state, radioactivity). It is loaded lazily by `components/lab/ElementReference.tsx` so the
118-element grid never costs the bench anything.

---

## 4. Add a piece of apparatus

Append to `data/apparatus.json` → `apparatus[]` and update `count`.

```json
{
  "id": "round-bottom-flask",
  "shape": "flask",
  "name_en": "Round-bottom flask",
  "name_bn": "গোল তলার ফ্লাস্ক",
  "kind": "vessel",
  "capacityMl": 250,
  "defaultFillMl": 25,
  "canHeat": true,
  "acceptsGas": false,
  "icon": "flask",
  "notes_en": "Even heating for distillation.",
  "notes_bn": "পাতনের জন্য সমভাবে গরম হয়।"
}
```

| Field | Values | Effect |
| --- | --- | --- |
| `kind` | `vessel` · `heat` · `support` · `measure` · `tool` · `power` | Decides what dropping it does (see below). |
| `shape` | `tube` · `beaker` · `flask` · `cylinder` · `burette` · `jar` · `dish` (vessels) or `burner` · `tripod` · `thermometer` · `dropper` · `spatula` · `delivery` · `holder` · `cell` (tools) | Picks the SVG drawing. New vessel shapes need a component in `components/lab/Apparatus/` plus an entry in `vesselComponents`; unknown shapes fall back to the test tube. |
| `capacityMl` | number | Fill level, headspace for gases, "vessel is full" warning. |
| `canHeat` | boolean | `false` refuses heating with a message (measuring cylinders and burettes must not be heated). |
| `acceptsGas` | boolean | `true` makes it a gas-collection target for the delivery tube. |

**Drop semantics** (implemented once, in `components/lab/ChemistryLab.tsx` → `drop()`):

| Dropped on a vessel | Result |
| --- | --- |
| another vessel | the station changes glassware, contents scale proportionally (`setVesselApparatus`) |
| `heat` / `support` (burner, tripod, tube holder) | the station starts heating and the burner lights itself |
| `measure` (thermometer) | a thermometer is clamped to the station |
| `power` (electrolysis cell) | current flows; `electrolysis` triggers become available |
| delivery tube | gas is pushed into a gas jar (one is added automatically if the bench has none) |
| dropper | 1 mL is transferred from the selected station into this one |
| spatula | the mixture is stirred — settled solid clouds the liquid, then settles again |

Dropping on the **bench** (not on a vessel) adds a new station for glassware, and adds the
chemical to the selected station — creating a test tube first if the bench is empty.

---

## 5. Add a reaction

Append to `data/reactions.json` → `reactions[]` and update `count`. This is the file you will
edit most often.

```json
{
  "id": "pbno32-ki",
  "category": "precipitation",
  "reactants": [
    { "id": "Pb(NO3)2", "coefficient": 1 },
    { "id": "KI", "coefficient": 2 }
  ],
  "products": [
    { "id": "PbI2", "coefficient": 1, "state": "s" },
    { "id": "KNO3", "coefficient": 2, "state": "aq" }
  ],
  "trigger": { "heat": false, "minTempC": null, "spark": false, "electrolysis": false, "light": false },
  "inert": false,
  "effects": {
    "colorTo": "#f6d33f",
    "gas": null,
    "gasRate": 0,
    "precipitate": { "id": "PbI2", "color": "#f7d11b", "density": 0.9 },
    "smoke": null,
    "deltaT": 0,
    "flame": null,
    "glow": false,
    "sound": null,
    "dissolve": false
  },
  "equation": "Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s)↓ + 2KNO₃(aq)",
  "equation_bn": "Pb(NO₃)₂(দ্রব) + 2KI(দ্রব) → PbI₂(কঠি)↓ + 2KNO₃(দ্রব)",
  "observation_en": "A bright yellow precipitate of lead iodite forms — the golden rain test.",
  "observation_bn": "উজ্জ্বল হলুদ লেড আয়োডাইড অধঃক্ষেপ পড়ে — গোল্ডেন রেইন পরীক্ষা।",
  "hazard": "caution",
  "hazard_en": "Lead salts are toxic. This is a simulation — never handle them in a school lab without supervision.",
  "hazard_bn": "লেড লবণ বিষাক্ত। এটি সিমুলেশন — তত্ত্বাবধান ছাড়া বিদ্যালয় ল্যাবে কখনোই ব্যবহার করবেন না।",
  "priority": 2,
  "tags": ["class-11-12", "precipitation"]
}
```

Every id in `reactants` and `products` must exist in `data/chemicals.json`. Products that are
solids or gases must be present as chemicals too (with `shelf: false` if students should not pour
them).

### Effects reference

| Field | Type | What the student sees |
| --- | --- | --- |
| `colorTo` | hex \| null | The liquid is recoloured to this value (`EffectsLayer` fades it in; `colorMixer` composes it with what is already there). |
| `gas` + `gasRate` | chemical id, 0–1 | Bubbles rise and the gas collects in the headspace; `gasRate` scales bubble density and how fast the volume builds. |
| `precipitate` | `{ id, color, density }` | Solid forms and settles to the bottom; `density` controls how quickly it drops, and turbidity clouds the liquid first. |
| `smoke` | `{ color, density }` | A drifting plume above the mouth of the vessel. |
| `deltaT` | °C | Heat released (+) or absorbed (−), scaled by volume through `applyDeltaT`. |
| `flame` | `{ color, label_en, label_bn }` | The burner flame takes this colour — used by flame tests. |
| `glow` | boolean | A soft luminous halo (chemiluminescence, bright oxidation). |
| `sound` | string \| null | Named cue; the pop test uses `"pop"`. Kept as data so a future build can add audio without new rules. |
| `dissolve` | boolean | A sediment layer redissolves into the liquid. |

### Triggers

`trigger` gates a rule so it only fires under the right conditions:

| Flag | Meaning |
| --- | --- |
| `heat` | The station must be heating with the burner lit. |
| `minTempC` | …and the liquid must be at least this hot (thermal decomposition uses 120–300 °C; flame tests use 120 °C). |
| `spark` | The student pressed **Spark** on that station (hydrogen pop test, combustion). |
| `electrolysis` | The electrolysis cell must be attached. |
| `light` | A bright flash is needed (silver-halide darkening). A spark also counts as light. |

When a rule is blocked only by its trigger, the bench shows a hint instead of staying silent
(`hint.heat`, `hint.spark`, `hint.electrolysis`, `hint.light` in `lib/i18n.ts`), including the
temperature it is waiting for.

### `inert`, `priority` and how a winner is chosen

Several rules can match the same vessel. `selectReaction()` in `engine/reactionEngine.ts`:

1. keeps rules whose **every reactant is present** and whose **trigger is satisfied** (`candidatesFor`);
2. `rankCandidates()` throws away `inert: true` demo rules (flame tests, boiling notes,
   `no-reaction` records) whenever a real chemical change is possible, so a decoration never
   outranks chemistry;
3. scores what is left with `scoreReaction()`:

   ```text
   score = priority × 10
         + 4 if the rule needs a trigger at all
         + 2 if it needs heat and the burner is heating
         + reactant count × 1.5
         + up to 2 for how much limiting reagent is available
   ```

4. applies it with `applyReaction()`, then re-runs the whole selection on the products — up to
   `MAX_PASSES = 6` times — so chained chemistry works (acid + carbonate → CO₂, then CO₂ + limewater
   → CaCO₃ cloudiness). A chain only ever continues into the *original* vessel contents, which
   stops a freshly produced gas from being instantly consumed by a rule that should need effort.

Practical guidance for `priority`: `3` for the textbook-defining reaction of a pair (strong
acid + strong base, silver + chloride), `2` for ordinary reactions, `1` for slow or secondary
changes, `0` for `inert` records such as flame tests and "no visible reaction" notes.

If nothing matches, the bench logs **"no visible reaction"** and, using `reactionsFor()` and
`partnerIdsFor()`, suggests which partner chemicals would react — the student is never left
guessing whether the app simply did not know.

### Safety records

Set `"hazard": "caution"` or `"danger"` and write `hazard_en` / `hazard_bn`. That text is what the
`SafetyOverlay` shows. **The safety layer states what happens and why it is dangerous; it never
gives quantities, apparatus recipes or step-by-step instructions for making a hazardous mixture.**
Sodium in water, hydrogen + air, concentrated acid dilution and oxidiser/organic mixtures already
carry such records — follow their tone.

---

## 6. Add a guided experiment

Append to `data/experiments.json` → `experiments[]` and update `count`.

```json
{
  "order": 12,
  "slug": "golden-rain",
  "title_en": "Golden rain: lead iodide precipitation",
  "title_bn": "গোল্ডেন রেইন: লেড আয়োডাইড অধঃক্ষেপণ",
  "aim_en": "Watch a double-displacement precipitation reaction and identify the limiting reagent.",
  "aim_bn": "দ্বৈত প্রতিস্থাপন অধঃক্ষেপণ বিক্রিয়া দেখুন ও লিমিটিং বিকারক শনাক্ত করুন।",
  "level": "class-11-12",
  "durationMinutes": 5,
  "apparatus": ["test-tube", "dropper"],
  "chemicals": ["Pb(NO3)2", "KI", "H2O"],
  "setup": {
    "vessels": [
      {
        "apparatusId": "test-tube",
        "label_en": "Tube A",
        "label_bn": "নল ক",
        "portions": [{ "chemicalId": "Pb(NO3)2", "mL": 5 }]
      }
    ]
  },
  "steps": [
    {
      "order": 1,
      "text_en": "Add potassium iodide solution to Tube A.",
      "text_bn": "নল ক-তে পটাশিয়াম আয়োডাইড দ্রবণ যোগ করুন।",
      "check": { "type": "contains", "vessel": 0, "chemicalId": "KI" }
    },
    {
      "order": 2,
      "text_en": "Note the yellow precipitate.",
      "text_bn": "হলুদ অধঃক্ষেপ লক্ষ্য করুন।",
      "check": { "type": "reactionFired", "reactionId": "pbno32-ki" }
    }
  ],
  "expectedReactions": ["pbno32-ki"],
  "safety": {
    "level": "caution",
    "en": "Lead compounds are toxic; in a real lab this waste is collected, never poured down the sink.",
    "bn": "লেড যৌগ বিষাক্ত; বাস্তব ল্যাবে এই বর্জ্য সংগ্রহ করা হয়, নর্দমায় ফেলা হয় না।"
  },
  "quiz": [
    {
      "question_en": "What colour is lead iodide?",
      "question_bn": "লেড আয়োডাইডের রঙ কী?",
      "options_en": ["Yellow", "White", "Blue", "Black"],
      "options_bn": ["হলুদ", "সাদা", "নীল", "কালো"],
      "answer": 0,
      "explain_en": "PbI₂ is a bright yellow solid, which is why the demo is called golden rain.",
      "explain_bn": "PbI₂ উজ্জ্বল হলুদ কঠিন, তাই এই পরীক্ষার নাম গোল্ডেন রেইন।"
    }
  ],
  "tags": ["precipitation", "class-11-12"]
}
```

### Step checks

`engine/experimentChecks.ts` evaluates each step against the bench — the UI never decides
progress. Supported checks:

| `type` | Fields | Satisfied when |
| --- | --- | --- |
| `vesselCount` | `min` | that many stations are on the bench |
| `contains` | `vessel` (index), `chemicalId` | the station holds that chemical as liquid, sediment **or** collected gas |
| `temperature` | `vessel`, `min` | the station is at least that hot |
| `phRange` | `vessel`, `min?`, `max?` | the pH model returns a value inside the window |
| `reactionFired` | `reactionId` | that rule fired anywhere on the bench (from the notebook or the vessel's last reaction) |
| `heating` | `vessel` | the station is on the flame |
| `electrolysis` | `vessel` | the cell is attached to that station |
| `spark` | `vessel` | the student sparked that station |

`vessel` is a **zero-based index into the bench order**, matching `setup.vessels`. A step may also
refer to a station the student adds themselves (a gas jar, for instance).

The panel shows `checkHint()` — a bilingual one-liner such as *"Put potassium iodide (KI) into
station 1"* — under the current step, so a stuck student knows exactly what the lab is waiting for.

---

## 7. The pH and indicator model

`engine/phCalc.ts`:

- converts every portion to moles, sums strong-acid protons and strong-base hydroxides, and solves
  the charge balance with the water constant at the current temperature (`kwAt`, so neutral pH
  drifts below 7 when the liquid is hot — a nice detail for HSC students);
- weak acids/bases use their `ka`/`kb`; salts of a weak partner hydrolyse slightly;
- returns `{ ph, poh, hPlus, ohMinus, nature, dominantId }`, clamped to `[-1, 15]`;
- `indicatorBands` holds the colour ranges for litmus, phenolphthalein, methyl orange and a
  nine-stop universal scale; `indicatorColor()` interpolates universal indicator so the pH strip
  moves continuously, while the other three snap between named bands;
- `observedColor()` mixes the indicator colour into the liquid colour, weighted by how much was
  added — a couple of drops tint a tube, 10 % of the volume owns it;
- `titreVolumeMl()` is the pure helper behind burette titration maths.

`components/lab/PhMeter.tsx` renders the reading, the gradient scale with a spring marker, the
nature pill, `[H⁺]`, pOH, and every indicator currently in the selected vessel.

## 8. The heat model

`engine/heatModel.ts` — deliberately simple and stable at 5 ticks/second:

| Constant | Value | Meaning |
| --- | --- | --- |
| `BURNER_POWER_W` | 260 | Full flame power, scaled by the intensity slider. |
| `SPECIFIC_HEAT` | 4.18 J g⁻¹ K⁻¹ | Water-like contents. |
| `LATENT_HEAT` | 2260 J g⁻¹ | Boiling removes liquid (and can dry a vessel out). |
| `COOLING_K` | 0.006 | Newton cooling toward ambient. Lower values let the bench reach a boil. |
| `GLASS_MASS_G` | 12 | The glassware absorbs some heat. |
| `SPECIFIC_HEAT_DRY` | 0.9 J g⁻¹ K⁻¹ | Glass and a dry solid heat much faster than water. |
| `DRY_MAX_C` | 700 | Ceiling for a vessel with no liquid left in it. |

A vessel that still holds **liquid** is clamped at its boiling point (`boilingPointFor`), because
that is what a real beaker does. A **dry** vessel — a solid on its own, or a solution that has
boiled away — keeps climbing toward the flame temperature, which is what lets thermal
decomposition (NH₄Cl 120 °C, KMnO₄ 200 °C, Cu in air 250 °C, Mg in air 300 °C, CaCO₃ 600 °C) and
the flame tests (120 °C) actually fire. In practice: to see a flame test for a salt in solution,
heat it until the water boils off and the dry residue glows.

`boilingPointFor()` raises the boiling point with dissolved solute (capped at 112 °C), `stepHeat()`
returns the new temperature plus how much boiled away, and `heatColour()` / `describeHeat()` give
the UI its warm glass glow and bilingual sentence.

Heat-triggered reactions are re-checked inside `tick()` whenever a station climbs 8 °C past its
last evaluation, so a rule with `minTempC: 200` fires at the right moment rather than when the
flame was first lit.

---

## 9. Local development

```bash
npm install
npm run dev            # http://localhost:3000/bn/lab/chemistry
npm test               # vitest: 85 engine tests
npm run test:watch
npm run typecheck
npm run lint
npm run build
```

`store/__tests__/labStore.test.ts` drives the bench the way the UI does — pour, mix, heat, boil,
spark, collect gas, stir, undo/redo, save/load, load a walkthrough — so a change in the engine
that breaks the bench shows up in `npm test` (106 tests in total).

The lab adds three dev dependencies only — `@dnd-kit/core`, `@dnd-kit/utilities` (drag and drop,
touch included) and `vitest` (engine tests). Framer Motion and Zustand were already in the
project. Nothing is fetched at runtime, so the lab works offline once the page is loaded, and
`save`/`load` keep the bench in `localStorage` under `elementa-chemistry-lab:v1`.

### Testing a new rule

Add a case to `engine/__tests__/reactionEngine.test.ts`:

```ts
it('makes golden rain from lead nitrate and potassium iodide', () => {
  const vessel = makeVessel([
    { id: 'Pb(NO3)2', mL: 5 },
    { id: 'KI', mL: 5 }
  ], { apparatusId: 'test-tube' });

  const result = resolveVessel(vessel, dataset, roomContext);

  expect(result.outcomes[0].reaction?.id).toBe('pbno32-ki');
  expect(result.vessel.sediment.some((item) => item.chemicalId === 'PbI2')).toBe(true);
  expect(result.effects.some((effect) => effect.kind === 'precipitate')).toBe(true);
  expect(result.vessel.turbidity).toBeGreaterThan(0);
});
```

`engine/__tests__/helpers.ts` gives you `dataset`, `chemicalsById`, `chemical()`, `reaction()`,
`makeVessel()`, `volumeOf()`, `molesOf()` and `mL()`.

---

## 10. Accessibility, mobile and dark mode

- Dragging uses `@dnd-kit` with a pointer sensor (`distance: 8`, so taps and scrolling still work
  on phones) plus a keyboard sensor. **Every drag has a tap equivalent**: tapping a shelf chip adds
  it to the selected station, creating a test tube if the bench is empty.
- All animation honours `prefers-reduced-motion` (`prefersReducedMotion()` in `lib/utils.ts`), and
  the print stylesheet in `app/globals.css` keeps the notebooks readable on paper.
- Dark mode comes from the existing theme tokens (`--surface`, `--ink`, `--line`, `--brand`); the
  lab adds no new palette of its own beyond Tailwind's `chemistry`/`physics` accents.
- Effects use deterministic pseudo-random values (`prng()` in `EffectsLayer.tsx`) rather than
  `Math.random()` during render, so server and client HTML match and hydration never warns.
- Stations, sliders and dialogs are labelled; the safety overlay is an `alertdialog` that a
  danger-level event keeps open until the student acknowledges it.

## 11. Deploying

The lab changes nothing about hosting: it is static Next.js output with no environment variables.
Follow the [GitHub push](README.md#github-push) and
[Vercel Hobby deployment](README.md#vercel-hobby-deployment) sections of the README. Every lab
route is pre-rendered for both locales at build time (`generateStaticParams`), and the search index
gains the lab entries automatically through `scripts/build-search-index.mjs`.

## 12. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Two chemicals do nothing, and the notebook says "no visible reaction" | No rule in `data/reactions.json` lists that exact pair. Add one; the id of every reactant must match a chemical id. |
| A rule exists but never fires | Its `trigger` is not satisfied (heat, `minTempC`, spark, electrolysis, light), or another rule with a higher `priority` wins. The bench hint tells you which condition is missing. |
| A flame test or boiling note wins instead of real chemistry | The real rule is probably marked `inert: true`, or it is missing; `rankCandidates()` prefers non-inert rules. |
| Gas appears but the vessel does not fill | Gas volume is capped by headspace: `capacityMl − liquid − sediment`. Collect it with the delivery tube into a gas jar. |
| A precipitate floats in the liquid | The product chemical needs `"precipitate": true` (metals sink automatically). |
| The indicator colour looks wrong | Check `acidity` on the acid/base and the bands in `engine/phCalc.ts`; universal indicator interpolates between stops, the other three snap to bands. |
| A flame test or decomposition never fires | The chemical is still dissolved: a wet vessel is clamped at its boiling point. Boil the liquid off (or start from the dry solid) and the temperature climbs past `minTempC`. |
| A guided step will not tick | Compare the check against the bench: `vessel` is a zero-based station index, `reactionFired` needs the exact reaction id. `checkHint()` under the step says what the lab wants. |
| The bench resets when you navigate away | In-memory by design. Use **Save lab** (or ⌘/Ctrl+S) to keep it in `localStorage`, then **Load lab**. |
