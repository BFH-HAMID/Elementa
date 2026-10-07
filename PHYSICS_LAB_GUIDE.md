# Elementa Physics Lab — Developer & Contributor Guide

The **Elementa Physics Lab** is an interactive, browser-based virtual physics laboratory built inside Next.js 14 (App Router) + TypeScript + Tailwind. It runs entirely on client devices with zero backend, zero paid APIs, and is free to deploy on Vercel.

---

## 🌟 Overview & Capabilities

The physics lab brings real physics apparatus and phenomena into the browser with realistic physics solvers and data recording:

- **Bilingual**: Full English & Bengali (বাংলা) support across all instruments, procedures, calculations, errors, formulas, and quizzes.
- **8 Core Domains & 70+ Instruments**:
  1. **Electricity**: DC/AC sources, power supplies, SPST/SPDT switches, tap keys, fixed & decade resistors, rheostats, potentiometers, meter bridge, Post Office Box, bulbs with power ratings & burnout, ammeters, voltmeters, center-zero galvanometers, multimeters, capacitors, inductors, diodes, LEDs, transistors, transformers.
  2. **Magnetism**: Bar magnets, plotting compasses, solenoids, iron filings flux visualizers, electromagnets, deflection magnetometers (Tan-A / Tan-B), Faraday induction apparatus.
  3. **Optics**: Optical bench rails (0–150 cm), convex & concave lenses, spherical mirrors, plane mirrors, glass slabs with lateral shift, equilateral triangular prisms with dispersion, red & green lasers, white light sources, projection screens with focus blur calculation, diffraction gratings, Young's double slit slides, polarizers & analyzers.
  4. **Mechanics**: Simple pendulums, helical springs, slotted mass hangers, variable-angle inclined planes with friction, dynamics trolleys, frictionless pulleys, spring balances, analytical beam balances, ballistic projectile launchers, Atwood machines, flywheels, Newton's cradles.
  5. **Heat & Thermodynamics**: Mercury & digital thermometers, copper calorimeters, gas Bunsen burners, electrical immersion heaters, specific heat metal solid cylinders (Cu, Al, Fe, Pb, Brass), Searle's thermal conductivity apparatus.
  6. **Waves & Acoustics**: Tuning fork sets (256–512 Hz), resonance air column tubes, sonometers with movable bridges and falling paper riders, ripple tanks, audio function generators (sine, square, triangle), digital dual-channel oscilloscopes with Lissajous figures.
  7. **Measuring Tools**: Vernier calipers, micrometer screw gauges, travelling microscopes, spherometers, digital stopwatches, circular protractors with zero-error calibration and least-count calculation.
  8. **Modern Physics**: Photoelectric effect apparatus with color filters and retarding voltage, Geiger-Müller radiation counter with radioactive decay isotopes and inverse-square law, Franck-Hertz tube.

---

## 🏗️ Folder Structure

```
Elementa/
├── app/
│   ├── [locale]/lab/physics/page.tsx               # Main bilingual lab page
│   ├── [locale]/experiments/physics/[slug]/page.tsx # Guided experiment detail page
│   ├── [locale]/lab/physics/experiments/[slug]/    # Alias route
│   ├── lab/physics/page.tsx                        # Redirect helper
│   └── experiments/physics/[slug]/page.tsx         # Redirect helper
├── components/physics/
│   ├── PhysicsLab.tsx                              # Master studio container
│   ├── Workbench.tsx                               # Multi-mode drag-drop canvas
│   ├── EquipmentShelf.tsx                          # Categorized searchable shelf
│   ├── CircuitCanvas.tsx                           # SVG interactive wire routing & current flow
│   ├── OpticsBench.tsx                             # Optical bench rail & ray tracing
│   ├── MechanicsStage.tsx                          # 2D physics animation stage
│   ├── GraphPanel.tsx                              # Recharts live scatter & best-fit regression
│   ├── DataTable.tsx                               # Observation table with CSV export & stats
│   ├── ObservationPanel.tsx                        # Theory, procedure checklist & quiz
│   └── Equipment/
│       ├── EquipmentRenderer.tsx                   # Modular equipment dispatcher
│       └── MeasuringModals.tsx                     # Zoomable Vernier & Screw Gauge scales
├── engine/
│   ├── circuitSolver.ts                            # Modified Nodal Analysis (MNA)
│   ├── opticsEngine.ts                             # Snell's law, ray tracing, lens/mirror formulas
│   ├── mechanicsEngine.ts                          # Pendulum, spring, incline, projectile, Atwood
│   ├── waveEngine.ts                               # Resonance tube, sonometer, beats, CRO
│   ├── thermoEngine.ts                             # Calorimetry, Joule heating, Searle's K
│   ├── emEngine.ts                                 # Magnetism, Faraday induction, photoelectric, GM counter
│   ├── measurement.ts                              # Vernier, micrometer, noise, linear regression
│   └── physicsTypes.ts                             # Complete TypeScript data schemas
├── data/
│   ├── equipment.json                              # 70+ equipment definitions
│   └── physicsExperiments.json                     # 30 guided physics practicals
├── store/
│   └── physicsStore.ts                             # Reactive Zustand store with undo/redo
└── lib/
    ├── i18n.ts                                     # Bilingual dictionary & hooks
    └── physicsData.ts                              # Typed single entry point
```

