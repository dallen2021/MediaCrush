import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

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

  // Layout constants
  const baseY = 0;            // base plate top surface
  const mHeight = 0.9;        // M letter height when full
  const mBottom = baseY + 0.075; // M sits on base plate (half base thickness)
  const pressRestY = mBottom + mHeight + 0.3; // press rests above M with gap
  const pressCrushY = mBottom + mHeight * 0.08 + 0.075; // press at crushed M height

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() % 4) / 4;

    let pressY = pressRestY;
    let letterScaleY = 1;

    if (t < 0.15) {
      // Idle
      pressY = pressRestY;
      letterScaleY = 1;
    } else if (t < 0.35) {
      // Press down
      const p = easeInOutCubic((t - 0.15) / 0.2);
      pressY = pressRestY - p * (pressRestY - pressCrushY);
      letterScaleY = 1 - p * 0.92;
    } else if (t < 0.5) {
      // Hold crushed
      pressY = pressCrushY;
      letterScaleY = 0.08;
    } else if (t < 0.7) {
      // Press rises
      const p = easeInOutCubic((t - 0.5) / 0.2);
      pressY = pressCrushY + p * (pressRestY - pressCrushY);
      letterScaleY = 0.08;
    } else if (t < 0.82) {
      // Flat reveal
      pressY = pressRestY;
      letterScaleY = 0.08;
    } else {
      // Spring back
      const p = (t - 0.82) / 0.18;
      const springP = 1 - Math.pow(1 - p, 3);
      letterScaleY = 0.08 + springP * 0.92;
      if (p > 0.6 && p < 0.8) letterScaleY += 0.04;
    }

    if (pressRef.current) {
      // Press plate bottom edge position
      pressRef.current.position.y = pressY;
    }
    if (letterRef.current) {
      letterRef.current.scale.y = Math.max(0.05, letterScaleY);
      // Scale from the bottom: keep bottom at mBottom
      letterRef.current.position.y = mBottom + (mHeight * letterScaleY) / 2;
    }
  });

  const accentMat = useMemo(() => (
    <meshStandardMaterial
      color={accentColor}
      metalness={0.4}
      roughness={0.4}
      emissive={accentColor}
      emissiveIntensity={0.15}
    />
  ), [accentColor]);

  const metalMat = useMemo(() => (
    <meshStandardMaterial color="#444458" metalness={0.8} roughness={0.3} />
  ), []);

  // M shape: two vertical legs + two diagonals meeting at center valley
  // The diagonals go DOWN from the leg tops to a center valley point
  const barW = 0.18;
  const barD = 0.28;
  const h = mHeight;

  return (
    <group position={[0, -0.6, 0]}>
      {/* Base plate */}
      <mesh position={[0, baseY, 0]}>
        <boxGeometry args={[1.8, 0.15, 0.8]} />
        {metalMat}
      </mesh>

      {/* Letter M (crushable) — origin at center, scaled from bottom via position update */}
      <group ref={letterRef} position={[0, mBottom + h / 2, 0]}>
        {/* Left leg */}
        <mesh position={[-0.5, 0, 0]}>
          <boxGeometry args={[barW, h, barD]} />
          {accentMat}
        </mesh>
        {/* Left diagonal — goes from top-left DOWN to center valley */}
        <mesh position={[-0.25, 0.1, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[barW, h * 0.6, barD]} />
          {accentMat}
        </mesh>
        {/* Right diagonal — goes from top-right DOWN to center valley */}
        <mesh position={[0.25, 0.1, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[barW, h * 0.6, barD]} />
          {accentMat}
        </mesh>
        {/* Right leg */}
        <mesh position={[0.5, 0, 0]}>
          <boxGeometry args={[barW, h, barD]} />
          {accentMat}
        </mesh>
      </group>

      {/* Press assembly */}
      <group ref={pressRef} position={[0, pressRestY, 0]}>
        {/* Press plate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 0.15, 0.7]} />
          {metalMat}
        </mesh>
        {/* Piston rod */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
          {metalMat}
        </mesh>
        {/* Hydraulic cylinder */}
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.3, 8]} />
          <meshStandardMaterial color="#555570" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
