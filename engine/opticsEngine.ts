import type { OpticalImageResult, OpticalRay, OpticsSimulationResult } from './physicsTypes';

/** Convert degrees to radians */
const deg2rad = (deg: number) => (deg * Math.PI) / 180;
/** Convert radians to degrees */
const rad2deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Snell's Law and Critical Angle calculation.
 */
export function calculateSnellRefraction(
  angleIncidenceDeg: number,
  n1 = 1.0, // incident medium (default air = 1.0)
  n2 = 1.52 // refracting medium (default crown glass = 1.52)
): {
  angleRefractionDeg: number;
  isTotalInternalReflection: boolean;
  criticalAngleDeg: number | null;
  reflectionCoefficient: number;
} {
  const iRad = deg2rad(Math.abs(angleIncidenceDeg));
  let criticalAngleDeg: number | null = null;

  if (n1 > n2) {
    criticalAngleDeg = rad2deg(Math.asin(n2 / n1));
  }

  const sinR = (n1 / n2) * Math.sin(iRad);

  if (sinR > 1.0) {
    // Total Internal Reflection (TIR)
    return {
      angleRefractionDeg: Math.abs(angleIncidenceDeg),
      isTotalInternalReflection: true,
      criticalAngleDeg,
      reflectionCoefficient: 1.0
    };
  }

  const rRad = Math.asin(sinR);
  const angleRefractionDeg = Number(rad2deg(rRad).toFixed(3));

  // Fresnel equation for normal incidence approximation
  const r0 = Math.pow((n1 - n2) / (n1 + n2), 2);
  const reflectionCoefficient = Number((r0 + (1 - r0) * Math.pow(1 - Math.cos(iRad), 5)).toFixed(3));

  return {
    angleRefractionDeg,
    isTotalInternalReflection: false,
    criticalAngleDeg: criticalAngleDeg ? Number(criticalAngleDeg.toFixed(2)) : null,
    reflectionCoefficient
  };
}

/**
 * Glass Slab Lateral Displacement:
 * d = t * sin(i - r) / cos(r)
 */
export function calculateGlassSlabDisplacement(
  angleIncidenceDeg: number,
  thicknessMm: number,
  refractiveIndex = 1.52
): { angleRefractionDeg: number; lateralShiftMm: number } {
  const { angleRefractionDeg } = calculateSnellRefraction(angleIncidenceDeg, 1.0, refractiveIndex);
  const iRad = deg2rad(angleIncidenceDeg);
  const rRad = deg2rad(angleRefractionDeg);

  const lateralShiftMm = (thicknessMm * Math.sin(iRad - rRad)) / Math.cos(rRad);
  return {
    angleRefractionDeg,
    lateralShiftMm: Number(lateralShiftMm.toFixed(3))
  };
}

/**
 * Thin Lens Equation:
 * 1/f = 1/v + 1/u (with u defined as positive distance in front of lens)
 * v = (u * f) / (u - f)
 */
export function calculateLensImage(
  objectDistanceCm: number, // u > 0
  focalLengthCm: number, // f > 0 for convex, f < 0 for concave
  objectHeightCm = 2.0,
  lensPositionCm = 50.0
): OpticalImageResult {
  const u = Math.max(0.1, objectDistanceCm);
  const f = focalLengthCm;

  if (Math.abs(u - f) < 0.001) {
    // Object at focus -> image at infinity
    return {
      exists: false,
      x: Infinity,
      height: Infinity,
      isReal: true,
      isErect: false,
      magnification: Infinity,
      focalLength: f
    };
  }

  let v: number;
  let isReal: boolean;
  let isErect: boolean;
  let magnification: number;

  if (f > 0) {
    // Convex Lens
    v = (u * f) / (u - f);
    if (u > f) {
      // Real inverted image behind lens
      isReal = true;
      isErect = false;
      magnification = -v / u;
    } else {
      // Virtual erect image in front of lens (v is negative)
      isReal = false;
      isErect = true;
      magnification = Math.abs(v) / u;
    }
  } else {
    // Concave Lens (f < 0): v = - (u * |f|) / (u + |f|)
    const absF = Math.abs(f);
    v = -(u * absF) / (u + absF);
    isReal = false;
    isErect = true;
    magnification = Math.abs(v) / u;
  }

  const imagePosAlongRail = isReal ? lensPositionCm + v : lensPositionCm - Math.abs(v);
  const imageHeight = objectHeightCm * Math.abs(magnification);

  return {
    exists: true,
    x: Number(imagePosAlongRail.toFixed(2)),
    height: Number(imageHeight.toFixed(2)),
    isReal,
    isErect,
    magnification: Number(magnification.toFixed(3)),
    focalLength: f
  };
}

