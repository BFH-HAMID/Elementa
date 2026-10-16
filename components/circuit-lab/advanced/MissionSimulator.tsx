'use client';

/** A guided mission surface linked to the ACTUAL circuit frame. All graphics
 * are local SVG; the camera pane is synthetic, with no webcam/RF/GPS access. */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Battery, Compass, Crosshair, MapPin, Pause, Play, Radio, RotateCcw, ShieldCheck, VideoOff, Zap } from 'lucide-react';
import { useCircuitStore } from '@/store/circuitStore';
import { useCircuitI18n } from '../lib/i18n';
import type { AdvancedProject } from '../projects/catalog-advanced';
import { inspectAdvancedBuild } from '../projects/validateAdvanced';
import { HOME, OBSTACLE, initialMission, stepMission, type BenchObservation, type MissionControls, type MissionState, type MissionStatus } from '../simulator/vehicleSim';
import { cn } from '@/lib/utils';

const STATUS: Record<MissionStatus, { en: string; bn: string }> = {
  ready: { en: 'Ready', bn: 'প্রস্তুত' }, moving: { en: 'Moving', bn: 'চলছে' }, hovering: { en: 'Hovering', bn: 'স্থির উড়ছে' },
  holding: { en: 'Altitude hold', bn: 'উচ্চতা ধরে আছে' }, avoiding: { en: 'Avoiding obstacle', bn: 'বাধা এড়াচ্ছে' },
  returning: { en: 'Return to home', bn: 'বাড়ি ফিরছে' }, landing: { en: 'Landing / failsafe', bn: 'অবতরণ / ফেইলসেফ' },
  'gps-lost': { en: 'GPS lost · hold', bn: 'GPS নেই · থেমে আছে' }, 'link-lost': { en: 'Radio lost · stop', bn: 'রেডিও নেই · থামুন' },
  'low-battery': { en: 'Low battery · stop', bn: 'ব্যাটারি কম · থামুন' }, collision: { en: 'Obstacle · stop', bn: 'বাধা · থামুন' },
  arrived: { en: 'At waypoint', bn: 'লক্ষ্যে পৌঁছেছে' }, 'no-power': { en: 'Power disconnected', bn: 'বিদ্যুৎ বিচ্ছিন্ন' }
};

function observe(project: AdvancedProject, frame: NonNullable<ReturnType<typeof useCircuitStore.getState>['frame']>, harnessOK: boolean): BenchObservation {
  const engines = project.kind === 'drone' ? ['motor1','motor2','motor3','motor4'] : ['left','right'];
  const speeds = engines.map((id) => frame.components[id]?.speed ?? 0);
  return {
    power: harnessOK && Boolean(frame.components.pdb?.powered) && !frame.isShortCircuit && !frame.components.bat?.burnt,
    actuator: speeds.reduce((sum, v) => sum + v, 0) / engines.length,
    sourceCurrent: Math.abs(frame.sourceCurrents.bat ?? 0),
    gpsPowered: Boolean(frame.components.gps?.powered), sonarPowered: Boolean(frame.components.sonar?.powered),
    receiverLinked: Boolean(frame.components.rx?.on),
    cameraReady: Boolean(frame.components.cam?.powered && frame.components.vtx?.on)
  };
}