---

## 🛠️ Physics Engine Modules

All physics engines are pure, deterministic functions with 100% test coverage under `engine/__tests__/`:

### 1. Circuit Solver (`engine/circuitSolver.ts`)
- Implements **Modified Nodal Analysis (MNA)** with linear equation solving via Gaussian elimination with partial pivoting.
- Handles series and parallel combinations, Kirchhoff's laws, multi-loop meshes.
- Iterative solving for non-linear diodes, LEDs, and BJT transistors.
- Dynamically calculates power dissipation $P = V \times I$ and triggers bulb burnout when power rating is exceeded.
- Identifies short-circuits (when currents exceed safe bounds) and open-circuits.

### 2. Optics Engine (`engine/opticsEngine.ts`)
- **Snell's Law**: $n_1 \sin \theta_1 = n_2 \sin \theta_2$, critical angle $\theta_c = \arcsin(n_2/n_1)$, and Total Internal Reflection (TIR).
- **Thin Lens & Spherical Mirror Equations**: $\frac{1}{f} = \frac{1}{v} + \frac{1}{u}$, magnification $m = -v/u$, real/virtual image positions.
- **Glass Slab**: Lateral displacement $d = t \frac{\sin(i - r)}{\cos r}$.
- **Prism Dispersion**: Angle of minimum deviation $\mu = \frac{\sin((A + \delta_m)/2)}{\sin(A/2)}$ and Cauchy dispersion relation $n(\lambda)$.
- **Wave Optics**: Young's double slit fringe width $\beta = \frac{\lambda D}{d}$, diffraction grating $d \sin\theta = n \lambda$, Malus's Law $I = I_0 \cos^2\theta$.

### 3. Mechanics Engine (`engine/mechanicsEngine.ts`)
- Simple pendulum period $T = 2\pi\sqrt{L/g}$ and numerical Verlet integration.
- Spring-mass system $F = -kx$, period $T = 2\pi\sqrt{m/k}$, static extension $\Delta x = mg/k$.
- Inclined plane acceleration $a = g(\sin\theta - \mu_k \cos\theta)$ and static friction threshold.
- Projectile motion range $R = \frac{v_0^2 \sin 2\theta}{g}$, maximum height $H = \frac{v_0^2 \sin^2\theta}{2g}$, and flight time $T = \frac{2 v_0 \sin\theta}{g}$.
- Atwood machine acceleration $a = \frac{m_1 - m_2}{m_1 + m_2}g$ and tension $T = \frac{2 m_1 m_2 g}{m_1 + m_2}$.

### 4. Wave & Acoustics Engine (`engine/waveEngine.ts`)
- Resonance tube speed of sound $v = 2f(l_2 - l_1)$ with end correction $e = 0.3d$.
- Sonometer fundamental frequency $f = \frac{1}{2L}\sqrt{\frac{T}{m}}$.
- Acoustic beats $f_{\text{beat}} = |f_1 - f_2|$ and composite envelope waveform synthesis.
- Dual-channel oscilloscope waveforms and Lissajous phase figures.

### 5. Thermodynamics Engine (`engine/thermoEngine.ts`)
- Method of mixtures $m_1 s_1 (T_1 - T_f) = (m_2 s_w + m_c s_c)(T_f - T_2)$ for metal specific heat.
- Joule's law electrical heating $H = V I t = I^2 R t$.
- Searle's apparatus thermal conductivity $K = \frac{m_w s_w (T_4 - T_3) d}{A (T_1 - T_2) t}$.
- Newton's law of cooling $T(t) = T_{\text{env}} + (T_0 - T_{\text{env}}) e^{-kt}$.

