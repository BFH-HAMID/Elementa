# Circuit Lab — drones, RC vehicles and the advanced-project trainer

**Open:** `/en/lab/circuit` or `/bn/lab/circuit` → **Advanced projects** (or the toolbar's advanced-project menu). This is a browser-only educational workbench. You can edit the actual wired example circuits, run their approximate electronics in the existing worker, and explore a *separate*, circuit-linked 2-D mission model. No real radio, flight firmware, propeller, camera footage or GPS hardware is operated by this site.

**বাংলায়:** `/bn/lab/circuit` → **অ্যাডভান্সড প্রজেক্ট** খুলুন। পছন্দের সার্কিটের সংযোগ, ধাপে ধাপে তৈরির নির্দেশনা এবং সিমুলেশন একই পেজে আছে। এটি শিক্ষার জন্য—বাস্তব ড্রোন ওড়ানোর ফার্মওয়্যার বা লাইভ ভিডিও নয়। বাস্তবে বানানোর আগে যন্ত্রাংশের ডেটাশিট ও নিরাপত্তা নিয়ম যাচাই করুন।

## Parts and electrical model

The searchable **Drone & robotics** palette contains:

| Part | Lab model |
| --- | --- |
| F4 flight controller | 5 V logic rail, arm/disarm, four throttle outputs and receiver input. GPS projects explicitly enable a *synthetic assisted link-loss throttle* only while a wired GPS board is powered. With no assistance/GPS, the output cuts. The route-home path exists only in the separate mission model, not PID/autopilot firmware or an SBUS decoder. |
| 30 A ESC × 4 | 2S–3S battery input, control input, three phase terminals; speed and current are approximations, not BLDC commutation. Motor rotation needs *all three* phase connections. |
| PDB / 5 V BEC | Battery-distribution rails, regulated 5 V rail and approximate overhead/limits. |
| 1S protection board | Passes the output when in the 3.0–4.25 V range; opens on undervoltage, overvoltage or fault. **Not a charger**; do not put 2S/3S packs on its input. |
| RC receiver | Simulated throttle, steering, link state and channel outputs; link loss propagates to controller/motors. Not actual RF/SBUS decoding. |
| FPV camera + 5.8 GHz VTX | Powered, connected video-signal check; the displayed FPV pane is synthetic, **not camera footage**. |
| SiK telemetry | Powered UART input/output status; not an RF stack. |
| 2205 brushless motor | Three-phase connection check and simplified throttle-driven load. |
| 2S / 3S LiPo | Nominal-voltage adjustable DC source, approximate series resistance/current cap; capacity is used in the mission trainer. Not a cell chemistry, balancing or charging model. |

The existing library supplies the ESP32, TB6612 H-bridge, brushed motors, IMU, GPS, ultrasonic ranger, BMP280, OLED, voltage regulator, servo and passives. Module voltage/polarity and common GND are still essential. When a bare 3.3 V BMP280 or OLED is used with the drone's 5 V PDB, the template includes a 3.3 V AMS1117 and output decoupler.

## 20 projects

All 20 have a loadable *wired* bench, searchable English/Bangla name, overview, build procedure, expected results and safety notes. They are trainer **templates**, not complete airworthy builds or firmware releases.

| Drones (9) | RC rovers (8) | Other (3) |
| --- | --- | --- |
| FPV + GPS quad | RC camera car | GPS survey boat |
| GPS waypoint quad | GPS route car | RC camera boat |
| Altitude-hold trainer | Collision-avoid car | 1S protection test bench |
| Racing FPV quad | FPV night rover | |
| Survey quad with gimbal | Geofence car | |
| Obstacle-avoid quad | Delivery rover | |
| Return-home/failsafe quad | IMU stability rover | |
| Precision-landing trainer | Speed-logging rover | |
| Quad power monitor | | |

### Learning workflow

1. Choose a build on the **Advanced projects** tab. Click **Load wired build**. The existing bench is replaced; save or export your work first. Use the **Guide / Procedure** side of the panel to follow the English or Bangla steps and check the BOM and safety note.
2. Press **Run** in the main Circuit Lab toolbar. The SVG bench and **Check** tab show pin power/current and potential damage. The advanced mission panel automatically checks its required harness and power; if there is a problem, expand **Check wiring & power**. Deliberately remove a motor phase, video line or supply wire to see the difference.
3. On **Mission simulator**, use throttle, forward and steering sliders. For a drone, first click **Arm (training)** after power/link/required-wiring checks pass; disarm before editing. Try wind, GPS loss, obstacle toggles and **Drop RC link**. The 2-D position, map, estimated battery usage and synthetic FPV image depend on observed power, receiver, motor, camera, GPS and sonar status *plus* the separate teaching model.
4. In the 1S bench, vary the battery between 2.7–4.3 V in 0.01 V increments or inject a fault. The simulated LED/current drops when the protector opens. Do not treat this as charging guidance.
5. Press **Stop** to stop the electronics worker. Changing templates resets the mission state. Existing file/export, schematic and undo/redo controls remain available for circuit edits.

**বাংলা দ্রুত শুরু:** প্রজেক্ট বেছে **তারযুক্ত বিল্ড লোড** → নির্দেশনার ধাপ/নিরাপত্তা পড়ুন → মূল টুলবারে **চালু** → মিশন সিমুলেটরে থ্রটল/দিক পরিবর্তন করুন। ড্রোনে আগে **আর্ম (শিক্ষামূলক)** চাপুন। GPS বন্ধ, বাধা যোগ, বা RC সংযোগ বিচ্ছিন্ন করে কী হয় দেখুন। প্রকল্প বদলালে চলমান সিমুলেশন থামে; অসমাপ্ত কাজ আগে সংরক্ষণ করুন।

### What is simulated versus *not* simulated

- Electronics: a DC/MNA-based approximation with regulated power, logic signal/pin checks, approximate loads and overload limits. Motor speed and pack current *react to actual wiring and bench settings*. Missing video data removes VTX signal; link loss stops the motor command. This does not verify PCB layout, RF interference, actual high-current traces or battery temperature. The training-only GPS link-loss throttle is **not** proof a physical FC can return home; the route animation additionally needs observed motor drive and a synthetic GPS fix.
- Mission: a deterministic bounded planar teaching model (simplified thrust/drag and wind for drones; rolling speed/steering for rovers; boat drag). It advances with **Run** and uses circuit power, motor duty, receiver link, camera/VTX and optional sensors; estimated coordinates, distance, SOC, path and FPV graphic are *synthetic*. Waypoint, return-home, geofence and obstacle behaviours are demonstrations **inside the trainer**, not firmware programmed onto the FC or ESP32.
- Powered IMU, BMP280 and sonar modules show their **inspector-adjustable sample values** in the mission panel. GPS availability and sonar power gate the scene's simplified routing/avoidance; pressure and tilt readings are **not fused** into its dynamics, and the sample sonar range is not physical terrain ranging.
- The rover example's included Arduino-subset sketch is a differential-drive RC **mixer only**. GPS navigation, IMU fusion, obstacle avoidance, servo control, MAVLink, GPS fixes, SBUS, PID stabilization and real RF/FPV transmission are **not** implemented as real microcontroller protocols. A learner must design, test and validate these separately for a physical vehicle.

### Safety before any physical build

Remove propellers while wiring and bench-testing. Use a correctly rated 2S/3S pack with proper fusing, cell balancing, and a certified LiPo charger, never the on-screen 1S protector as a charger. Verify polarity and regulator output with a meter **before** connecting flight controller, bare 3.3 V modules or camera. Ensure a common ground, heat-sink and size high-current traces/connectors for measured peak current; follow motor/ESC and radio/transmitter datasheets and local flight rules. Never fly from a browser model without independent firmware, failsafe and hardware testing.

## Implementation and verification

- Definitions/art: `components/circuit-lab/parts/robotics.ts`, `parts/renderers.tsx`, `parts/registry.ts`.
- Electrical behaviour: `simulator/solver.ts` and `simulator/engine.ts` (existing Web Worker via `useSimEngine.ts`).
- Wired examples: `projects/catalog-advanced.ts`; checklist: `projects/validateAdvanced.ts`.
- 2-D mission model: `simulator/vehicleSim.ts`; browser controls, FPV graphic and instructions: `advanced/`.
- Integration: `store/circuitStore.ts`, `toolbar/Toolbar.tsx`, `panels/BottomPanel.tsx`, and `CircuitLab.tsx`.
- Tests: `__tests__/advanced-projects.test.ts` verifies all 20 real pins/harnesses, steady operating points and motor/video/RC/1S effects; `__tests__/vehicleSim.test.ts` verifies battery, navigation, GPS/link loss, collisions and power-off bounds. Run `npm run typecheck && npm run lint && npm test && npm run build`.
