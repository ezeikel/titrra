'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  INJECTION_SITES,
  type InjectionSite,
  type RecentDose,
  SITE_LABELS,
} from '@titrra/types';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HumanModel } from '@/components/bodymap/HumanModel';
import { type BodyShape, bodyModelFor, type Landmarks } from '@/lib/body-shape';

type BodyMap3DProps = {
  selected: InjectionSite;
  suggested: InjectionSite;
  recent?: RecentDose[];
  onSelect: (site: InjectionSite) => void;
  bodyShape?: BodyShape;
};

// Brand palette (matches mobile + design tokens).
const TEAL = '#0e7c7b';
const TEAL_SOFT = '#4db6ac';
const WARN = '#c98a2b';
const IDLE = '#cbb89d';

// Per-site "how recently used" → 0 (rested/never) .. 1 (most recent). Ported
// from the mobile BodyMap so 2D/3D/web shade recency identically.
const recencyMap = (recent: RecentDose[] | undefined) => {
  const map = {} as Record<InjectionSite, number>;
  for (const s of INJECTION_SITES) map[s] = 0;
  if (!recent?.length) return map;
  recent.slice(0, 6).forEach((d, i) => {
    if (d.injectionSite && map[d.injectionSite] === 0) {
      map[d.injectionSite] = 1 - i / 6;
    }
  });
  return map;
};

// A single tappable injection-site anchor. On web, R3F's onClick fires natively
// off the WebGL canvas raycaster — no manual pick needed (unlike RN/wgpu).
const SiteAnchor = ({
  position,
  selected,
  suggested,
  warmth,
  onSelect,
}: {
  position: [number, number, number];
  selected: boolean;
  suggested: boolean;
  warmth: number;
  onSelect: () => void;
}) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!suggested || !matRef.current) return;
    matRef.current.emissiveIntensity =
      0.4 + 0.2 * Math.sin(state.clock.elapsedTime * 3);
  });

  const color = selected
    ? TEAL
    : warmth > 0
      ? WARN
      : suggested
        ? TEAL_SOFT
        : IDLE;

  return (
    <mesh
      position={position}
      scale={hovered ? 1.25 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Depth-tested so far-side markers hide behind the body when rotated. */}
      <sphereGeometry args={[0.05, 24, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        roughness={0.45}
        metalness={0}
        emissive={selected ? TEAL : suggested ? TEAL : WARN}
        emissiveIntensity={
          selected ? 0.4 : suggested ? 0.55 : warmth > 0 ? warmth * 0.3 : 0
        }
      />
    </mesh>
  );
};

// The rotatable body + the 6 site anchors. Camera framing matches mobile (a
// narrow FOV pulled back minimises perspective distortion).
const Body = ({
  selected,
  suggested,
  recent,
  onSelect,
  url,
  landmarks,
}: Omit<BodyMap3DProps, 'bodyShape'> & {
  url: string;
  landmarks: Landmarks;
}) => {
  const recency = recencyMap(recent);
  return (
    <group>
      <HumanModel url={url} height={1.8} />
      {INJECTION_SITES.map((s) => (
        <SiteAnchor
          key={s}
          position={landmarks[s]}
          selected={s === selected}
          suggested={s === suggested}
          warmth={recency[s]}
          onSelect={() => onSelect(s)}
        />
      ))}
    </group>
  );
};

// The mobile Skia/wgpu 3D body map, re-implemented for the web with standard
// WebGL (browsers have it natively — no WebGPU bridge needed). Drag to orbit
// (drei OrbitControls), click a site to select. Same props + look as mobile.
export const BodyMap3D = ({
  selected,
  suggested,
  recent,
  onSelect,
  bodyShape = 'UNSPECIFIED',
}: BodyMap3DProps) => {
  const model = bodyModelFor(bodyShape);
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);

  // Fetch the active model's precomputed landmarks (served from /public).
  useEffect(() => {
    let active = true;
    fetch(model.landmarksUrl)
      .then((r) => r.json())
      .then((data: Landmarks) => {
        if (active) setLandmarks(data);
      })
      .catch(() => {
        if (active) setLandmarks(null);
      });
    return () => {
      active = false;
    };
  }, [model.landmarksUrl]);

  return (
    <div className="flex flex-col items-center">
      <div className="h-[360px] w-full max-w-[340px]">
        <Canvas
          camera={{ fov: 18, position: [0, 0, 7.5] }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={1.8} color="#fff6e9" />
          <hemisphereLight args={['#fff4e0', '#e6dcc8', 1.0]} />
          <directionalLight
            position={[3, 5, 4]}
            intensity={2.4}
            color="#fff1dd"
          />
          <directionalLight
            position={[-3, 2, -4]}
            intensity={0.7}
            color="#dfeeec"
          />
          {landmarks ? (
            // key on bodyShape so switching figures cleanly remounts the loader.
            <Body
              key={bodyShape}
              url={model.url}
              landmarks={landmarks}
              selected={selected}
              suggested={suggested}
              recent={recent}
              onSelect={onSelect}
            />
          ) : null}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2 - 0.4}
            maxPolarAngle={Math.PI / 2 + 0.4}
          />
        </Canvas>
      </div>

      <p className="mt-1 font-semibold text-[14px] text-ink">
        {SITE_LABELS[selected]}
        {selected === suggested ? (
          <span className="font-normal text-[13px] text-muted-foreground">
            {' '}
            · suggested
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        Drag to rotate · click a site
      </p>
    </div>
  );
};

export default BodyMap3D;