export function MissionSimulator({ project, active }: { project: AdvancedProject; active: boolean }) {
  const { locale } = useCircuitI18n();
  const bn = locale === 'bn';
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const frame = useCircuitStore((s) => s.frame);
  const running = useCircuitStore((s) => s.running);
  const battery = components.find((c) => c.id === 'bat');
  const capacity = Number(battery?.props.mah ?? 2200);
  const imu = components.find((c) => c.id === 'imu');
  const baro = components.find((c) => c.id === 'baro');
  const sonar = components.find((c) => c.id === 'sonar');
  const receiver = components.find((c) => c.id === 'rx');
  const armed = Boolean(components.find((c) => c.id === 'fc')?.props.armed);
  const throttle = Number(receiver?.props.throttle ?? 0);
  const steering = Number(receiver?.props.steering ?? 0);
  const link = Boolean(receiver?.props.link);
  const issues = useMemo(() => active ? inspectAdvancedBuild(project, components, wires, frame) : [], [project, active, components, wires, frame]);
  const [world, setWorld] = useState<MissionState>(() => initialMission(project));
  const [forward, setForward] = useState(45);
  const [wind, setWind] = useState(0);
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [obstacle, setObstacle] = useState(project.mode === 'avoid');
  const [holdAltitude, setHoldAltitude] = useState(project.id === 'drone-precision-landing' ? 2 : 6);
  const [expandedIssues, setExpandedIssues] = useState(false);
  const ready = active && frame !== null && issues.length === 0;

  // Read live frame/receiver values from the store *inside* each tick. React
  // receives new frames at ~30 Hz; using `frame` as an effect dependency would
  // continually recreate a 100 ms interval and prevent motion altogether.
  useEffect(() => {
    if (!active || !running || project.kind === 'bench') return;
    const timer = window.setInterval(() => {
      const st = useCircuitStore.getState();
      if (!st.frame) return;
      const rec = st.components.find((c) => c.id === 'rx');
      const batt = st.components.find((c) => c.id === 'bat');
      const connected = inspectAdvancedBuild(project, st.components, st.wires, st.frame).length === 0;
      const measured = observe(project, st.frame, connected);
      const controls: MissionControls = {
        throttle: Number(rec?.props.throttle ?? 0), steering: Number(rec?.props.steering ?? 0),
        forward, wind, gpsBlocked, obstacle, linkEnabled: Boolean(rec?.props.link), holdAltitude
      };
      setWorld((prev) => stepMission(prev, project, controls, measured, 0.1 * st.simSpeed, Number(batt?.props.mah ?? 2200)));
    }, 100);
    return () => window.clearInterval(timer);
  }, [active, running, project, forward, wind, gpsBlocked, obstacle, holdAltitude]);

  const change = (key: 'throttle' | 'steering' | 'link', value: number | boolean) => {
    if (active && receiver) useCircuitStore.getState().setProp('rx', key, value);
  };
  const stop = () => {
    const st = useCircuitStore.getState();
    st.setRunning(false);
    if (project.kind === 'drone' && armed) st.setProp('fc', 'armed', false);
    if (receiver && throttle !== 0) st.setProp('rx', 'throttle', 0);
  };
  const start = () => {
    if (!ready) return;
    const st = useCircuitStore.getState();
    st.setProp('rx', 'link', true);
    st.setProp('rx', 'throttle', project.kind === 'drone' ? 68 : 60);
    if (project.kind === 'drone') st.setProp('fc', 'armed', true);
    st.setRunning(true);
  };
  const reset = () => { stop(); setWorld(initialMission(project, capacity)); };

  if (project.kind === 'bench') return <ProtectionBench project={project} active={active} issues={issues} frame={frame} />;
  const status = STATUS[world.status];
  const statusColor = ['landing','low-battery','collision','no-power','gps-lost','link-lost'].includes(world.status)
    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-100'
    : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200';
  const drawCamera = world.cameraFeed && project.features.includes('camera');
  const signal = Math.round(world.linkQuality);
  const remaining = world.current >= 0.2 ? Math.round(world.batteryWh / Math.max(1, world.current * Math.max(world.voltage, 1)) * 60) : null;
  const measuredActuator = frame && active ? Math.round(observe(project, frame, ready).actuator * 100) : 0;
  const ax = Number(imu?.props.ax ?? 0);
  const ay = Number(imu?.props.ay ?? 0);
  const az = Number(imu?.props.az ?? 1);
  const pitch = Math.atan2(-ax, Math.hypot(ay, az)) * 180 / Math.PI;
  const roll = Math.atan2(ay, az) * 180 / Math.PI;
  const pressure = Number(baro?.props.hpa ?? 1013.25);
  const range = Number(sonar?.props.distance ?? 50);
  return (
    <section aria-label={bn ? 'ইন্টার‌্যাকটিভ মিশন সিমুলেশন' : 'Interactive mission simulation'} className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--line)] p-4 sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">{bn ? 'লাইভ ট্রেনিং দৃশ্য' : 'LIVE TRAINING SCENE'}</p>
          <h4 className="mt-0.5 text-base font-bold text-[color:var(--ink)]">{bn ? 'মিশন সিমুলেটর' : 'Mission simulator'} <span className="ml-1 text-xs font-normal text-[color:var(--muted)]">{project.mode.toUpperCase()}</span></h4>
        </div>
        <span role="status" aria-live="polite" className={cn('rounded-full border px-3 py-1 text-xs font-bold', statusColor)}>{running && active ? (bn ? status.bn : status.en) : bn ? 'থেমে আছে' : 'Paused'}</span>
      </div>

      {!active ? <p className="m-4 rounded-xl border border-dashed border-physics-300 bg-physics-50 p-3 text-xs leading-5 text-physics-900 dark:bg-physics-900/20 dark:text-physics-100">{bn ? 'প্রথমে উপরের “তারসহ বেঞ্চে খুলুন” চাপুন। মিশন দৃশ্যটি নির্বাচিত সার্কিটের বাস্তব পাওয়ার ও মোটরের পাঠ ব্যবহার করে।' : 'First select “Open wired build” above. The mission scene reads power and motor results from that actual circuit.'}</p> : null}
      {active && issues.length > 0 ? <div className="m-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100" role="alert">
        <button type="button" className="flex w-full items-center gap-2 text-left font-bold" onClick={() => setExpandedIssues(!expandedIssues)} aria-expanded={expandedIssues}><AlertTriangle className="h-4 w-4" aria-hidden />{bn ? `তার/পাওয়ার যাচাই করুন · ${issues.length}টি সমস্যা` : `Check wiring & power · ${issues.length} issue(s)`}</button>
        <p className="mt-1">{bn ? issues[0].bn : issues[0].en}</p>
        {expandedIssues && issues.length > 1 ? <ul className="mt-2 max-h-28 list-disc space-y-1 overflow-auto pl-5">{issues.slice(1).map((v, i) => <li key={i}>{bn ? v.bn : v.en}</li>)}</ul> : null}
      </div> : null}

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.65fr)_minmax(230px,0.75fr)]">
        <div className="min-w-0 border-b border-[color:var(--line)] bg-[#0a1d2c] p-3 xl:border-b-0 xl:border-r sm:p-4">
          <MissionMap project={project} world={world} obstacle={obstacle} drawCamera={drawCamera} />
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-300">
            <span>◉ {bn ? 'হোম' : 'HOME'} · {HOME.lat.toFixed(4)}°N, {HOME.lng.toFixed(4)}°E</span>
            <span>◇ {bn ? 'টার্গেট' : 'TARGET'} · {project.target.x}m E / {project.target.y}m N</span>
            <span>{bn ? 'উপর থেকে কল্পিত দৃশ্য · ১ ঘর ≈ ১০ m' : 'Synthetic overhead view · 1 grid ≈ 10 m'}</span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Readout label={bn ? 'গতি' : 'SPEED'} value={`${world.speed.toFixed(1)} m/s`} />
            <Readout label={bn ? 'উচ্চতা' : 'ALTITUDE'} value={project.kind === 'drone' ? `${world.z.toFixed(1)} m` : '—'} />
            <Readout label={bn ? 'ব্যাটারি' : 'BATTERY'} value={`${world.batteryPercent.toFixed(0)}%`} small={`${world.voltage.toFixed(1)} V · ${world.current.toFixed(1)} A`} />
            <Readout label={bn ? 'রেডিও' : 'RADIO'} value={`${signal}%`} small={link ? (bn ? 'চালু' : 'linked') : (bn ? 'লিংক নেই' : 'lost')} />
          </div>
          <div className="rounded-xl border border-[color:var(--line)] p-2.5 text-[11px] text-[color:var(--muted)]">
            <p><strong className="text-[color:var(--ink)]">GPS · </strong>{world.gpsFix ? `${world.gpsLat.toFixed(5)}° N, ${world.gpsLng.toFixed(5)}° E` : bn ? 'কোনো ফিক্স নেই' : 'No fix'}</p>
            <p className="mt-1"><strong className="text-[color:var(--ink)]">{bn ? 'মোটর · ' : 'Motor · '}</strong>{measuredActuator}% {bn ? 'বেঞ্চে পর্যবেক্ষিত' : 'observed on bench'}</p>
            <p className="mt-1"><strong className="text-[color:var(--ink)]">{bn ? 'বাকি সময় · ' : 'Runtime · '}</strong>{remaining === null ? '—' : `~${remaining} min`} <span className="opacity-70">{bn ? '(আনুমানিক)' : '(estimate)'}</span></p>
            {project.features.includes('imu') ? <p className="mt-1"><strong className="text-[color:var(--ink)]">IMU · </strong>{active && frame?.components.imu?.powered && Number.isFinite(pitch + roll) ? `${bn ? 'পিচ' : 'pitch'} ${pitch.toFixed(1)}° / ${bn ? 'রোল' : 'roll'} ${roll.toFixed(1)}°` : bn ? 'সেন্সর বন্ধ' : 'sensor offline'} <span className="opacity-70">{bn ? '(ইন্সপেক্টরের নমুনা)' : '(inspector sample)'}</span></p> : null}
            {project.features.includes('barometer') ? <p className="mt-1"><strong className="text-[color:var(--ink)]">BMP280 · </strong>{active && frame?.components.baro?.powered && Number.isFinite(pressure) ? `${pressure.toFixed(1)} hPa` : bn ? 'সেন্সর বন্ধ' : 'sensor offline'} <span className="opacity-70">{bn ? '(উচ্চতা ফিউশন নয়)' : '(not altitude fusion)'}</span></p> : null}
            {project.features.includes('sonar') ? <p className="mt-1"><strong className="text-[color:var(--ink)]">SONAR · </strong>{active && frame?.components.sonar?.powered && Number.isFinite(range) ? `${range.toFixed(0)} cm` : bn ? 'সেন্সর বন্ধ' : 'sensor offline'} <span className="opacity-70">{bn ? '(ইন্সপেক্টরের নমুনা, ভূমি ফিউশন নয়)' : '(inspector sample, not terrain fusion)'}</span></p> : null}
          </div>
          {project.features.includes('camera') ? <div className="overflow-hidden rounded-xl border border-[color:var(--line)] bg-[#071421]">
            <SyntheticCamera active={drawCamera} bn={bn} heading={world.heading} />
          </div> : null}
        </div>
      </div>

      <div className="grid gap-4 border-t border-[color:var(--line)] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(190px,0.52fr)] sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={running && active ? stop : start} disabled={!ready && !running} className="btn btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold disabled:opacity-40">
              {running && active ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
              {running && active ? bn ? 'থামান ও ডিসআর্ম' : 'Stop & disarm' : bn ? 'ভার্চুয়াল মিশন শুরু' : 'Start virtual mission'}
            </button>
            <button type="button" onClick={reset} disabled={!active} className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs"><RotateCcw className="h-3.5 w-3.5" aria-hidden />{bn ? 'রিসেট' : 'Reset'}</button>
          </div>
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            <Slider label={bn ? 'RC থ্রটল' : 'RC throttle'} value={throttle} min={0} max={100} unit="%" disabled={!active} onChange={(v) => change('throttle', v)} />
            <Slider label={bn ? 'স্টিয়ারিং / ইয়াও' : 'Steering / yaw'} value={steering} min={-100} max={100} unit="%" disabled={!active} onChange={(v) => change('steering', v)} />
            {project.kind === 'drone' ? <Slider label={bn ? 'সামনে / পিচ (দৃশ্যে)' : 'Forward / pitch (scene)'} value={forward} min={-100} max={100} unit="%" onChange={setForward} /> : null}
            {project.kind === 'drone' ? <Slider label={bn ? 'পূর্বমুখী বাতাস' : 'Eastward wind'} value={wind} min={-8} max={8} unit="m/s" onChange={setWind} /> : null}
            {project.mode === 'hold' ? <Slider label={bn ? 'লক্ষ্য উচ্চতা' : 'Altitude setpoint'} value={holdAltitude} min={1} max={15} unit="m" onChange={setHoldAltitude} /> : null}
          </div>
        </div>
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">{bn ? 'পরিস্থিতি বদলান' : 'CHANGE CONDITIONS'}</p>
          <Toggle label={bn ? 'RC লিংক' : 'RC link'} checked={link} disabled={!active} onChange={(v) => change('link', v)} icon={<Radio className="h-4 w-4" aria-hidden />} />
          {project.features.includes('gps') ? <Toggle label={bn ? 'GPS দৃশ্যমান' : 'GPS visible'} checked={!gpsBlocked} onChange={(v) => setGpsBlocked(!v)} icon={<MapPin className="h-4 w-4" aria-hidden />} /> : null}
          <Toggle label={bn ? 'সামনে বাধা' : 'Obstacle on route'} checked={obstacle} onChange={setObstacle} icon={<Crosshair className="h-4 w-4" aria-hidden />} />
          {project.kind === 'drone' ? <Toggle label={bn ? 'FC আর্ম করা' : 'FC armed'} checked={armed} disabled={!active} onChange={(v) => useCircuitStore.getState().setProp('fc', 'armed', v)} icon={<Zap className="h-4 w-4" aria-hidden />} /> : null}
        </div>
      </div>
      <p className="border-t border-[color:var(--line)] px-4 py-2.5 text-[11px] leading-5 text-[color:var(--muted)] sm:px-5">{bn
        ? 'শিক্ষামূলক 2D মডেল: RC/মোটর ও পাওয়ার সার্কিট বেঞ্চ থেকে, চলাচল ও GPS/ভিডিও ক্ষেত্র কল্পিত। প্রকৃত ফ্লাইট, RF, ক্যামেরা ফ্রেম বা স্বয়ংক্রিয় ফার্মওয়্যার যাচাই করে না।'
        : 'Educational 2-D model: motor/power come from the circuit bench; motion and GPS/camera view are synthetic. Does not validate flight, RF, camera frames or autonomy firmware.'}</p>
    </section>
  );
}

