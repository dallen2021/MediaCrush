import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import PressScene from './PressScene';

export default function Logo3D() {
  return (
    <div style={{ width: 48, height: 54, flexShrink: 0 }}>
      <Canvas
        orthographic
        camera={{ zoom: 28, position: [3, 3, 5], near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <Suspense fallback={null}>
          <PressScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