/**
 * Spherical Mirror Equation:
 * 1/f = 1/v + 1/u => v = (u * f) / (u - f)
 */
export function calculateMirrorImage(
  objectDistanceCm: number,
  focalLengthCm: number, // positive for concave, negative for convex
  objectHeightCm = 2.0,
  mirrorPositionCm = 80.0
): OpticalImageResult {
  const u = Math.max(0.1, objectDistanceCm);
  const f = focalLengthCm;

  if (Math.abs(u - f) < 0.001) {
    return {
      exists: false,
      x: Infinity,
      height: Infinity,
      isReal: true,
      isErect: false,
      magnification: Infinity,
      focalLength: f
    };
  }

  let v: number;
  let isReal: boolean;
  let isErect: boolean;
  let magnification: number;

  if (f > 0) {
    // Concave mirror
    v = (u * f) / (u - f);
    if (u > f) {
      isReal = true;
      isErect = false;
      magnification = -v / u;
    } else {
      isReal = false;
      isErect = true;
      magnification = Math.abs(v) / u;
    }
  } else {
    // Convex mirror (f < 0)
    const absF = Math.abs(f);
    v = -(u * absF) / (u + absF);
    isReal = false;
    isErect = true;
    magnification = Math.abs(v) / u;
  }

  const imagePosAlongRail = isReal ? mirrorPositionCm - v : mirrorPositionCm + Math.abs(v);
  const imageHeight = objectHeightCm * Math.abs(magnification);

  return {
    exists: true,
    x: Number(imagePosAlongRail.toFixed(2)),
    height: Number(imageHeight.toFixed(2)),
    isReal,
    isErect,
    magnification: Number(magnification.toFixed(3)),
    focalLength: f
  };
}

/**
 * Triangular Prism Dispersion and Angle of Minimum Deviation:
 * μ = sin((A + δm) / 2) / sin(A / 2)
 */
export function calculatePrismRefraction(
  angleIncidenceDeg: number,
  prismAngleDeg = 60,
  baseRefractiveIndex = 1.517
): {
  angleEmergenceDeg: number;
  deviationAngleDeg: number;
  minimumDeviationDeg: number;
  dispersionSpreadDeg: number; // angle difference between red (650nm) and violet (400nm)
} {
  const A = deg2rad(prismAngleDeg);
  const i1 = deg2rad(angleIncidenceDeg);

  // Surface 1 Refraction: sin i1 = n * sin r1 => r1 = asin(sin i1 / n)
  const sinR1 = Math.sin(i1) / baseRefractiveIndex;
  if (Math.abs(sinR1) > 1) {
    return { angleEmergenceDeg: 0, deviationAngleDeg: 180, minimumDeviationDeg: 0, dispersionSpreadDeg: 0 };
  }
  const r1 = Math.asin(sinR1);
  const r2 = A - r1;

  // Surface 2 Refraction: sin i2 = sin r2, sin e = n * sin r2
  const sinE = baseRefractiveIndex * Math.sin(r2);
  let angleEmergenceDeg = 0;
  let deviationAngleDeg = 0;

  if (Math.abs(sinE) <= 1) {
    const e = Math.asin(sinE);
    angleEmergenceDeg = rad2deg(e);
    deviationAngleDeg = rad2deg(i1 + e - A);
  } else {
    // TIR on 2nd surface
    angleEmergenceDeg = 90;
    deviationAngleDeg = 90;
  }

  // Minimum deviation δm: μ = sin((A + δm)/2) / sin(A/2) => δm = 2 * asin(μ * sin(A/2)) - A
  const deltaMRad = 2 * Math.asin(baseRefractiveIndex * Math.sin(A / 2)) - A;
  const minimumDeviationDeg = rad2deg(deltaMRad);

  // Cauchy dispersion calculation for red (650 nm, n=1.514) and violet (400 nm, n=1.530)
  const nRed = baseRefractiveIndex - 0.005;
  const nViolet = baseRefractiveIndex + 0.012;
  const deltaRed = rad2deg(2 * Math.asin(nRed * Math.sin(A / 2)) - A);
  const deltaViolet = rad2deg(2 * Math.asin(nViolet * Math.sin(A / 2)) - A);
  const dispersionSpreadDeg = Math.max(0, deltaViolet - deltaRed);

  return {
    angleEmergenceDeg: Number(angleEmergenceDeg.toFixed(2)),
    deviationAngleDeg: Number(deviationAngleDeg.toFixed(2)),
    minimumDeviationDeg: Number(minimumDeviationDeg.toFixed(2)),
    dispersionSpreadDeg: Number(dispersionSpreadDeg.toFixed(3))
  };
}

