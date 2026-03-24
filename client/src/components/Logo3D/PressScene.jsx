import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTheme } from '../../theme/ThemeProvider';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function PressScene() {
  const pressRef = useRef();
  const letterRef = useRef();
  const { theme } = useTheme();
  const accentColor = theme['--accent'] || '#8b5cf6';

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
    <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.35} />
  ), []);

  // M shape built with exact coordinates
  // Legs at x = ±0.5, full height. Diagonals connect leg tops to center valley.
  const barW = 0.18;
  const barD = 0.28;
  const h = mHeight; // 0.9
  const halfH = h / 2;
  const legX = 0.5;        // leg center X
  const valleyY = -0.15;   // valley center Y (relative to group center, slightly below middle)
  const topY = halfH;      // top of legs Y (relative to group center)

  // Diagonal from top of left leg (−legX, topY) to center valley (0, valleyY)
  const dx = legX;          // horizontal distance: 0.5
  const dy = topY - valleyY; // vertical distance
  const diagLen = Math.sqrt(dx * dx + dy * dy);
  const diagAngle = Math.atan2(dx, dy); // angle from vertical

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
        <mesh position={[-legX, 0, 0]}>
          <boxGeometry args={[barW, h, barD]} />
          {accentMat}
        </mesh>
        {/* Left diagonal — from top of left leg to center valley */}
        <mesh
          position={[-legX / 2, (topY + valleyY) / 2, 0]}
          rotation={[0, 0, diagAngle]}
        >
          <boxGeometry args={[barW, diagLen, barD]} />
          {accentMat}
        </mesh>
        {/* Right diagonal — from top of right leg to center valley */}
        <mesh
          position={[legX / 2, (topY + valleyY) / 2, 0]}
          rotation={[0, 0, -diagAngle]}
        >
          <boxGeometry args={[barW, diagLen, barD]} />
          {accentMat}
        </mesh>
        {/* Right leg */}
        <mesh position={[legX, 0, 0]}>
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
          <meshStandardMaterial color="#9a9aa0" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