function Readout({ label, value, small }: { label: string; value: string; small?: string }) {
  return <div className="min-w-0 rounded-xl bg-[color:var(--surface-soft)] p-2.5">
    <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--muted)]">{label}</p>
    <p className="mt-0.5 truncate font-mono text-base font-bold tabular-nums text-[color:var(--ink)]">{value}</p>
    {small ? <p className="text-[10px] text-[color:var(--muted)]">{small}</p> : null}
  </div>;
}
function Slider({ label, value, min, max, unit, step = 1, disabled, onChange }: { label: string; value: number; min: number; max: number; unit: string; step?: number; disabled?: boolean; onChange: (v: number) => void }) {
  return <label className="block text-xs text-[color:var(--ink)]">
    <span className="flex items-center justify-between gap-1"><span className="font-medium">{label}</span><output className="font-mono font-bold tabular-nums">{value} {unit}</output></span>
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-2 w-full accent-physics-600 disabled:opacity-40" />
  </label>;
}
function Toggle({ label, checked, onChange, disabled, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; icon: ReactNode }) {
  return <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[color:var(--line)] px-2.5 py-2 text-xs text-[color:var(--ink)]">
    <span className="inline-flex items-center gap-2">{icon}{label}</span>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-physics-600" />
  </label>;
}

