"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Lightformer,
  Sparkles,
} from "@react-three/drei";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { RingsFallback } from "./RingsFallback";

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function createBandGeometry({
  radius = 1,
  width = 0.16,
  thickness = 0.085,
  tubularSegments = 128,
  profileSegments = 32,
}: {
  radius?: number;
  width?: number;
  thickness?: number;
  tubularSegments?: number;
  profileSegments?: number;
} = {}) {
  const points: THREE.Vector2[] = [];

  for (let i = 0; i <= profileSegments; i++) {
    const t = i / profileSegments;
    const angle = t * Math.PI * 2;
    const inner = angle > Math.PI * 0.42 && angle < Math.PI * 1.58;
    // Face externa mais “joia”, interior comfort-fit
    const px = Math.cos(angle) * thickness * (inner ? 0.62 : 1.12);
    const shoulder = Math.pow(Math.abs(Math.sin(angle)), 1.65);
    const py =
      Math.sin(angle) * (width / 2) * THREE.MathUtils.lerp(1, 0.82, shoulder);
    points.push(new THREE.Vector2(radius + px, py));
  }

  const lathe = new THREE.LatheGeometry(points, tubularSegments);
  lathe.rotateX(Math.PI / 2);
  lathe.computeVertexNormals();
  return lathe;
}

function GoldMaterial({
  color = "#e6c07a",
  roughness = 0.1,
}: {
  color?: string;
  roughness?: number;
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={1}
      roughness={roughness}
      envMapIntensity={3.4}
      clearcoat={1}
      clearcoatRoughness={0.06}
      reflectivity={1}
      sheen={0.35}
      sheenRoughness={0.28}
      sheenColor="#fff6df"
    />
  );
}

function Diamond() {
  return (
    <group>
      {/* Pavilion */}
      <mesh position={[0, -0.01, 0]} rotation={[Math.PI, Math.PI / 5, 0]}>
        <coneGeometry args={[0.078, 0.11, 8, 1, true]} />
        <meshPhysicalMaterial
          color="#f4faff"
          metalness={0.05}
          roughness={0.01}
          transmission={0.97}
          thickness={0.7}
          ior={2.42}
          envMapIntensity={3.2}
          clearcoat={1}
          clearcoatRoughness={0}
          transparent
          side={THREE.DoubleSide}
          attenuationColor="#d9e8ff"
          attenuationDistance={0.35}
        />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 0.045, 0]} rotation={[0, Math.PI / 5, 0]}>
        <coneGeometry args={[0.078, 0.07, 8, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.08}
          roughness={0.01}
          transmission={0.95}
          thickness={0.45}
          ior={2.4}
          envMapIntensity={3}
          clearcoat={1}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Table */}
      <mesh position={[0, 0.078, 0]} rotation={[Math.PI / 2, 0, Math.PI / 8]}>
        <circleGeometry args={[0.042, 8]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.2}
          roughness={0.02}
          transmission={0.7}
          thickness={0.08}
          ior={2.2}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[0.024, 0.05, 0.04]}>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.028, 0.028, 0.038]}>
        <sphereGeometry args={[0.008, 10, 10]} />
        <meshBasicMaterial color="#e8f2ff" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

function ProngSetting() {
  const prongs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
        return {
          position: [
            Math.cos(angle) * 0.058,
            0.01,
            Math.sin(angle) * 0.058,
          ] as [number, number, number],
          rotation: [0.55, -angle + Math.PI / 2, 0] as [number, number, number],
        };
      }),
    [],
  );

  return (
    <group position={[0, 0.97, 0]}>
      <mesh position={[0, -0.036, 0]}>
        <cylinderGeometry args={[0.068, 0.095, 0.058, 40]} />
        <GoldMaterial color="#dcb05f" roughness={0.14} />
      </mesh>
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.088, 0.016, 24, 80]} />
        <GoldMaterial color="#dcb05f" roughness={0.14} />
      </mesh>
      {prongs.map((prong, i) => (
        <mesh key={i} position={prong.position} rotation={prong.rotation}>
          <capsuleGeometry args={[0.0075, 0.072, 6, 14]} />
          <GoldMaterial color="#dcb05f" roughness={0.12} />
        </mesh>
      ))}
      <group position={[0, 0.02, 0]}>
        <Diamond />
      </group>
    </group>
  );
}

