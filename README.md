# PhysChem Lab

<p align="center">
  <img src="public/readme/physchem-lab-hero.svg" alt="PhysChem Lab — Learn it. See it. Try it." width="100%" />
</p>

<p align="center">
  <strong>Learn it. See it. Try it.</strong><br />
  A free bilingual browser laboratory for physics and chemistry learners in Bangladesh.
</p>

<p align="center">
  <a href="/BFH-HAMID/Elementa/actions"><img src="public/readme/badge-build.svg" alt="Build verified" /></a>
  <a href="https://nextjs.org/"><img src="public/readme/badge-next.svg" alt="Next.js 14" /></a>
  <a href="https://www.typescriptlang.org/"><img src="public/readme/badge-typescript.svg" alt="TypeScript strict" /></a>
  <a href="LICENSE"><img src="public/readme/badge-license.svg" alt="MIT licence" /></a>
</p>

<p align="center">
  <a href="https://physchem-lab.vercel.app/bn">বাংলা সংস্করণ</a> ·
  <a href="https://physchem-lab.vercel.app/en">English version</a> ·
  <a href="https://github.com/BFH-HAMID/Elementa/pulls">Contribute</a>
</p>

PhysChem Lab is a free, bilingual (Bangla + English) physics and chemistry learning platform for Bangladesh. It combines original equation notes, practical experiment guides, short quizzes and interactive browser simulations for NCTB Classes 6–12 through an introductory National University Honours level.

It also ships the **Elementa Chemistry Lab** — a drag-and-drop virtual wet lab in the header: pour acids, bases, salts and metals into SVG glassware, heat them on a Bunsen burner, spark a gas jar, electrolyse water, read the pH and indicator colours, and follow 11 guided walkthroughs that tick themselves off. It is data-driven (109 chemicals, 15 pieces of apparatus, 119 reaction rules in JSON), needs no backend, and its chemistry engine is pure TypeScript covered by 106 Vitest tests. See [`CHEMISTRY_LAB_GUIDE.md`](CHEMISTRY_LAB_GUIDE.md).

> **বাংলায়:** সূত্র শুধু মুখস্থ নয় — পরিবর্তন করুন, পর্যবেক্ষণ করুন, এবং নিজের ব্যাখ্যা তৈরি করুন।

## Visual tour

The README uses self-hosted SVG artwork so the project page has a visual identity without depending on a screenshot CDN. The hero and simulation previews include lightweight SVG motion; browsers that respect `prefers-reduced-motion` see the same artwork without looping animation.

<table>
  <tr>
    <td width="50%"><img src="public/readme/dashboard-preview.svg" alt="Stylised PhysChem Lab dashboard preview" /></td>
    <td width="50%"><img src="public/readme/simulation-loop.svg" alt="Animated projectile motion simulation preview" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Responsive home dashboard</sub></td>
    <td align="center"><sub>Live Canvas simulation loop</sub></td>
  </tr>
</table>

<img src="public/readme/architecture.svg" alt="PhysChem Lab static architecture diagram" width="100%" />

## What is included

