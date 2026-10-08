# Circuit Lab — developer guide

The Circuit Lab is a browser electronics workbench inside Elementa's lab section.
It lives at `/{locale}/lab/circuit` (and `/lab/circuit` redirects to the default locale).
Everything runs in the browser: no backend, no database, no paid APIs, no new npm
dependencies. It deploys as part of the existing Next.js app on Vercel's free tier.

---

## 1. What is included

| Area | Status |
|---|---|
| Parts library (searchable, 8 categories, ≥40 parts with pinouts, ratings and info cards) | Done |
| Breadboards (full/half, rail + strip connectivity), perfboard, stripboard, PCB pad area | Done (connectivity; no PCB trace routing view yet) |
| Drag & drop from library, move, rotate (R), flip (F), duplicate, delete, multi-select | Done |
| Undo / redo (40 steps), snap to grid, snap to breadboard holes | Done |
| Pin → pin wires, colours, curved routing, draggable bend points, delete | Done |
| Pan / zoom (wheel, pinch, middle-drag, Space+drag), fit to screen, minimap | Done |
| Pin hover highlight with function tooltip (e.g. `GPIO21 · I²C SDA`) | Done |
| Context menu (right-click, long-press), keyboard shortcuts, help overlay | Done |
| DC MNA + transient (C/L companion models), diodes/LEDs, BJT, MOSFET, op-amp, regulators | Done |
| Digital logic (74HC00/04/08/595), 555 timer, L293D / ULN2003, relay, switches | Done |
| Sensors and modules (DHT, HC-SR04, PIR, IR, MPU, BMP, soil, LDR, MQ-2, OLED, LCD, I²C LCD, 7-seg, buzzer, servo, motor, NRF24, HC-05, RC522, GPS) | Modelled at the level needed for the bundled examples; sketch APIs cover the common libraries |
| Simulation in a Web Worker, main-thread fallback | Done |
| LED brightness ∝ current, spinning motor, servo angle, buzzer rings, LCD/OLED text, 7-seg, current-flow animation | Done |
| Short circuit / reverse polarity / overcurrent warnings with burn-out and smoke | Done |
| Sketch editor (line numbers, Tab, auto-indent), Arduino-style C++ subset, Run/Stop/Reset | Done |
| Serial monitor | Done |
| Multimeter (V / A / Ω, unpowered-circuit ohmmeter), oscilloscope (2 channels), logic analyser (8 channels) | Done |
| 12 example projects with bilingual steps, wiring and explanation | Done |
| Save (browser) / load, export & import JSON, share link (`?circuit=`), PNG and SVG export | Done |
| Bill of materials, netlist, rule-based “Check circuit” validator | Done |
| Schematic view and PCB mode (synced) | **Not included yet.** The data model keeps wires and pins independent of the breadboard view, so a schematic renderer can be added on top of `components/circuit-lab/simulator/solver.ts`'s topology. |
| Monaco editor | **Not used.** A lightweight editor keeps the bundle small. See §7 for the swap path. |

---

## 2. Install and run

Requirements: Node 20 LTS and npm (the same toolchain the existing Elementa build uses).

```bash
npm install
npm run dev          # http://localhost:3000/en/lab/circuit  (or /bn/lab/circuit)
```

Quality gates used for this module:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run test         # vitest (solver, registry, store, geometry, examples)
npm run build        # prebuild regenerates public/search-index.json, then next build
```

---

## 3. File structure

```
app/[locale]/lab/circuit/page.tsx      Route: metadata, ViewTracker, Suspense, JSON-LD
app/lab/circuit/page.tsx               Legacy redirect → default locale
store/circuitStore.ts                  zustand store: bench, history, selection, sim frame, autosave

