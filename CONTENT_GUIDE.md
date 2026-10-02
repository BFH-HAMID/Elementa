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

`summary_en`, `summary_bn`, `related`, `simulation` and `tags` improve discovery and are optional. To add a calculator, use the slug in `lib/calculations.ts`, then make sure the variable symbols match the solver.

For a chapter-level formula sheet, add `reference_formulas` entries with `label_en`, `label_bn`, `latex`, and optional bilingual notes. Use `reference_note_en` / `reference_note_bn` for shared assumptions or caveats. Set `calculator: false` when the entry is a collection rather than a single supported calculator model; the detail page then shows the formula collection without a non-working calculator.

## Experiment frontmatter

An experiment supplies bilingual versions of its aim, apparatus, theory, procedure, calculations, precautions and error sources. `observation_table` contains `headers` and a two-dimensional `rows` array. Viva items use `q`, `a`, `q_bn` and `a_bn`.

The UI intentionally displays a tabbed guide rather than a wall of text. Keep each procedure step short enough to scan on a phone. `content/practical-topics.json` supplies a bilingual school/HSC checklist for syllabus items that do not yet have a complete step-by-step guide; keep topic slugs unique and any `guide_slug` links valid.

## Quizzes

Quiz JSON is validated with Zod. Every question has parallel English/Bangla question and option fields, a zero-based `answer`, and an explanation. Four options are conventional but the schema allows any sensible number of options above two.

## Review checklist

Before merging content:

1. Check dimensional consistency and signs.
2. Check that every symbol has a readable name and unit.
3. Verify the Bangla wording with a subject teacher or fluent reviewer.
4. Add at least one assumption, limitation or likely error.
5. Run `npm run typecheck`, `npm run lint` and `npm run build`.
6. View the page at 360px width and in dark mode.
