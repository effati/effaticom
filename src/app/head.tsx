import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const mouse = { x: 0, y: 0, hasMouse: false, screenX: 0, screenY: 0, centerX: 0, centerY: 0 };

function RotatingHead() {
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

    let targetX, targetY, targetZ;

    if (mouse.hasMouse) {
      const radius = 3.5;
      const maxAngle = Math.PI / 3;
      const angle = mouse.x * maxAngle;
      targetX = radius * Math.cos(angle);
      targetY = -mouse.y * verticalRadius;
      targetZ = radius * Math.sin(angle);
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
    } else {
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.hasMouse = true;
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        // Store the center of the container and cursor position
        mouse.centerX = rect.left + rect.width / 2;
        mouse.centerY = rect.top + rect.height / 2;
        mouse.screenX = e.clientX;
        mouse.screenY = e.clientY;
        // Direction from head center to cursor, normalized and clamped
        const dx = e.clientX - mouse.centerX;
        const dy = e.clientY - mouse.centerY;
        const maxDist = 600;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.min(1, dist / maxDist);
        mouse.x = (dx / (dist || 1)) * scale;
        mouse.y = -(dy / (dist || 1)) * scale;
      }
    };
    const handleMouseLeave = () => {
      mouse.hasMouse = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 10, 10]} intensity={0.8} />
      <RotatingHead />
      <OrbitControls
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
    </div>
  );
}
