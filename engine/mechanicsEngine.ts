export interface PendulumStepResult {
  angleRad: number;
  angularVelocity: number;
  timePeriod: number;
  potentialEnergy: number;
  kineticEnergy: number;
  totalEnergy: number;
  periodTheoretical: number;
}

export interface SpringStepResult {
  displacementM: number;
  velocity: number;
  periodTheoretical: number;
  potentialEnergy: number;
  kineticEnergy: number;
  totalEnergy: number;
  staticExtensionM: number;
}

export interface InclineStepResult {
  acceleration: number;
  velocity: number;
  positionM: number;
  normalForceN: number;
  frictionForceN: number;
  isSliding: boolean;
}

export interface ProjectileResult {
  rangeM: number;
  maxHeightM: number;
  flightTimeS: number;
  trajectory: { x: number; y: number; t: number; vx: number; vy: number }[];
}

export interface AtwoodResult {
  acceleration: number;
  tensionN: number;
  pos1M: number;
  pos2M: number;
  velocityMps: number;
}

/** Convert degrees to radians */
const deg2rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Simple Pendulum simulation step and theoretical period.
 */
export function calculatePendulumStep(
  lengthM: number,
  massKg: number,
  currentAngleRad: number,
  currentAngularVel: number,
  dtSeconds = 0.02,
  gravity = 9.80665,
  damping = 0.005
): PendulumStepResult {
  const L = Math.max(0.05, lengthM);
  const m = Math.max(0.01, massKg);
  const g = gravity;

  // Theoretical small-angle period T = 2*pi*sqrt(L/g)
  const periodTheoretical = 2 * Math.PI * Math.sqrt(L / g);

  // RK4 / Verlet numerical integration: d²θ/dt² = -(g/L)*sin(θ) - damping*ω
  const alpha = -(g / L) * Math.sin(currentAngleRad) - damping * currentAngularVel;
  const newAngularVel = currentAngularVel + alpha * dtSeconds;
  const newAngleRad = currentAngleRad + newAngularVel * dtSeconds;

  // Energies
  // h = L * (1 - cos θ)
  const h = L * (1 - Math.cos(newAngleRad));
  const potentialEnergy = m * g * h;
  const v = L * newAngularVel;
  const kineticEnergy = 0.5 * m * v * v;
  const totalEnergy = potentialEnergy + kineticEnergy;

  return {
    angleRad: Number(newAngleRad.toFixed(5)),
    angularVelocity: Number(newAngularVel.toFixed(5)),
    timePeriod: Number(periodTheoretical.toFixed(3)),
    potentialEnergy: Number(potentialEnergy.toFixed(4)),
    kineticEnergy: Number(kineticEnergy.toFixed(4)),
    totalEnergy: Number(totalEnergy.toFixed(4)),
    periodTheoretical: Number(periodTheoretical.toFixed(3))
  };
}

/**
 * Spring-Mass System simulation step.
 */
export function calculateSpringStep(
  springConstantNm: number,
  massKg: number,
  currentDisplacementM: number,
  currentVelocity: number,
  dtSeconds = 0.02,
  gravity = 9.80665,
  damping = 0.01
): SpringStepResult {
  const k = Math.max(0.1, springConstantNm);
  const m = Math.max(0.01, massKg);

  const periodTheoretical = 2 * Math.PI * Math.sqrt(m / k);
  const staticExtensionM = (m * gravity) / k;

  // Equation of motion: a = -(k/m)*x - damping*v
  const acceleration = -(k / m) * currentDisplacementM - damping * currentVelocity;
  const newVelocity = currentVelocity + acceleration * dtSeconds;
  const newDisplacementM = currentDisplacementM + newVelocity * dtSeconds;

  const potentialEnergy = 0.5 * k * Math.pow(newDisplacementM, 2);
  const kineticEnergy = 0.5 * m * Math.pow(newVelocity, 2);
  const totalEnergy = potentialEnergy + kineticEnergy;

  return {
    displacementM: Number(newDisplacementM.toFixed(5)),
    velocity: Number(newVelocity.toFixed(5)),
    periodTheoretical: Number(periodTheoretical.toFixed(3)),
    potentialEnergy: Number(potentialEnergy.toFixed(4)),
    kineticEnergy: Number(kineticEnergy.toFixed(4)),
    totalEnergy: Number(totalEnergy.toFixed(4)),
    staticExtensionM: Number(staticExtensionM.toFixed(4))
  };
}

/**
 * Inclined Plane motion calculation.
 */