/**
 * Young's Double Slit Interference:
 * Fringe width β = (λ * D) / d
 */
export function calculateDoubleSlitPattern(
  wavelengthNm = 632.8,
  slitSeparationMm = 0.25,
  screenDistanceM = 1.0,
  slitWidthMm = 0.04
): {
  fringeWidthMm: number;
  angularSeparationDeg: number;
  intensityProfile: { positionMm: number; intensity: number }[];
} {
  const lambda = wavelengthNm * 1e-9;
  const d = slitSeparationMm * 1e-3;
  const D = screenDistanceM;
  const a = slitWidthMm * 1e-3;

  const fringeWidth = (lambda * D) / d; // meters
  const fringeWidthMm = fringeWidth * 1000;
  const angularSeparationDeg = rad2deg(lambda / d);

  // Generate intensity profile for 41 points across ±10 mm
  const intensityProfile: { positionMm: number; intensity: number }[] = [];
  for (let posMm = -10; posMm <= 10; posMm += 0.5) {
    const y = posMm * 1e-3;
    const betaPhase = (Math.PI * d * y) / (lambda * D);
    const alphaPhase = (Math.PI * a * y) / (lambda * D);

    const interference = Math.pow(Math.cos(betaPhase), 2);
    const diffraction = alphaPhase === 0 ? 1 : Math.pow(Math.sin(alphaPhase) / alphaPhase, 2);
    const intensity = Number((interference * diffraction * 100).toFixed(1));

    intensityProfile.push({ positionMm: posMm, intensity });
  }

  return {
    fringeWidthMm: Number(fringeWidthMm.toFixed(3)),
    angularSeparationDeg: Number(angularSeparationDeg.toFixed(4)),
    intensityProfile
  };
}

/**
 * Diffraction Grating:
 * d * sin(θ) = n * λ => θ_n = asin(n * λ / d)
 */
export function calculateGratingDiffraction(
  wavelengthNm = 632.8,
  linesPerMm = 500,
  maxOrder = 3
): {
  gratingElementDnm: number;
  orders: { order: number; angleDeg: number; sinTheta: number }[];
} {
  const dMeters = 1 / (linesPerMm * 1000); // meters
  const dNm = dMeters * 1e9;
  const lambda = wavelengthNm * 1e-9;

  const orders: { order: number; angleDeg: number; sinTheta: number }[] = [];

  for (let n = 1; n <= maxOrder; n++) {
    const sinTheta = (n * lambda) / dMeters;
    if (sinTheta <= 1.0) {
      const angleDeg = rad2deg(Math.asin(sinTheta));
      orders.push({
        order: n,
        angleDeg: Number(angleDeg.toFixed(2)),
        sinTheta: Number(sinTheta.toFixed(4))
      });
    }
  }

  return {
    gratingElementDnm: Number(dNm.toFixed(1)),
    orders
  };
}

/**
 * Malus's Law for Polarizers:
 * I = I0 * cos²(θ)
 */
export function calculateMalusIntensity(angleDeg: number, initialIntensity = 100): number {
  const thetaRad = deg2rad(angleDeg);
  const intensity = initialIntensity * Math.pow(Math.cos(thetaRad), 2);
  return Number(intensity.toFixed(2));
}

/**
 * Screen Image Blur Radius:
 * Blur circle = Aperture * |ScreenPos - FocalPlanePos| / FocalPlanePos
 */
export function calculateScreenBlur(
  screenPosCm: number,
  idealImagePosCm: number,
  lensApertureMm = 50
): number {
  if (idealImagePosCm <= 0 || !isFinite(idealImagePosCm)) return 10.0;
  const diff = Math.abs(screenPosCm - idealImagePosCm);
  const blur = (lensApertureMm * diff) / idealImagePosCm;
  return Number(Math.min(25, Math.max(0, blur)).toFixed(2));
}
