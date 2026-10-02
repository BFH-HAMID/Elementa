# Content guide

PhysChem Lab content is authored as small, reviewable repository files. The site does not call a CMS or database at runtime.

## Editorial principles

- Explain one relationship at a time and name the assumptions.
- Keep the English and Bangla fields conceptually equivalent without translating technical terms unnaturally.
- Use original wording; do not paste NCTB, National University or commercial textbook prose.
- Prefer SI units in equations and identify any classroom unit conversion.
- Link a concept to a practical observation or a simulation when that connection is meaningful.
- Mark Honours-level work explicitly and avoid presenting an approximation as a universal law.

## Equation frontmatter

`lib/schemas.ts` is the source of truth. Required fields are:

- `type: equation`
- `slug`, `title_bn`, `title_en`, `subject`, `level`, `chapter`, `latex`
- `variables`: `symbol`, `name`, `unit`, `si_unit`; `name_bn` is recommended
- `derivation`; `derivation_bn` is strongly recommended

`summary_en`, `summary_bn`, `related`, `simulation` and `tags` improve discovery and are optional.

### Calculators

An equation becomes interactive as soon as it has a solver. Prefer the declarative route: add an entry to `calculatorModels` in `lib/calculator-models.ts`, keyed by the slug.

```ts
'liquid-column-pressure': {
  formula: 'P = hρg',
  unit: { P: 'Pa', h: 'm', 'ρ': 'kg/m³', g: 'm/s²' },
  solve: (v) => ({
    P: v.h * v['ρ'] * v.g,
    h: v.P / (v['ρ'] * v.g),
    'ρ': v.P / (v.h * v.g),
    g: v.P / (v.h * v['ρ'])
  })
}
```

Rules that keep a model honest:

- Every symbol in the MDX `variables:` list must have an entry in `unit`, and the strings must match the declared `unit` exactly — that is what picks the dropdown of alternative units.
- `solve` receives the known values already converted into the declared units and must return a value for *every* symbol, including the ones it was given. The UI then simply reads the requested unknown.
- Angles arrive in degrees because the frontmatter unit is `°`; convert with `deg()` and return with `toDeg()`.
- Add a `steps(v, out, unknown)` override when the generic substitution list would mislead — for example when the rearrangement has no closed form and is solved numerically.

`npm run check:models` enforces the parts that TypeScript cannot see: it fails when a symbol is missing from `unit`, when a unit string disagrees with the frontmatter, or when a rearrangement is not the true inverse of the others. Run it whenever you touch `lib/calculator-models.ts`.

Older equations use hand-written `case` blocks in `lib/calculations.ts` instead. That is fine for one-off wording, but new equations should use the declarative registry so all rearrangements sit side by side and can be reviewed together.

Set `calculator: false` when an entry is a chapter-level collection rather than a single relation; the detail page then shows the formula collection without a non-working calculator.

### Step-by-step derivations

Every equation entry should carry a `derivation_steps` array that walks from a stated starting point to the featured relation. Each step is an object:

- `step_en` (required): one sentence of English prose, written as an instruction ("Substitute v = u + at…").
- `step_bn` (required): the Bangla equivalent, conceptually identical but natural to read aloud.
- `latex` (optional): the single line of algebra belonging to that step.

Keep to three or four steps. The first step should state the definition or law being used; the last should land on the equation displayed in `latex` at the top of the file. The detail page renders the steps as a numbered list, `EquationCard` adds a "Derivation" badge, and `EquationLibrary` indexes the step text with Fuse.js, so bilingual phrasing matters for search as well as for reading.

Dimensional consistency is checked at review time: if a step introduces a new symbol, that symbol should either appear in `variables` or be a standard constant such as G, R, k_B or c.

For a chapter-level formula sheet, add `reference_formulas` entries with `label_en`, `label_bn`, `latex`, and optional bilingual notes. Use `reference_note_en` / `reference_note_bn` for shared assumptions or caveats. Set `calculator: false` when the entry is a collection rather than a single supported calculator model; the detail page then shows the formula collection without a non-working calculator.

## Experiment frontmatter

An experiment supplies bilingual versions of its aim, apparatus, theory, procedure, calculations, precautions and error sources. `observation_table` contains `headers` and a two-dimensional `rows` array. Viva items use `q`, `a`, `q_bn` and `a_bn`.

The UI intentionally displays a tabbed guide rather than a wall of text. Keep each procedure step short enough to scan on a phone. `content/practical-topics.json` supplies a bilingual school/HSC checklist for syllabus items that do not yet have a complete step-by-step guide; keep topic slugs unique and any `guide_slug` links valid.

## Quizzes

Quiz JSON is validated with Zod. Every question has parallel English/Bangla question and option fields, a zero-based `answer`, and an explanation. Four options are conventional but the schema allows any sensible number of options above two.

## Review checklist

Before merging content:

1. Check dimensional consistency and signs, step by step through the derivation.
2. Check that every symbol has a readable name and unit.
3. Verify the Bangla wording with a subject teacher or fluent reviewer.
4. Add at least one assumption, limitation or likely error.
5. Confirm the last derivation step reproduces the headline `latex` exactly.
6. Run `npm run typecheck`, `npm run lint` and `npm run build`.
7. View the page at 360px width and in dark mode.