/** Coordinates are local metres, projected onto a stylised SVG map; the map
 * does not request tiles, GPS permissions or any external service. */
function MissionMap({ project, world, obstacle, drawCamera }: { project: AdvancedProject; world: MissionState; obstacle: boolean; drawCamera: boolean }) {
  const { locale } = useCircuitI18n();
  const bn = locale === 'bn';
  const scale = project.kind === 'drone' ? 3 : project.kind === 'boat' ? 4.5 : 7;
  const focusX = Math.max(0, world.x * 0.35);
  const focusY = world.y * 0.35;
  const sx = (x: number) => 300 + (x - focusX) * scale;
  const sy = (y: number) => 165 - (y - focusY) * scale;
  const gridId = `mission-grid-${project.id}`;
  const path = world.track.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');
  const auto = project.mode !== 'manual' && project.mode !== 'hold';
  return <svg viewBox="0 0 600 330" className="block aspect-[600/330] w-full rounded-xl border border-cyan-100/15 bg-[#0b2335]" role="img" aria-label={bn ? 'কল্পিত যানবাহনের মানচিত্র, হোম, লক্ষ্য ও বাধা' : 'Synthetic vehicle map with home, target and obstacle'}>
    <defs><pattern id={gridId} width={10 * scale} height={10 * scale} patternUnits="userSpaceOnUse"><path d={`M ${10 * scale} 0 L 0 0 0 ${10 * scale}`} fill="none" stroke="#2a6a7c" strokeWidth="0.6" opacity="0.5" /></pattern></defs>
    <rect x="0" y="0" width="600" height="330" fill={`url(#${gridId})`} />
    <circle cx={sx(0)} cy={sy(0)} r={Math.min(280, project.radioRange * scale)} fill="none" stroke="#38bfb4" strokeDasharray="6 6" strokeWidth="1.3" opacity="0.45" />
    {project.mode === 'geofence' ? <circle cx={sx(0)} cy={sy(0)} r={27 * scale} fill="none" stroke="#f7ba60" strokeDasharray="4 4" strokeWidth="1.3" /> : null}
    {auto ? <path d={`M ${sx(0)} ${sy(0)} L ${sx(project.target.x)} ${sy(project.target.y)}`} stroke="#6db7c8" strokeWidth="1.3" strokeDasharray="4 6" fill="none" /> : null}
    {obstacle ? <g><circle cx={sx(OBSTACLE.x)} cy={sy(OBSTACLE.y)} r={OBSTACLE.radius * scale} fill="#f16b50" fillOpacity="0.25" stroke="#fb8b72" strokeWidth="1.7" /><path d={`M${sx(OBSTACLE.x) - 5} ${sy(OBSTACLE.y) - 5} l10 10 m0 -10 l-10 10`} stroke="#ffb29a" strokeWidth="1.5" /></g> : null}
    <path d={path} fill="none" stroke="#56d3df" strokeWidth="2" opacity="0.85" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={sx(0)} cy={sy(0)} r="8" fill="#103d4a" stroke="#6af5ce" strokeWidth="1.7" />
    <circle cx={sx(0)} cy={sy(0)} r="2.4" fill="#a6ffe1" />
    <text x={sx(0) + 12} y={sy(0) - 8} fontSize="10" fill="#b1f6da" fontWeight="bold">HOME</text>
    {auto ? <g><circle cx={sx(project.target.x)} cy={sy(project.target.y)} r="8" fill="none" stroke="#ffd879" strokeWidth="1.6" /><path d={`M${sx(project.target.x) - 13} ${sy(project.target.y)} h26 M${sx(project.target.x)} ${sy(project.target.y) - 13} v26`} stroke="#ffd879" strokeWidth="1" /><text x={sx(project.target.x) + 12} y={sy(project.target.y) - 10} fill="#ffdf91" fontSize="10" fontWeight="bold">TARGET</text></g> : null}
    {drawCamera ? <path d={`M ${sx(world.x)} ${sy(world.y)} L ${sx(world.x + 19 * Math.cos((world.heading - 25) * Math.PI / 180))} ${sy(world.y + 19 * Math.sin((world.heading - 25) * Math.PI / 180))} A ${19 * scale} ${19 * scale} 0 0 0 ${sx(world.x + 19 * Math.cos((world.heading + 25) * Math.PI / 180))} ${sy(world.y + 19 * Math.sin((world.heading + 25) * Math.PI / 180))} Z`} fill="#4ce8b7" fillOpacity="0.13" stroke="#57daba" strokeWidth="0.8" /> : null}
    <g transform={`translate(${sx(world.x)} ${sy(world.y)}) rotate(${-world.heading})`}>
      <circle r="20" fill="#25c9d4" opacity="0.12" />
      {project.kind === 'drone' ? <g>
        <path d="M-12 -12 L12 12 M-12 12 L12 -12" stroke="#8ee5f0" strokeWidth="5" strokeLinecap="round" />
        {[[-13,-13],[13,-13],[-13,13],[13,13]].map(([x,y], i) => <g key={i}><circle cx={x} cy={y} r="5.5" fill="#1b6b83" stroke="#b7f4f2" strokeWidth="1" /><circle cx={x} cy={y} r="2" fill="#b7f4f2" /></g>)}
        <path d="M1 -5 L13 0 L1 5 Z" fill="#fef3bb" stroke="#facc63" strokeWidth="1" />
      </g> : project.kind === 'boat' ? <g><path d="M-16 -10 L12 -8 L19 0 L12 8 L-16 10 L-11 0 Z" fill="#7bd1e4" stroke="#f8f3db" strokeWidth="1.5" /><path d="M-10 0 H11" stroke="#205475" strokeWidth="2" /></g> : <g><rect x="-15" y="-9" width="30" height="18" rx="3" fill="#5fd5d6" stroke="#edf8ed" strokeWidth="1.5" /><rect x="-12" y="-14" width="8" height="4" rx="1" fill="#232a31" /><rect x="5" y="-14" width="8" height="4" rx="1" fill="#232a31" /><rect x="-12" y="10" width="8" height="4" rx="1" fill="#232a31" /><rect x="5" y="10" width="8" height="4" rx="1" fill="#232a31" /><path d="M4 -5 L12 0 L4 5" fill="none" stroke="#14384d" strokeWidth="1.5" /></g>}
    </g>
    <rect x="10" y="9" width="111" height="22" rx="5" fill="#0b1828" fillOpacity="0.9" stroke="#2d7b86" />
    <text x="19" y="24" fill="#aaf2e6" fontFamily="monospace" fontSize="11">T+ {world.t.toFixed(1)} s</text>
    <rect x="478" y="9" width="112" height="22" rx="5" fill="#0b1828" fillOpacity="0.9" stroke="#2d7b86" />
    <text x="487" y="24" fill="#b8eaf4" fontFamily="monospace" fontSize="10">HDG {world.heading.toFixed(0)}°</text>
    <path d="M18 308 H68" stroke="#a6d9d8" strokeWidth="2" /><path d="M18 304 V312 M68 304 V312" stroke="#a6d9d8" strokeWidth="1" /><text x="22" y="300" fill="#a6d9d8" fontSize="9">{(50 / scale).toFixed(0)} m</text>
  </svg>;
}