components/circuit-lab/
  CircuitLab.tsx                       Root layout (palette | bench | inspector | bottom panel)
  CircuitLabLoader.tsx                 next/dynamic(ssr:false) wrapper
  types.ts                             Data model (parts, placed components, wires, sim frames)
  geometry.ts                          Transforms, snapping, wire paths, viewport maths
  parts/
    registry.ts                        ★ Data-driven part library (add parts here)
    holes.ts                           Breadboard / perfboard hole generators + connectivity keys
    renderers.tsx                      ★ SVG artwork per part family (no external images)
  simulator/
    solver.ts                          Topology (union-find) + MNA solver + device models
    engine.ts                          Tick loop, MCU VMs, instruments, burn-out memory, frames
    mcu.ts                             Sketch transpiler (C subset → JS generators) + VM + host API
    simWorker.ts                       Web Worker entry (runs engine.ts)
    useSimEngine.ts                    React hook: worker lifecycle, 30 Hz ticks, store updates
  canvas/BenchCanvas.tsx               SVG workspace: pointer handling, wires, parts, minimap, menu
  palette/PartPalette.tsx              Search (fuse.js), categories, drag source / tap-to-add
  inspector/Inspector.tsx              Properties, info card, pinout, ratings, wire colour, sketch
  toolbar/Toolbar.tsx                  Run/Stop/Reset, edit tools, view, file and share actions
  panels/CodeEditor.tsx                Lightweight sketch editor
  panels/BottomPanel.tsx               Serial, examples, BOM & netlist, check, guide
  projects/examples.ts                 ★ Example projects (data + sketches + bilingual text)
  lib/i18n.ts                          UI strings (en / bn) and the useCircuitI18n hook
  lib/analysis.ts                      BOM, netlist, Check-circuit validator
  lib/snap.ts                          Grid and hole snapping
  lib/exporters.ts                     Share URLs, JSON files, SVG and PNG export
  lib/shortcuts.ts                     Global keyboard shortcuts
  __tests__/                           Vitest suites (see §8)
```

The lab's other integration points:

- `components/layout/Navbar.tsx` — “Circuit Lab” link (desktop, compact icon, mobile menu).
- `messages/en.json`, `messages/bn.json` — `nav.circuitLab`.
- `scripts/build-search-index.mjs` — a `lab` record for `/lab/circuit`.
- `app/sitemap.ts` — the route is listed.
- `vitest.config.ts` — `components/**/*.test.ts` is included.

---

## 4. How it works

### 4.1 Data model

Everything on the bench is data (`types.ts`):

- A **`PartDef`** (registry) has an id, category, renderer `family`, pin map, property
  schema with defaults, an electrical **`model`** (for example `{ type: 'led' }`), and
  info-card text.
- A **`PlacedComponent`** is an instance: position, rotation (0/90/180/270), flip, property
  values, and optional sketch `code`.
- A **`PlacedWire`** connects two `{ compId, pinId }` endpoints, with a colour and
  waypoints.

Units: **10 world units = 2.54 mm = one breadboard hole pitch**. Pin coordinates are
multiples of 10 so that they land on holes.

### 4.2 Connectivity

`buildTopology()` (solver.ts) merges pins into electrical nodes with union-find:

1. Wires merge their two endpoints.
2. Breadboard and perfboard holes merge by group key (`holes.ts`): `h{col}{a–e}` and
   `h{col}{f–j}` per column, `r+{n}` / `r-{n}` rails, `s{row}_{col}` strips. Perfboard
   pads are isolated.
3. A component pin that sits within 2.5 units of a hole joins that hole (**geometric
   insertion**). Hole snapping on drop and on release makes this happen naturally.
4. Pins with kind `gnd` on the same part are one net (for example, all GND pins of a
   board, or the common cathodes of a 7-segment display).
5. The ground reference is a `gnd-symbol`, else a source's negative terminal, else a
   board GND pin.

Only nets that something connects to get a solver node, so unused breadboard holes cost
nothing.

### 4.3 Solver

`solveStep()` builds an MNA system each Newton iteration:

- **Linear elements** stamp conductances and sources. Capacitors and inductors use
  backward-Euler Norton companions (`dt = 0.2 ms`), so DC and transient share one code path.
- **Nonlinear devices** are linearised per iteration: Shockley diodes and LEDs (LED
  saturation current chosen so Vf matches the datasheet value at 20 mA), zener breakdown,
  BJTs (active ↔ saturation with a mode check), MOSFETs (smooth switch), op-amps (linear ↔
  rail clamp).
- **Digital and behavioural parts** (gates, 595, 555, drivers, MCU pins) are evaluated once
  per step from the previous voltages and presented as a source behind an output
  impedance.
- **Sources** have internal resistance. Bench supplies and USB fold back under current limit.
- Overcurrent, reverse polarity, over-power and short circuits set a burn-out reason on the
  component. A burnt component is removed from the circuit and drawn with smoke.

Solved step by step: each tick runs up to 160 steps of 0.2 ms, the number needed to cover
the wall-clock time times the speed factor. Non-reactive circuits take one step per tick.

### 4.4 Microcontroller sketches

`mcu.ts` transpiles an Arduino-style C++ subset to JavaScript:

- `#define` becomes `const`, types are removed, arrays are converted, and `&` and `->` are
  dropped.