- 249 typed MDX equation notes, including detailed bilingual derivations and chapter-level formula sheets for the supplied physics and chemistry topics. Standalone proof pages use numbered steps with optional KaTeX lines; collection pages state assumptions beside each law.
- 170 interactive equation calculators that solve for any variable, with unit conversion and a worked-substitution panel; 154 are declarative models in `lib/calculator-models.ts` and 16 are hand-written solvers in `lib/calculations.ts`.
- A searchable, bilingual checklist of 85 school and HSC practical topics, alongside 11 full lab guides covering pendulums, Ohm's law, lenses, titration, vectors, projectile motion, spring oscillations, Venturi flow, Wheatstone bridges, Boyle's law and Young's double-slit experiment.
- 16 original interactive Canvas 2D simulations for projectile motion, vector addition, spring oscillations, fluid flow, Wheatstone bridges, Young's double slit, a pendulum, circuits, wave interference, Newton's second law, optics, titration, pH, ideal gases and reaction kinetics.
- An embedded, searchable PhET HTML5 library with 67 Physics and 35 Chemistry subject entries (81 unique simulations); official `/latest/` builds are loaded only on each detail page, with direct-open fallback and attribution.
- A dynamically loaded 3Dmol.js molecule viewer for water, methane and benzene, plus an optional React Three Fiber optics field preview.
- The Elementa Chemistry Lab at `/lab/chemistry`: a bilingual drag-and-drop bench with SVG glassware, live liquid levels and colours, bubbling/precipitate/smoke/flame effects, heating and boiling, a pH + indicator model, a balanced-equation box, a bilingual observation notebook, a safety layer and 11 guided experiments with auto-checked steps and quizzes.
- KaTeX equations, MDX rendering, Zod frontmatter validation, Fuse.js search and a Ctrl/Cmd+K command palette.
- Recharts live graphs, CSV data export, screenshot download and fullscreen simulation mode.
- Local-only bookmarks, recently viewed items, quiz score history, progress, theme and language preferences with Zustand.
- Bangla-first routing (`/bn`) with English (`/en`), a manual service worker, manifest, SEO metadata, sitemap, robots and OpenGraph artwork.

