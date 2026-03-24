import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import PressScene from './PressScene';

export default function Logo3D() {
  return (
    <div style={{ width: 52, height: 58, flexShrink: 0 }}>
      <Canvas
        orthographic
        camera={{ zoom: 22, position: [4, 2.5, 5], near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 8, 5]} intensity={2.5} />
        <directionalLight position={[-3, 2, 4]} intensity={1.2} />
        <Suspense fallback={null}>
          <PressScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
