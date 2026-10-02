'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef } from 'react';
import type { Group } from 'three';

function FieldRings() {
  const group = useRef<Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.22; });
  return <group ref={group}>{Array.from({ length: 7 }, (_, index) => <mesh key={index} rotation={[Math.PI / 2, index * 0.22, 0]} position={[(index - 3) * 0.48, 0, 0]}><torusGeometry args={[0.55 + index * 0.04, 0.018, 12, 64]} /><meshBasicMaterial color={index % 2 ? '#6ce3bb' : '#72b9ff'} transparent opacity={0.7} /></mesh>)}<mesh position={[0, 0, 0]}><sphereGeometry args={[0.38, 24, 24]} /><meshStandardMaterial color="#e8795b" roughness={0.25} /></mesh></group>;
}

export function OpticsFieldScene() {
  return <div className="h-64 overflow-hidden rounded-2xl bg-[#071b2d]" aria-label="React Three Fiber optical field view"><Canvas dpr={[1, 1.5]}><PerspectiveCamera makeDefault position={[0, 1.1, 5.2]} /><ambientLight intensity={1.4} /><pointLight position={[2, 3, 4]} intensity={4} color="#b9dcff" /><FieldRings /><OrbitControls enablePan={false} /></Canvas></div>;
}