### 6. Electromagnetism & Modern Physics (`engine/emEngine.ts`)
- Tangent Law & Deflection Magnetometer $B = B_H \tan\theta$.
- Solenoid magnetic field $B = \mu_0 n I$.
- Photoelectric effect $e V_0 = h \nu - \Phi$ and Planck's constant calculation.
- Geiger-Müller radiation counter inverse square law $I \propto 1/r^2$ and exponential shielding attenuation.

---

## 📝 How to Add New Equipment (Data-Driven)

To add a new piece of equipment, open `data/equipment.json` and add an entry:

```json
{
  "id": "new-instrument-id",
  "name_en": "Digital Lux Meter",
  "name_bn": "ডিজিটাল লাক্স মিটার",
  "category": "optics",
  "domain": "optics",
  "description_en": "Measures illuminance in Lux.",
  "description_bn": "আলোক তীব্রতা লাক্সে পরিমাপ করে।",
  "icon": "sun",
  "leastCount": 1,
  "leastCountUnit": "lux",
  "defaultProperties": { "rangeLux": 2000 },
  "propertySchema": [
    {
      "key": "rangeLux",
      "name_en": "Range",
      "name_bn": "সীমা",
      "type": "number",
      "unit": "lux",
      "default": 2000,
      "min": 200,
      "max": 50000,
      "step": 100
    }
  ],
  "terminals": [
    { "id": "t1", "name": "+", "polarity": "positive", "x": 20, "y": 80 },
    { "id": "t2", "name": "-", "polarity": "negative", "x": 80, "y": 80 }
  ],
  "width": 110,
  "height": 85
}
```

No React code changes needed! The shelf and workbench will automatically display the item, render its terminals, and parse its properties.

---

## 🧪 How to Add New Guided Experiments

To add a new practical experiment, add an object to `data/physicsExperiments.json`:

```json
{
  "id": "new-experiment-slug",
  "slug": "new-experiment-slug",
  "title_en": "Measurement of XYZ Law",
  "title_bn": "XYZ সূত্র যাচাই পরীক্ষা",
  "category": "electricity",
  "domain": "electricity",
  "level": "class-11-12",
  "durationMinutes": 15,
  "aim_en": "To verify XYZ law...",
  "aim_bn": "XYZ সূত্র যাচাই করা...",
  "theory_en": "Theory explanation...",
  "theory_bn": "তত্ত্ব ও সমীকরণ...",
  "formula_latex": "Y = m \\cdot X + c",
  "formula_desc_en": "Formula description...",
  "formula_desc_bn": "সমীকরণের বিবরণ...",
  "apparatusRequired": ["battery-dc", "resistor-fixed"],
  "setup": {
    "items": [
      { "equipmentId": "battery-dc", "x": 60, "y": 60, "properties": { "voltage": 6 } },
      { "equipmentId": "resistor-fixed", "x": 220, "y": 60, "properties": { "resistance": 10 } }
    ],
    "wires": [
      { "fromItemIndex": 0, "fromTerminalId": "pos", "toItemIndex": 1, "toTerminalId": "t1", "color": "red" }
    ]
  },
  "procedureSteps": [
    { "stepNumber": 1, "instruction_en": "Connect apparatus...", "instruction_bn": "যন্ত্রপাতি সাজান..." }
  ],
  "precautions_en": ["Keep wires tight."],
  "precautions_bn": ["তারের সংযোগ শক্ত রাখুন।"],
  "dataColumns": [
    { "key": "obsNo", "label_en": "Obs #", "label_bn": "নং" },
    { "key": "valX", "label_en": "X (unit)", "label_bn": "X", "unit": "V" }
  ],
  "theoreticalTarget": {
    "formulaName": "Y = m * X",
    "expectedConstant": 10.0,
    "expectedConstantUnit": "Ω",
    "xColumn": "valX",
    "yColumn": "valY"
  },
  "quiz": [
    {
      "id": "q1",
      "question_en": "Question in English?",
      "question_bn": "বাংলায় প্রশ্ন?",
      "options": [
        { "id": "a", "text_en": "Option A", "text_bn": "বিকল্প ক" },
        { "id": "b", "text_en": "Option B", "text_bn": "বিকল্প খ" }
      ],
      "correctOptionId": "a",
      "explanation_en": "Explanation...",
      "explanation_bn": "ব্যাখ্যা..."
    }
  ]
}
```

---

## 🚀 GitHub to Vercel Deployment Guide

1. **Commit & Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Elementa Physics Lab"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New Project"** -> **"Import Git Repository"**.
   - Select `Elementa` repository.

3. **Configure Build Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - No environment variables or databases required!

4. **Deploy**:
   - Click **Deploy**. Vercel will build all static pages and deploy globally on Edge CDN.