- Every user function and `delay()` / `delayMicroseconds()` call is a **generator**.
  `delay()` yields to the scheduler, so the sketch runs in simulated time.
- Class shims: `Servo`, `DHT`, `LiquidCrystal`, `LiquidCrystal_I2C`, `Adafruit_SSD1306`,
  `Adafruit_BMP280`, `Stepper`. Each one binds to the component wired to the pin it is
  constructed with (for example, a DHT is found by its DATA net). Unwired devices behave
  as unavailable (NaN readings).
- Board pins are read and driven through the solver. A PWM output switches between 0 and V
  inside each 2 ms period, and LED glow is averaged over the tick.

Supported core: `pinMode`, `digitalWrite`, `digitalRead`, `analogWrite`, `analogRead`,
`delay`, `delayMicroseconds`, `millis`, `micros`, `tone`, `noTone`, `pulseIn`, `map`,
`constrain`, `min`, `max`, `abs`, `random`, `Serial.begin/print/println`, `ledcSetup/AttachPin/Write`,
`dacWrite`, plus the device classes above.

### 4.5 Rendering

All art is SVG generated by `renderers.tsx`, one renderer per `family`. Parts are memoised,
so only moved or updated parts re-render. Wires are drawn as quadratic arcs, or as rounded
polylines when they have bend points. The canvas applies `translate · rotate · flip` in the
same order as `transformPoint()`, so hit-testing and drawing agree.

### 4.6 Threading

`useSimEngine()` posts the bench to `simWorker.ts` about every 33 ms while running (every
120 ms when stopped, so meters and LEDs still update after edits) and writes each frame to
the store. If the worker cannot start, the same `CircuitEngine` runs on the main thread.

---

## 5. Adding a component

1. **Describe it** in `parts/registry.ts`. Add an object to the right list (`boards`,
   `passives`, `semiconductors`, `ics`, `sensors`, `power`, `tools`, or `prototyping`):

   ```ts
   {
     id: 'my-sensor',                    // unique, kebab-case
     category: 'sensors',
     family: 'module',                   // renderer family (see types.ts PartFamily)
     name: 'My sensor',
     partNumber: 'MS-100',
     w: 60, h: 50,                       // body box; 10 units = 2.54 mm
     pins: [
       P('vcc', 'VCC', 10, 50, 'vcc', undefined, '3.3–5 V'),
       P('gnd', 'GND', 20, 50, 'gnd', undefined, 'GND'),
       P('out', 'OUT', 30, 50, 'io', undefined, 'Analog output'),
     ],                                  // pin coordinates: multiples of 10
     props: [prop('value', 'Reading', { min: 0, max: 100, unit: '%' })],
     defaults: { value: 50 },
     model: { type: 'sensor', variant: 'mq' },   // electrical model (see SimModel)
     description: 'What it is and how it is wired (≥ 20 characters).',
     ratings: ['VCC 3.3–5 V', 'Max 20 mA'],
   }
   ```

2. **Give it an electrical behaviour** in `simulator/solver.ts`. Add a case in
   `buildSensor()` (for modules) or in `buildComponent()` (for new `SimModel` types). Use
   `addResistor`, `addDrive`, `addPullDown`, or a custom `ctx.elements.push({ stamp, post,
   mode })` element. Read inputs with `pv(ctx, nodeOf(ctx, comp.id, 'pin'))` (previous step)
   or `xv(node, x)` inside a stamp (current iterate). For a new model type, add it to
   `SimModel` in `types.ts`.

3. **Draw it** in `parts/renderers.tsx`. Use an existing `family` if one fits; otherwise add a
   `case` in `PartArt`. Draw in part-local coordinates and place pins with `pinsOf()` so
   hover and connection highlights work.

4. **Test it.** `__tests__/geometry.test.ts` checks pin uniqueness and documentation for
   every part automatically. Add a behaviour test to `engine.test.ts` if the part has a
   numeric result (for example, “a 5 V supply through this part gives X mA”).