There is no database, backend API, login or required environment variable. PhET's official embedded sims are fetched from PhET's servers, so they need an internet connection. PhET currently licenses its simulation files under CC BY-NC 4.0; commercial or ad-supported use requires separate permission from PhET. See the [official licensing terms](https://phet.colorado.edu/en/licensing).

## Local setup

Requirements: Node.js 20 LTS or newer and npm 10 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000/bn](http://localhost:3000/bn). English is available at `/en`.

Before opening a pull request, run the same checks used by deployment:

```bash
npm run typecheck
npm run lint
npm test          # 106 Vitest tests: chemistry engine + bench store
npm run build
npm start
```

The `prebuild` script creates `public/search-index.json` from MDX frontmatter, the practical-topic catalog, the simulation registry and the Chemistry Lab experiments. The build is otherwise fully static.

## Project map

```text
app/[locale]       Static App Router pages and locale layouts
app/[locale]/lab   Elementa Chemistry Lab: bench and guided-experiment pages
components/        UI, layout, content and simulation building blocks
components/lab/    Chemistry Lab bench, shelf, SVG apparatus and notebooks
content/           MDX equation/experiment guides, JSON practical index and quizzes
data/              Chemistry Lab content: elements, chemicals, apparatus, reactions, experiments
engine/            Pure chemistry engine (reactions, pH, heat, colour, step checks) + Vitest tests
lib/               Schemas, content loader, calculations, constants and store
messages/          next-intl Bangla and English messages
simulations/       One discoverable folder per simulation
store/             Chemistry Lab Zustand store (bench, burner, history, localStorage)
public/             PWA assets, animated README artwork and social artwork
.github/workflows/  Typecheck, lint and production build verification
```

## Add an equation

1. Choose one of `content/physics` or `content/chemistry` and a level folder: `class-6-8`, `class-9-10`, `class-11-12` or `honours`.
2. Create a kebab-case `.mdx` file. Start with the schema below:

```mdx
---
type: equation
slug: conservation-of-energy
title_bn: শক্তির সংরক্ষণ
title_en: Conservation of energy
subject: physics
level: class-9-10
chapter: Work, energy and power
chapter_bn: কাজ, শক্তি ও ক্ষমতা
latex: 'E_1 = E_2'
variables:
  - symbol: E
    name: energy
    name_bn: শক্তি
    unit: J
    si_unit: J
derivation: Original English intuition for the relationship.
derivation_bn: সমীকরণের বাংলা intuition।
derivation_steps:
  - step_en: Start from the definition of work and substitute F = ma.
    step_bn: কাজের সংজ্ঞা থেকে শুরু করে F = ma বসান।
    latex: 'W = Fs = mas'
  - step_en: Use v² = u² + 2as to remove the acceleration term.
    step_bn: v² = u² + 2as ব্যবহার করে ত্বরণের পদ সরান।
    latex: 'W = \\frac{1}{2}mv^2 - \\frac{1}{2}mu^2'
summary_en: One-sentence English summary.
summary_bn: এক বাক্যে বাংলা summary।
related: [work-done]
tags: [energy, conservation]
---

Longer original MDX notes can be written here. Inline math such as `$E = mc^2$` is supported.
```

`derivation_steps` is optional but strongly recommended. Each step needs `step_en` and `step_bn`; add `latex` when a line of algebra belongs to that step. The detail page renders them as a numbered list, the library shows a "Derivation" badge, and Fuse.js indexes the step text so students can search derivations directly.

3. Make the equation solvable. The detail page shows a calculator automatically once either route is in place:

   - **Declarative model (preferred).** Add an entry to `calculatorModels` in `lib/calculator-models.ts`, keyed by slug, with `formula`, a `unit` map covering every symbol in `variables`, and a `solve(values)` that returns a value for *every* symbol. `solve` works in the units it declares, so add alternatives to `unitChoices` when students are likely to type something else (cm instead of m, kJ instead of J).
   - **Hand-written solver.** Add a `case` to `solveEquation` in `lib/calculations.ts` for equations with bespoke wording.

   TypeScript cannot catch a symbol that is missing from `unit`, so check that every symbol in the MDX `variables:` list appears there before opening a pull request.
4. Add a simulation slug to `simulation` only when it exists in `lib/simulations.ts`.
5. Run `npm run check:models && npm run typecheck && npm run build`. `check:models` verifies that every calculator model matches its frontmatter and that each rearrangement really is the inverse of the others; Zod reports malformed frontmatter with the file path.

The title fields and summary/derivation pairs are intentionally bilingual. Write original explanations rather than copying a textbook.

## Add an experiment

Create an MDX file in the matching subject and level folder with `type: experiment`. The required frontmatter is:

```yaml
type: experiment
slug: my-experiment
title_bn: বাংলা নাম
title_en: English name
subject: physics
level: class-9-10
aim: English aim
aim_bn: বাংলা উদ্দেশ্য
apparatus: [Stand, Scale]
apparatus_bn: [স্ট্যান্ড, স্কেল]
theory: English theory
theory_bn: বাংলা তত্ত্ব
procedure: [Step one, Step two]
procedure_bn: [প্রথম ধাপ, দ্বিতীয় ধাপ]
observation_table:
  headers: [Quantity, Reading]
  rows:
    - ['1', '2']
calculation: English calculation
calculation_bn: বাংলা হিসাব
precautions: [Keep the setup aligned.]
precautions_bn: [setup aligned রাখুন।]
sources_of_error: [Timing uncertainty]
sources_of_error_bn: [timing uncertainty]
viva:
  - q: Why?
    a: Because…
    q_bn: কেন?
    a_bn: কারণ…
simulation: simple-pendulum
tags: [practical]
```

The experiment detail page automatically creates tabs for Aim, Theory, Apparatus, Procedure, Observation, Calculation and Viva, with precautions and error notes alongside.

## Add a simulation

1. Add a metadata record to `lib/simulations.ts`.
2. Add a folder under `simulations/<slug>/index.tsx` exporting `simulationMeta` and a React component. The existing wrappers use the shared `SimulationWorkbench`.
3. Add a branch to `drawSimulation`, `stateGraph`, readouts and the control panel in `components/sim/SimulationWorkbench.tsx`. Keep equations in SI units and explain any classroom approximation.
4. Add the slug to `scripts/build-search-index.mjs` so the command palette includes it.
5. If the model needs a large browser-only library, use `next/dynamic(..., { ssr: false })` as the molecule viewer does.

The shared workbench already provides play/pause, reset, speed, live readouts, Recharts graph, recorded table, CSV, screenshot and fullscreen controls.

The PhET HTML5 catalog is maintained in `content/phet-simulations.json`. Each official PhET page is embedded from its `/sims/html/<slug>/latest/<slug>_all.html` URL, so PhET's current HTML5 release is used without copying the simulation files into this repository. Legacy Java/Flash sims are intentionally excluded because they are not dependable in modern browsers. Keep the visible attribution and PhET logo intact, and follow the non-commercial license terms.

## Add a quiz

Create `content/quizzes/my-quiz.json` following this shape:

```json
{
  "slug": "my-quiz",
  "title_en": "A short quiz",
  "title_bn": "একটি ছোট কুইজ",
  "subject": "chemistry",
  "level": "class-11-12",
  "chapter": "Solutions",
  "chapter_bn": "দ্রবণ",
  "description_en": "A short description.",
  "description_bn": "সংক্ষিপ্ত বর্ণনা।",
  "questions": [
    {
      "q": "Question?",
      "q_bn": "প্রশ্ন?",
      "options": ["A", "B", "C", "D"],
      "options_bn": ["ক", "খ", "গ", "ঘ"],
      "answer": 0,
      "explanation": "Why A is correct.",
      "explanation_bn": "কেন ক সঠিক।"
    }
  ]
}
```

`answer` is a zero-based option index. Zod validates the shape at build time. The quiz runner gives instant feedback, optional timer mode, retry-wrong behaviour and local score history.

## Elementa Chemistry Lab

The lab lives behind the header button **Chemistry Lab / কেমিস্ট্রি ল্যাব** and at `/bn|/en/lab/chemistry`.
Everything it knows is content, not code:

| File | Holds |
| --- | --- |
| `data/chemicals.json` | 109 chemicals (54 on the shelf): acids, bases, salts, metals, gases, indicators, solvents |
| `data/apparatus.json` | 15 items: test tube, beaker, conical flask, measuring cylinder, burette, gas jar, evaporating dish, Bunsen burner, tripod stand, thermometer, dropper, spatula, delivery tube, test tube holder, electrolysis cell |
| `data/reactions.json` | 119 reaction rules with stoichiometry, triggers, effects, bilingual equations and observations |
| `data/experiments.json` | 11 guided experiments with bench setups, auto-checked steps, safety notes and quizzes |
| `data/elements.json` | All 118 elements as a bilingual reference drawer |

The engine in `engine/` is pure TypeScript with no React and no clock of its own, so it is fully
unit tested (`npm test`): reaction selection and chaining, mole/volume conversion, the pH and
indicator model, the heat and boiling model, colour mixing and guided-step checking.

To add chemistry you only edit JSON — a new reaction, a new guided experiment or a new chemical
never needs a component change. [`CHEMISTRY_LAB_GUIDE.md`](CHEMISTRY_LAB_GUIDE.md) documents every
field, the scoring rules that decide which reaction wins, the drop semantics of each piece of
apparatus and the safety policy the lab follows.

## GitHub push

Keep working on your current contribution branch:

```bash
git status
git add .
git commit -m "Build PhysChem Lab learning platform"
git push origin HEAD
```

Do not push this work to another branch in an Arena session.

## Vercel Hobby deployment

1. Push the branch to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository and select the Next.js framework preset.
3. Keep the default install/build settings. No environment variables are required.
4. Deploy. Vercel runs `npm install` and `npm run build`; all page content is generated from repository files.

The site is deliberately compatible with a zero-configuration Vercel Hobby deployment. `metadataBase` and sitemap URLs use `https://physchem-lab.vercel.app`; change those two public URLs if the project receives a custom domain.

## Accessibility and performance notes

The interface has visible focus states, labelled controls, keyboard-friendly dialogs, responsive tables, reduced-motion support and colour contrast tokens. Heavy R3F content is dynamically imported. MDX, equations and search records are built statically; simulation loops only run in the browser.

## Licence

See `LICENSE`. The learning notes and interface in this seed are original project material intended for educational adaptation. Third-party libraries retain their own licences.