function SyntheticCamera({ active, bn, heading }: { active: boolean; bn: boolean; heading: number }) {
  if (!active) return <div className="flex h-20 items-center justify-center gap-2 text-xs text-slate-400"><VideoOff className="h-4 w-4" aria-hidden />{bn ? 'ভিডিও সিগন্যাল নেই' : 'No video signal'}</div>;
  return <div className="relative h-24 overflow-hidden" role="img" aria-label={bn ? 'কল্পিত ক্যামেরার দৃষ্টিকোণ, লাইভ ভিডিও নয়' : 'Synthetic camera view, not live video'}>
    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#366888] to-[#7fc4cb]" />
    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-[#5a7163] to-[#243c40]" />
    <svg viewBox="0 0 210 96" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <path d="M0 56 L23 39 L45 50 L72 32 L98 51 L122 36 L149 52 L174 33 L210 54 V96 H0Z" fill="#385969" /><path d="M0 66 L40 59 L76 67 L122 60 L151 69 L210 62 V96 H0Z" fill="#294a4d" />
      <path d="M105 34 V61 M92 48 H118" stroke="#c7ffe5" strokeWidth="0.8" /><circle cx="105" cy="48" r="11" fill="none" stroke="#b0f2da" strokeWidth="0.65" />
    </svg>
    <span className="absolute left-2 top-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-green-300">SYNTHETIC FPV · NO LIVE VIDEO</span>
    <span className="absolute bottom-1 right-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-green-200">HDG {heading.toFixed(0)}°</span>
  </div>;
}

function ProtectionBench({ project, active, issues, frame }: {
  project: AdvancedProject; active: boolean; issues: { en: string; bn: string }[];
  frame: ReturnType<typeof useCircuitStore.getState>['frame'];
}) {
  const { locale } = useCircuitI18n();
  const bn = locale === 'bn';
  const battery = useCircuitStore((s) => s.components.find((c) => c.id === 'bat'));
  const pcm = useCircuitStore((s) => s.components.find((c) => c.id === 'pcm'));
  const volts = Number(active ? (battery?.props.volts ?? 3.7) : 3.7);
  const fault = active && Boolean(pcm?.props.fault);
  const on = active && Boolean(frame?.components.pcm?.on);
  const current = active ? (frame?.components.led?.current ?? 0) * 1000 : 0;
  const changeV = (v: number) => { if (active) useCircuitStore.getState().setProp('bat','volts',v); };
  return <section aria-label={bn ? '1S সুরক্ষা পরীক্ষা' : '1S protection test'} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 sm:p-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">{bn ? 'ইন্টার‌্যাকটিভ পাওয়ার বেঞ্চ' : 'INTERACTIVE POWER BENCH'}</p>
    <h4 className="mt-1 text-lg font-bold text-[color:var(--ink)]">{bn ? 'সুরক্ষা সুইচ এবং কারেন্ট' : 'Protection switch & current'}</h4>
    {!active ? <p className="mt-3 rounded-xl bg-physics-50 p-3 text-xs text-physics-900 dark:bg-physics-900/20 dark:text-physics-100">{bn ? 'প্রথমে উপরের তারসহ বিল্ডটি খুলুন।' : 'Open the wired build above first.'}</p> : null}
    {active && issues.length ? <div role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{bn ? issues[0].bn : issues[0].en}</div> : null}
    <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3 rounded-xl bg-[#102735] p-4 text-sm text-slate-100">
        <div className="flex items-center gap-3"><Battery className="h-7 w-7 text-cyan-300" aria-hidden /><strong>1S LiPo {volts.toFixed(2)} V</strong><span className="ml-auto">→</span><span className={cn('rounded-lg px-2 py-1 font-mono text-xs', on ? 'bg-emerald-400/25 text-emerald-200' : 'bg-orange-400/20 text-orange-200')}>{on ? 'PCM ON' : 'PCM OPEN'}</span></div>
        <div className="flex items-center gap-3 border-t border-white/15 pt-3"><span className={cn('h-5 w-5 rounded-full', on && current > 0.1 ? 'bg-red-400 shadow-[0_0_16px_5px_#f87171aa]' : 'bg-red-950')} /> LED <span className="ml-auto font-mono">{current.toFixed(1)} mA</span></div>
        <p className="text-[11px] text-slate-300">{bn ? 'নিয়ন্ত্রিত সুইচ মডেল; চার্জার বা বহু-সেল ব্যালান্সার নয়।' : 'Protected switch model, NOT a charger or multi-cell balancer.'}</p>
      </div>
      <div className="space-y-3">
        <Slider label={bn ? 'সেলের ভোল্টেজ' : 'Cell voltage'} value={volts} min={2.7} max={4.3} step={0.01} unit="V" disabled={!active} onChange={(v) => changeV(v)} />
        <Toggle label={bn ? 'সুরক্ষা ট্রিপ' : 'Protection trip'} checked={fault} disabled={!active} onChange={(v) => useCircuitStore.getState().setProp('pcm','fault',v)} icon={<ShieldCheck className="h-4 w-4" aria-hidden />} />
        <div className="flex gap-2">
          <button type="button" disabled={!active} className="btn btn-secondary px-2.5 py-1.5 text-xs" onClick={() => changeV(2.9)}>{bn ? 'কম ভোল্টেজ পরীক্ষা' : 'Test undervoltage'}</button>
          <button type="button" disabled={!active} className="btn btn-secondary px-2.5 py-1.5 text-xs" onClick={() => { changeV(3.7); useCircuitStore.getState().setProp('pcm','fault',false); }}>{bn ? 'পুনরুদ্ধার' : 'Restore 3.7 V'}</button>
        </div>
      </div>
    </div>
    <p className="mt-3 text-xs text-[color:var(--muted)]">{bn ? project.expected.bn : project.expected.en}</p>
  </section>;
}