For a sketch-level API (a new Arduino library), add a class shim in `mcu.ts → buildApi()` and
a case to the transpiler’s `CLASS_NAMES` list. Bind it to a device with `host.attached(pin,
devicePins, [defIds])`.

## 6. Adding an example project

Add an object to `projects/examples.ts` and append it to `EXAMPLE_PROJECTS`:

- `components`: placed parts with full `props` (use `C(id, partId, x, y, props, sketch)`).
- `wires`: `W(id, 'partId.pinId', 'partId.pinId', colour)`. Use the pin ids from the registry
  (`uno.D13`, `esp.3V3`, `bb.h5a`).
- `steps`, `explanation`, `summary`, `title`: each is `{ en, bn }`.

Breadboard placement is computed with `placeOnHole(partId, pinId, column, row)`, so a part
placed that way is guaranteed to insert into the hole. The engine tests run every example and
check for NaN.

---

## 7. Editor and dependencies

The sketch editor is a textarea with a highlighted overlay, line numbers, Tab indentation and
auto-indent. It has no dependencies. To use Monaco instead:

```bash
npm install @monaco-editor/react
```

Then replace `panels/CodeEditor.tsx` with a `dynamic(() => import('@monaco-editor/react'),
{ ssr: false })` wrapper that keeps the same props (`value`, `onChange`, `errors`, `label`). Monaco is large,
so keep it lazy-loaded (as above) and check the route's bundle in `npm run build` output.

---

## 8. Tests

```bash
npx vitest run components/circuit-lab
```

- `engine.test.ts` — DC divider, LED current at 220 Ω on 5 V, reverse LED, RC transient,
  blink with serial output, syntax error reporting, every example simulating without NaN.
- `geometry.test.ts` — transforms, grid snapping, wire paths, registry invariants (≥40 parts,
  8 categories, unique pin ids, documented parts), hole-group connectivity, hole snapping.
- `store.test.ts` — undo/redo, duplicate keeps internal wires, rotation cycles, examples load
  with a non-empty BOM, the Check-circuit validator flags a missing GND, and the Uno blink
  example lights its LED through breadboard holes.

---

## 9. Deploying on Vercel (free tier)

The lab is an ordinary route in the Next.js app, so deployment is unchanged.

1. Push the branch to GitHub.
2. In Vercel, **Add New → Project** and import the repository. Framework preset: **Next.js**.
   Build command: `npm run build` (default). Output: default. Use Node 20.x.
3. Deploy. Preview deployments are created automatically for each branch.
4. Check the lab at `https://<your-domain>/en/lab/circuit` and `/bn/lab/circuit`.

Notes for the free tier:

- Everything is static or client-side. The simulator runs in the visitor's browser, so there are
  no serverless invocations for it.
- The Web Worker is built as a separate chunk by webpack (`new Worker(new URL(...))`). No
  configuration is needed.
- Shared links are self-contained (`?circuit=` carries the project as base64url JSON). They
  need no storage.
- Share links grow with the project. Very large benches (hundreds of parts) produce links that
  some chat apps truncate; use **Export file** for those.

---

## 10. Known limitations

- Schematic view and PCB mode are not implemented yet (see §1).
- Component models are simplified where real devices are complex: op-amp gain is fixed, MOSFETs
  use a smooth switch model, the L293D omits its internal clamp diodes, and the stepper motion is
  set by the sketch rather than simulated. The solver is educational, not a sign-off tool.
- Sensor and module behaviour comes from the bench properties (temperature, distance, moisture)
  and the sketch’s library calls, not from physical sensing.
- Stripboard cuts are not modelled; a stripboard is one set of strips.
- The ground-reference rule is simple: the first source or board GND defines 0 V. The Check tab
  reports boards and parts whose GND is not wired.
- The sketch subset is documented in §4.4. Unsupported C++ (pointers, interrupts, raw Wire
  register access, WiFi/BLE stacks) reports an error instead of running.

---

## 11. Accessibility and theming

- Toolbar buttons, palette and inspector use labelled controls; the bench has `role="application"`
  and an accessible name. Keyboard shortcuts cover the common edits (see the Help dialog and the
  Guide tab).
- Colours come from the site’s CSS variables and the `dark` class, so the lab follows the site
  theme. Canvas colours are chosen for contrast on both light and dark backgrounds.
- Animations (current flow, smoke, buzzer rings) are cosmetic. They do not change the simulation.