function EdgeRail({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.0048, 16, 180]} />
      <GoldMaterial color={color} roughness={0.18} />
    </mesh>
  );
}

function RingPair() {
  const group = useRef<Group>(null);

  const bandGeo = useMemo(
    () => createBandGeometry({ radius: 0.95, width: 0.175, thickness: 0.092 }),
    [],
  );
  const engagementGeo = useMemo(
    () => createBandGeometry({ radius: 0.92, width: 0.128, thickness: 0.078 }),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.14;
    group.current.rotation.x = Math.sin(t * 0.26) * 0.05 + 0.16;
    group.current.rotation.z = Math.sin(t * 0.16) * 0.035;
    group.current.position.y = Math.sin(t * 0.42) * 0.035;
  });

  return (
    <Float speed={0.8} rotationIntensity={0.08} floatIntensity={0.16}>
      <group ref={group} position={[0, 0.38, 0]} scale={1.42}>
        <group position={[-0.16, -0.1, 0.14]} rotation={[1.58, 0.62, 0.42]}>
          <mesh geometry={bandGeo}>
            <GoldMaterial color="#d4a18c" roughness={0.14} />
          </mesh>
          <group position={[0, 0, 0.086]}>
            <EdgeRail radius={0.95} color="#c08b74" />
          </group>
          <group position={[0, 0, -0.086]}>
            <EdgeRail radius={0.95} color="#c08b74" />
          </group>
        </group>

        <group position={[0.2, 0.16, -0.1]} rotation={[1.32, -0.78, -0.18]}>
          <mesh geometry={engagementGeo}>
            <GoldMaterial color="#e6c07a" />
          </mesh>
          <group position={[0, 0, 0.062]}>
            <EdgeRail radius={0.92} color="#d4a85c" />
          </group>
          <group position={[0, 0, -0.062]}>
            <EdgeRail radius={0.92} color="#d4a85c" />
          </group>
          <ProngSetting />
        </group>
      </group>
    </Float>
  );
}

export function HeroScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-scene" aria-hidden ref={rootRef}>
      {!webgl && <RingsFallback />}
      <SceneErrorBoundary>
      <Canvas
        camera={{ position: [0, 0.5, 2.85], fov: 34 }}
        dpr={[1, 1.25]}
        frameloop={inView ? "always" : "never"}
        style={{ width: "100%", height: "100%" }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.55,
        }}
        onCreated={() => setWebgl(true)}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[2.2, 4.2, 3]} intensity={3.2} color="#ffe8c4" />
        <spotLight
          position={[3.8, 6, 2]}
          angle={0.45}
          penumbra={0.9}
          intensity={70}
          color="#fff5e4"
          decay={0}
        />
        <pointLight position={[-1.3, 0.4, 1.3]} intensity={16} color="#c0d0ff" decay={0} />

        <RingPair />

        <Sparkles
          count={14}
          scale={[3.2, 2.4, 2]}
          size={2.2}
          speed={0.18}
          opacity={0.45}
          color="#ffe9c4"
          position={[0, 0.35, 0]}
        />

        <Environment resolution={128}>
          <Lightformer
            intensity={6}
            position={[0, 5.8, 0]}
            scale={[12, 2, 1]}
            form="rect"
            color="#fff8ef"
          />
          <Lightformer
            intensity={2}
            position={[5.8, 1.5, 2]}
            scale={[2.5, 6, 1]}
            form="rect"
            color="#ffd9b8"
          />
          <Lightformer
            intensity={1.3}
            position={[-5.4, 0.7, 1.8]}
            scale={[2.5, 5, 1]}
            form="rect"
            color="#c9d8ff"
          />
          <Lightformer
            intensity={0.85}
            position={[0, -2.8, -2]}
            scale={[10, 5, 1]}
            form="ring"
            color="#8a6a4a"
          />
        </Environment>
      </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
