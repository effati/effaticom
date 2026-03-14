import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { pointer } from "./pointer";

function RotatingHead({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const angleRef = useRef(0);

  const { scene } = useGLTF("/headie.glb");

  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      mesh.geometry.center();
    }
  });

  useFrame(() => {
    const horizontalRadius = 4;
    const depthRadius = 2.5;
    const verticalRadius = 1;

    const isDirectInteraction = pointer.active && (pointer.source === "touch" || pointer.source === "mouse");
    const isLinger = pointer.active && pointer.source === "linger";
    const isGyro = pointer.active && pointer.source === "gyro";

    if (isDirectInteraction) {
      // Touch/mouse: compute direction from container center to pointer
      const el = containerRef.current;
      let normX = 0, normY = 0;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const maxDist = 600;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.min(1, dist / maxDist);
        normX = (dx / (dist || 1)) * scale;
        normY = -(dy / (dist || 1)) * scale;
      }
      const radius = 3.5;
      const maxAngle = Math.PI / 3;
      const angle = normX * maxAngle;
      const targetX = radius * Math.cos(angle);
      const targetY = -normY * verticalRadius;
      const targetZ = radius * Math.sin(angle);
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
    } else if (isLinger) {
      // Linger: soft tracking toward decaying touch position
      const el = containerRef.current;
      let normX = 0, normY = 0;
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const maxDist = 600;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.min(1, dist / maxDist);
        normX = (dx / (dist || 1)) * scale;
        normY = -(dy / (dist || 1)) * scale;
      }
      const radius = 3.5;
      const maxAngle = Math.PI / 3;
      const angle = normX * maxAngle;
      const targetX = radius * Math.cos(angle);
      const targetY = -normY * verticalRadius;
      const targetZ = radius * Math.sin(angle);
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.position.z += (targetZ - camera.position.z) * 0.03;
    } else if (isGyro) {
      // Gyro: tiltX/tiltY directly drive camera orbit
      const radius = 3.5;
      const maxAngle = Math.PI / 3;
      const angle = pointer.tiltX * maxAngle;
      const targetX = radius * Math.cos(angle);
      const targetY = -pointer.tiltY * verticalRadius;
      const targetZ = radius * Math.sin(angle);
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
    } else {
      // Idle: auto-orbit
      angleRef.current += 0.01;
      const angle = angleRef.current;
      camera.position.set(
        Math.max(2, Math.sin(angle) * horizontalRadius),
        Math.cos(angle) * verticalRadius,
        Math.cos(angle) * depthRadius
      );
    }
    camera.lookAt(0, 0, 0);
  });

  return (
    <primitive
      object={scene}
      ref={modelRef}
      position={[0, 0, 0]}
      rotation={[0, 5, 0]}
      scale={[10, 10, 10]}
    />
  );
}

export default function HeadViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full">
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 10, 10]} intensity={0.8} />
      <RotatingHead containerRef={containerRef} />
      <OrbitControls
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
    </div>
  );
}