export function calculateInclinedPlaneStep(
  massKg: number,
  angleDeg: number,
  frictionCoeffStatic = 0.35,
  frictionCoeffKinetic = 0.25,
  currentPositionM = 0,
  currentVelocity = 0,
  dtSeconds = 0.02,
  gravity = 9.80665
): InclineStepResult {
  const theta = deg2rad(angleDeg);
  const m = massKg;
  const g = gravity;

  const normalForceN = m * g * Math.cos(theta);
  const parallelForceN = m * g * Math.sin(theta);
  const maxStaticFrictionN = frictionCoeffStatic * normalForceN;

  let acceleration = 0;
  let frictionForceN = 0;
  let isSliding = false;

  if (Math.abs(currentVelocity) > 1e-4 || parallelForceN > maxStaticFrictionN) {
    isSliding = true;
    frictionForceN = frictionCoeffKinetic * normalForceN;
    const netForceN = parallelForceN - frictionForceN;
    acceleration = Math.max(0, netForceN / m);
  } else {
    isSliding = false;
    frictionForceN = parallelForceN;
    acceleration = 0;
  }

  const newVelocity = isSliding ? currentVelocity + acceleration * dtSeconds : 0;
  const newPositionM = currentPositionM + newVelocity * dtSeconds;

  return {
    acceleration: Number(acceleration.toFixed(4)),
    velocity: Number(newVelocity.toFixed(4)),
    positionM: Number(newPositionM.toFixed(4)),
    normalForceN: Number(normalForceN.toFixed(3)),
    frictionForceN: Number(frictionForceN.toFixed(3)),
    isSliding
  };
}

/**
 * Projectile Motion analytical calculation.
 */
export function calculateProjectileMotion(
  initialVelocityMps: number,
  angleDeg: number,
  launchHeightM = 0,
  gravity = 9.80665,
  pointsCount = 60
): ProjectileResult {
  const v0 = Math.max(0.1, initialVelocityMps);
  const theta = deg2rad(angleDeg);
  const g = gravity;

  const vx0 = v0 * Math.cos(theta);
  const vy0 = v0 * Math.sin(theta);

  // Time of flight solving y(T) = h + vy0*T - 0.5*g*T^2 = 0
  const flightTimeS = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * launchHeightM)) / g;
  const rangeM = vx0 * flightTimeS;
  const maxHeightM = launchHeightM + (vy0 * vy0) / (2 * g);

  const trajectory: { x: number; y: number; t: number; vx: number; vy: number }[] = [];
  const dt = flightTimeS / (pointsCount - 1);

  for (let i = 0; i < pointsCount; i++) {
    const t = Math.min(flightTimeS, i * dt);
    const x = vx0 * t;
    const y = Math.max(0, launchHeightM + vy0 * t - 0.5 * g * t * t);
    const vy = vy0 - g * t;

    trajectory.push({
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      t: Number(t.toFixed(3)),
      vx: Number(vx0.toFixed(3)),
      vy: Number(vy.toFixed(3))
    });
  }

  return {
    rangeM: Number(rangeM.toFixed(3)),
    maxHeightM: Number(maxHeightM.toFixed(3)),
    flightTimeS: Number(flightTimeS.toFixed(3)),
    trajectory
  };
}

/**
 * Atwood Machine acceleration and tension:
 * a = (m1 - m2) / (m1 + m2) * g
 * T = 2 * m1 * m2 * g / (m1 + m2)
 */
export function calculateAtwoodMachine(
  m1Kg: number,
  m2Kg: number,
  initialPos1M = 1.0,
  initialPos2M = 0.2,
  currentVel = 0,
  dtSeconds = 0.02,
  gravity = 9.80665
): AtwoodResult {
  const sumM = m1Kg + m2Kg;
  if (sumM <= 0) return { acceleration: 0, tensionN: 0, pos1M: 0, pos2M: 0, velocityMps: 0 };

  const acceleration = ((m1Kg - m2Kg) / sumM) * gravity;
  const tensionN = (2 * m1Kg * m2Kg * gravity) / sumM;

  const velocityMps = currentVel + acceleration * dtSeconds;
  const pos1M = Math.max(0, initialPos1M - velocityMps * dtSeconds); // mass 1 goes down
  const pos2M = initialPos2M + velocityMps * dtSeconds; // mass 2 goes up

  return {
    acceleration: Number(acceleration.toFixed(4)),
    tensionN: Number(tensionN.toFixed(4)),
    pos1M: Number(pos1M.toFixed(4)),
    pos2M: Number(pos2M.toFixed(4)),
    velocityMps: Number(velocityMps.toFixed(4))
  };
}

/**
 * Newton's Second Law:
 * a = F_net / M_total = (m_hang * g) / (M_cart + m_hang)
 */
export function calculateNewtonsSecondLaw(
  cartMassKg: number,
  hangingMassKg: number,
  gravity = 9.80665
): { netForceN: number; totalMassKg: number; accelerationMps2: number } {
  const netForceN = hangingMassKg * gravity;
  const totalMassKg = cartMassKg + hangingMassKg;
  const accelerationMps2 = netForceN / totalMassKg;

  return {
    netForceN: Number(netForceN.toFixed(4)),
    totalMassKg: Number(totalMassKg.toFixed(4)),
    accelerationMps2: Number(accelerationMps2.toFixed(4))
  };
}
