import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as THREE from 'three/webgpu';
import { FiberCanvas } from '@/components/FiberCanvas';
import { HumanModel } from '@/components/HumanModel';
import {
  INJECTION_SITES,
  type InjectionSite,
  type RecentDose,
  SITE_LABELS,
} from '@/lib/rotation';

type BodyMap3DProps = {
  selected: InjectionSite;
  suggested: InjectionSite;
  recent?: RecentDose[];
  onSelect: (site: InjectionSite) => void;
};

// Brand palette (matches the 2D BodyMap + design tokens).
const TEAL = '#0e7c7b';
const TEAL_SOFT = '#4db6ac';
const WARN = '#c98a2b';
const IDLE = '#cbb89d';

// Local anchor offsets on the body group (front of body = +Z; orbit to reach
// the back of the same limbs). Mirrors lib/rotation L/R semantics — confirmed
// visually on device. The whole group orbits, so anchors stay attached.
// Anchors in the centered-model space (origin = body's middle, ~1.8 tall, y up,
// +z toward viewer). Tuned visually against the Quaternius human; fine-tune on
// device. L/R are the model's left/right (confirm orientation on first render).
const ANCHORS: Record<InjectionSite, [number, number, number]> = {
  ABDOMEN_L: [-0.11, 0.12, 0.22],
  ABDOMEN_R: [0.11, 0.12, 0.22],
  THIGH_L: [-0.11, -0.42, 0.18],
  THIGH_R: [0.11, -0.42, 0.18],
  ARM_L: [-0.27, 0.5, 0.16],
  ARM_R: [0.27, 0.5, 0.16],
};

// Per-site "how recently used" → 0 (rested/never) .. 1 (used most recently).
// Ported verbatim from BodyMap.tsx so 2D and 3D shade recency identically.
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

type RotRef = RefObject<{ x: number; y: number }>;

// A single tappable injection-site anchor. R3F's built-in raycaster handles the
// hit-test — onClick fires only on a clean tap (so a drag-orbit never selects).
const SiteAnchor = ({
  site,
  selected,
  suggested,
  warmth,
  onSelect,
}: {
  site: InjectionSite;
  selected: boolean;
  suggested: boolean;
  warmth: number;
  onSelect: (site: InjectionSite) => void;
}) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Pulse the suggested glow each frame (frameloop is "always").
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
    // renderOrder + depthTest off → markers always draw on top of the body so
    // all 6 sites stay visible (a site picker should show every option, not
    // hide ones the torso occludes).
    <mesh
      position={ANCHORS[site]}
      renderOrder={10}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(site);
      }}
    >
      <sphereGeometry args={[0.07, 24, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        roughness={0.45}
        metalness={0}
        depthTest={false}
        emissive={selected ? TEAL : suggested ? TEAL : WARN}
        emissiveIntensity={
          selected ? 0.35 : suggested ? 0.5 : warmth > 0 ? warmth * 0.3 : 0
        }
      />
    </mesh>
  );
};

// The rotatable body: a friendly low-poly mannequin from three primitives
// (capsules read as soft joints) plus the 6 site anchors, all in one group that
// the drag gesture orbits.
const Body = ({
  selected,
  suggested,
  recent,
  onSelect,
  rot,
}: BodyMap3DProps & { rot: RotRef }) => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const recency = useMemo(() => recencyMap(recent), [recent]);

  // FiberCanvas doesn't take a camera prop, so frame the body head-on here.
  useEffect(() => {
    camera.position.set(0, 0, 2.6);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Critically-damped follow toward the gesture target (frameloop is "always"
  // on the WebGPU canvas, so no manual invalidate is needed).
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const target = rot.current ?? { x: 0, y: 0 };
    g.rotation.y += (target.y - g.rotation.y) * 0.25;
    g.rotation.x += (target.x - g.rotation.x) * 0.25;
  });

  return (
    <group ref={group}>
      {/* Real CC0 human model (normalized to height 1.8, centered on origin).
          While it loads, the procedural fallback below keeps something on screen. */}
      <HumanModel height={1.8} />

      {/* tappable injection-site anchors — positioned in the centered-model
          space (origin at the body's middle; y up, +z toward the viewer). */}
      {INJECTION_SITES.map((s) => (
        <SiteAnchor
          key={s}
          site={s}
          selected={s === selected}
          suggested={s === suggested}
          warmth={recency[s]}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
};

// Skia's 2D body map, re-imagined as a true rotatable 3D one (React Three Fiber
// via react-native-wgpu / Metal — expo-gl's OpenGL ES doesn't paint on the iOS
// simulator). Drag to orbit; tap a site to select. Same props as BodyMap, so
// it's a drop-in swap. The suggested site glows teal; the selected fills teal;
// recently-used sites carry a warm "resting" tint.
export const BodyMap3D = ({
  selected,
  suggested,
  recent,
  onSelect,
}: BodyMap3DProps) => {
  // Rotation target lives in a ref so gesture mutations never re-render React;
  // the useFrame loop reads it each frame.
  const rot = useRef({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          start.current = { ...rot.current };
        })
        .onChange((e) => {
          rot.current.y = start.current.y + e.translationX * 0.01;
          rot.current.x = Math.max(
            -0.4,
            Math.min(0.4, start.current.x + e.translationY * 0.01),
          );
        })
        // Handlers must run on the JS thread to mutate the ref the R3F loop reads.
        .runOnJS(true),
    [],
  );

  // Explicit pixel dimensions — the WebGPU canvas needs a definite size.
  const canvasW = Math.max(
    240,
    Math.min(Dimensions.get('window').width - 48, 340),
  );
  const canvasH = 280;

  return (
    <View className="items-center">
      {/* Gesture on the OUTER view so a drag rotates the body. The sized view
          gives the WebGPU canvas a definite drawing buffer. */}
      <GestureDetector gesture={pan}>
        <View
          collapsable={false}
          style={{
            width: canvasW,
            height: canvasH,
            // Sand backdrop behind the (transparent) WebGPU surface, rounded
            // into a soft card. WebGPURenderer's clear color / scene.background
            // isn't reliably honored under the imperative root, so the RN view
            // colour is the dependable way to set the background.
            backgroundColor: '#f7f4ed',
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <FiberCanvas style={{ width: canvasW, height: canvasH }}>
            <ambientLight intensity={2.2} color="#fff6e9" />
            <hemisphereLight args={['#fff4e0', '#e6dcc8', 1.2]} />
            <directionalLight
              position={[3, 5, 4]}
              intensity={2.6}
              color="#fff1dd"
            />
            <directionalLight
              position={[-3, 2, -4]}
              intensity={0.8}
              color="#dfeeec"
            />
            <Body
              selected={selected}
              suggested={suggested}
              recent={recent}
              onSelect={onSelect}
              rot={rot}
            />
          </FiberCanvas>
        </View>
      </GestureDetector>

      {/* Selected label — matches the 2D component so the swap is 1:1. */}
      <Text className="mt-1 font-sans-semibold text-[14px] text-ink">
        {SITE_LABELS[selected]}
        {selected === suggested ? (
          <Text className="font-sans text-[13px] text-muted"> · suggested</Text>
        ) : null}
      </Text>
      <Text className="mt-0.5 font-sans text-[12px] text-faint">
        Drag to rotate · tap a site
      </Text>
    </View>
  );
};

export default BodyMap3D;
