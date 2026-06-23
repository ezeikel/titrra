import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as THREE from 'three/webgpu';
import { FiberCanvas, type FiberCanvasHandle } from '@/components/FiberCanvas';
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

// Injection-site marker positions, computed OFFLINE by scanning the model mesh
// at standard anatomical height fractions (belly ~60%, upper thigh ~42%, upper
// arm ~70%) and snapping to the real skin surface — see scripts/bake-mannequin.
// This is robust + scalable: the same scan produces correct sites for ANY
// humanoid model (e.g. the female mannequin) with no hand-tuned coordinates.
// Already in baked-mesh space: origin = body middle, ~1.8 tall, y up, +z front.
import SITE_POSITIONS from '@/assets/models/mannequin-static-landmarks.json';

const ANCHORS = SITE_POSITIONS as Record<
  InjectionSite,
  [number, number, number]
>;

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
  position,
  selected,
  suggested,
  warmth,
}: {
  site: InjectionSite;
  position: [number, number, number];
  selected: boolean;
  suggested: boolean;
  warmth: number;
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
    // position comes from a surface raycast (see placeAnchors). userData.siteId
    // is read by the tap raycaster (R3F's onClick can't fire on the wgpu canvas).
    <mesh position={position} userData={{ siteId: site }}>
      {/* Depth-tested (no renderOrder hack) so markers on the far side are
          correctly hidden behind the body when you rotate away. */}
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

// The rotatable body: a friendly low-poly mannequin from three primitives
// (capsules read as soft joints) plus the 6 site anchors, all in one group that
// the drag gesture orbits.
const Body = ({
  selected,
  suggested,
  recent,
  rot,
}: Omit<BodyMap3DProps, 'onSelect'> & { rot: RotRef }) => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const recency = useMemo(() => recencyMap(recent), [recent]);

  // FiberCanvas doesn't take a camera prop, so frame the body head-on here. A
  // narrow FOV + pulled-back camera minimises perspective distortion (a wide
  // FOV up close makes the body look foreshortened/viewed-from-above).
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 18;
    // Slightly above + pulled well back, looking dead-level at the torso (the
    // body spans y≈[-0.9, 0.9]; aim at y≈0 for a head-on standing view).
    cam.position.set(0, 0, 7.5);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
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
      {/* Real mannequin (normalized to ~1.8 tall, centered). */}
      <HumanModel height={1.8} />

      {/* Tappable injection-site anchors at the precomputed surface landmarks. */}
      {INJECTION_SITES.map((s) => (
        <SiteAnchor
          key={s}
          site={s}
          position={ANCHORS[s]}
          selected={s === selected}
          suggested={s === suggested}
          warmth={recency[s]}
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
  const canvasRef = useRef<FiberCanvasHandle>(null);

  // Explicit pixel dimensions — the WebGPU canvas needs a definite size.
  const canvasW = Math.max(
    240,
    Math.min(Dimensions.get('window').width - 48, 340),
  );
  const canvasH = 320;

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
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
      .runOnJS(true);

    // A clean tap raycasts into the scene and selects the hit site. R3F's
    // onClick can't fire on the RN wgpu canvas, so we pick manually here.
    const tap = Gesture.Tap()
      .maxDuration(250)
      .onEnd((e) => {
        const hit = canvasRef.current?.pick(e.x, e.y);
        // Walk up to the anchor mesh carrying userData.siteId.
        let o = hit;
        while (o) {
          const id = o.userData?.siteId as InjectionSite | undefined;
          if (id) {
            onSelect(id);
            return;
          }
          o = o.parent;
        }
      })
      .runOnJS(true);

    // Pan and tap coexist: a drag rotates, a clean tap selects.
    return Gesture.Race(pan, tap);
  }, [onSelect]);

  return (
    <View className="items-center">
      {/* Gesture wraps the sized view (which gives the WebGPU canvas a definite
          drawing buffer). Background is TRANSPARENT — the canvas blends into the
          surrounding card. */}
      <GestureDetector gesture={gesture}>
        <View
          collapsable={false}
          style={{ width: canvasW, height: canvasH }}
        >
          <FiberCanvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{ width: canvasW, height: canvasH }}
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
            <Body
              selected={selected}
              suggested={suggested}
              recent={recent}
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
