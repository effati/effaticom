import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function RotatingHead() {
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  let angle = 0;

  const { scene } = useGLTF("/headie.glb");

  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      mesh.geometry.center();
    }
  });

  useFrame(() => {
    angle += 0.01;
    const horizontalRadius = 3;
    const depthRadius = 5;
    const verticalRadius = 3;

    camera.position.set(
      Math.sin(angle) * horizontalRadius,
      Math.sin(angle) * verticalRadius,
      Math.cos(angle) * depthRadius
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <primitive
      object={scene}
      ref={modelRef}
      position={[0, 0, 0]}
      rotation={[0, 0, 0.6]}
      scale={[10, 10, 10]}
    />
  );
}

export default function HeadViewer() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.8} />
      {/* <directionalLight position={[10, 10, 5]} intensity={1} /> */}
      <pointLight position={[0, 10, 10]} intensity={0.8} />
      <RotatingHead />
      <OrbitControls
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
  );
}
