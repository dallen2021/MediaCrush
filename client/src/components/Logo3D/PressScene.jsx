import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function PressScene() {
  const pressRef = useRef();
  const letterRef = useRef();
  const accentColor = useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue('--accent').trim() || '#8b5cf6';
  }, []);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() % 4) / 4; // 0 to 1 over 4 seconds

    let pressY = 0;
    let letterScaleY = 1;

    if (t < 0.15) {
      // Idle
      pressY = 0;
      letterScaleY = 1;
    } else if (t < 0.35) {
      // Press down
      const p = easeInOutCubic((t - 0.15) / 0.2);
      pressY = -p * 1.4;
      letterScaleY = 1 - p * 0.92;
    } else if (t < 0.5) {
      // Hold
      pressY = -1.4;
      letterScaleY = 0.08;
    } else if (t < 0.7) {
      // Press up
      const p = easeInOutCubic((t - 0.5) / 0.2);
      pressY = -1.4 + p * 1.4;
      letterScaleY = 0.08;
    } else if (t < 0.82) {
      // Flat reveal
      pressY = 0;
      letterScaleY = 0.08;
    } else {
      // Spring back with overshoot
      const p = (t - 0.82) / 0.18;
      const springP = 1 - Math.pow(1 - p, 3);
      letterScaleY = 0.08 + springP * 0.92;
      if (p > 0.6 && p < 0.8) letterScaleY += 0.05; // slight overshoot
    }

    if (pressRef.current) pressRef.current.position.y = pressY + 2;
    if (letterRef.current) {
      letterRef.current.scale.y = Math.max(0.05, letterScaleY);
      letterRef.current.position.y = letterScaleY * 0.5;
    }
  });

  const metalMat = useMemo(() => (
    <meshStandardMaterial color="#444458" metalness={0.8} roughness={0.3} />
  ), []);

  // Build the M shape from boxes
  const MShape = useMemo(() => {
    const barWidth = 0.2;
    const height = 1;
    return (
      <group>
        {/* Left leg */}
        <mesh position={[-0.55, 0, 0]}>
          <boxGeometry args={[barWidth, height, 0.3]} />
          <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} emissive={accentColor} emissiveIntensity={0.15} />
        </mesh>
        {/* Left diagonal */}
        <mesh position={[-0.28, 0.15, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[barWidth, height * 0.65, 0.3]} />
          <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} emissive={accentColor} emissiveIntensity={0.15} />
        </mesh>
        {/* Right diagonal */}
        <mesh position={[0.28, 0.15, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[barWidth, height * 0.65, 0.3]} />
          <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} emissive={accentColor} emissiveIntensity={0.15} />
        </mesh>
        {/* Right leg */}
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[barWidth, height, 0.3]} />
          <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} emissive={accentColor} emissiveIntensity={0.15} />
        </mesh>
      </group>
    );
  }, [accentColor]);

  return (
    <group position={[0, -0.8, 0]}>
      {/* Base plate */}
      <mesh position={[0, -0.55, 0]}>
        <boxGeometry args={[1.8, 0.15, 0.8]} />
        {metalMat}
      </mesh>

      {/* Letter M (crushable) */}
      <group ref={letterRef} position={[0, 0.5, 0]}>
        {MShape}
      </group>

      {/* Press assembly */}
      <group ref={pressRef} position={[0, 2, 0]}>
        {/* Press plate */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[1.6, 0.15, 0.7]} />
          {metalMat}
        </mesh>
        {/* Piston rod */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 8]} />
          {metalMat}
        </mesh>
        {/* Hydraulic cylinder */}
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
          <meshStandardMaterial color="#555570" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
