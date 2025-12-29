'use client';

import { useGLTF } from '@react-three/drei';

export function FoxModel() {
  const { scene } = useGLTF('/model/fox/Fox.gltf');

  return <primitive object={scene} scale={0.02} />;
}

// Preload the model
useGLTF.preload('/model/fox/Fox.gltf');
