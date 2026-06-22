import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  INJECTION_SITES,
  type InjectionSite,
  type RecentDose,
  SITE_LABELS,
} from '@/lib/rotation';

type BodyMapProps = {
  selected: InjectionSite;
  suggested: InjectionSite;
  recent?: RecentDose[];
  onSelect: (site: InjectionSite) => void;
};

// Normalized [0..1] anchor points on the body for each site (x across, y down).
// Front-facing silhouette: abdomen mid-torso L/R, thighs lower L/R, upper arms.
const ANCHORS: Record<InjectionSite, { x: number; y: number }> = {
  ABDOMEN_R: { x: 0.41, y: 0.46 },
  ABDOMEN_L: { x: 0.59, y: 0.46 },
  THIGH_R: { x: 0.42, y: 0.68 },
  THIGH_L: { x: 0.58, y: 0.68 },
  ARM_R: { x: 0.22, y: 0.4 },
  ARM_L: { x: 0.78, y: 0.4 },
};

// A simple, friendly humanoid silhouette as an SVG path (head, torso, arms,
// legs) scaled into the canvas box. Hand-tuned to read as a body, not anatomy.
const BODY_PATH =
  'M50,6 C44,6 39,11 39,17 C39,23 44,28 50,28 C56,28 61,23 61,17 C61,11 56,6 50,6 Z ' + // head
  'M42,30 L58,30 C64,30 70,33 72,40 L78,62 C79,66 74,68 72,64 L67,46 L66,58 ' + // r-shoulder→arm
  'C71,72 71,86 69,98 C68,101 63,101 63,98 C63,86 61,72 58,60 L58,60 ' + // r-leg
  'L42,60 C39,72 37,86 37,98 C37,101 32,101 32,98 C30,86 30,72 34,58 L33,46 L28,64 ' + // l-leg/arm
  'C26,68 21,66 22,62 L28,40 C30,33 36,30 42,30 Z';

const TEAL = '#0e7c7b';
const TEAL_TINT = '#e2f1ef';
const WARN = '#c98a2b';
const BODY_FILL = '#eceae3';
const BODY_STROKE = '#d8d3c6';

// Per-site "how recently used" → 0 (rested/never) .. 1 (used most recently).
const recencyMap = (recent: RecentDose[] | undefined) => {
  const map = {} as Record<InjectionSite, number>;
  for (const s of INJECTION_SITES) map[s] = 0;
  if (!recent?.length) return map;
  // Most-recent gets the strongest tint; fade over the last 6 doses.
  recent.slice(0, 6).forEach((d, i) => {
    if (d.injectionSite && map[d.injectionSite] === 0) {
      map[d.injectionSite] = 1 - i / 6;
    }
  });
  return map;
};

// Skia-rendered injection-site body map — the signature rotation feature as a
// real anatomical diagram instead of a chip grid. Tappable zones; the suggested
// site glows, the selected site fills teal, recently-used sites carry a warm
// "resting" tint so you can see at a glance where your skin needs a break.
export const BodyMap = ({
  selected,
  suggested,
  recent,
  onSelect,
}: BodyMapProps) => {
  const size = 220; // canvas px (square-ish body box)
  const W = size;
  const H = size * 1.18;
  const recency = useMemo(() => recencyMap(recent), [recent]);

  const path = useMemo(() => {
    const p = Skia.Path.MakeFromSVGString(BODY_PATH);
    if (!p) return null;
    // BODY_PATH is authored in a ~100×104 box; scale to the canvas.
    const m = Skia.Matrix();
    m.scale(W / 100, H / 104);
    p.transform(m);
    return p;
  }, [W, H]);

  return (
    <View className="items-center">
      <View style={{ width: W, height: H }}>
        <Canvas style={{ width: W, height: H }}>
          {path ? <Path path={path} color={BODY_FILL} style="fill" /> : null}
          {path ? (
            <Path
              path={path}
              color={BODY_STROKE}
              style="stroke"
              strokeWidth={1.5}
            />
          ) : null}

          {/* Site markers */}
          {INJECTION_SITES.map((s) => {
            const a = ANCHORS[s];
            const cx = a.x * W;
            const cy = a.y * H;
            const isSel = s === selected;
            const isSug = s === suggested;
            const warmth = recency[s];
            return (
              <Group key={s}>
                {/* Suggested glow ring */}
                {isSug && !isSel ? (
                  <Circle cx={cx} cy={cy} r={15} color={TEAL_TINT} />
                ) : null}
                {/* Recency tint halo (warm = recently used → needs rest) */}
                {warmth > 0 && !isSel ? (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={13}
                    color={WARN}
                    opacity={0.12 + warmth * 0.22}
                  />
                ) : null}
                {/* The dot */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isSel ? 11 : 8}
                  color={isSel ? TEAL : '#ffffff'}
                />
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isSel ? 11 : 8}
                  color={isSel ? TEAL : isSug ? TEAL : '#c9c3b4'}
                  style="stroke"
                  strokeWidth={2}
                />
              </Group>
            );
          })}
        </Canvas>

        {/* Transparent tap targets over each marker (Skia canvas isn't
            interactive, so overlay Pressables positioned at the anchors). */}
        {INJECTION_SITES.map((s) => {
          const a = ANCHORS[s];
          const hit = 44;
          return (
            <Pressable
              key={s}
              onPress={() => onSelect(s)}
              accessibilityRole="radio"
              accessibilityState={{ selected: s === selected }}
              accessibilityLabel={`Injection site ${SITE_LABELS[s]}${
                s === suggested ? ', suggested' : ''
              }`}
              style={{
                position: 'absolute',
                left: a.x * W - hit / 2,
                top: a.y * H - hit / 2,
                width: hit,
                height: hit,
              }}
            />
          );
        })}
      </View>

      {/* Selected label */}
      <Text className="mt-1 font-sans-semibold text-[14px] text-ink">
        {SITE_LABELS[selected]}
        {selected === suggested ? (
          <Text className="font-sans text-[13px] text-muted"> · suggested</Text>
        ) : null}
      </Text>
    </View>
  );
};

export default BodyMap;
