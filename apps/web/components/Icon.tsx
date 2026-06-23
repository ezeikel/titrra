import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartLine,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faGear,
  faHeartPulse,
  faMinus,
  faPlus,
  faShieldHalved,
  faStar,
  faSyringe,
  faTriangleExclamation,
  faWeightScale,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Central Font Awesome Pro setup for the web app — the same friendly names as
// apps/mobile/components/Icon.tsx so the tab bar + screens share one icon
// vocabulary across web and mobile (matches the PTP / Chunky Crayon convention).
const ICONS = {
  syringe: faSyringe,
  'chart-line': faChartLine,
  'weight-scale': faWeightScale,
  'triangle-exclamation': faTriangleExclamation,
  gear: faGear,
  'heart-pulse': faHeartPulse,
  'chevron-right': faChevronRight,
  'chevron-left': faChevronLeft,
  'chevron-up': faChevronUp,
  'chevron-down': faChevronDown,
  plus: faPlus,
  minus: faMinus,
  check: faCheck,
  star: faStar,
  'shield-halved': faShieldHalved,
  xmark: faXmark,
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  icon: IconName;
  size?: number;
  className?: string;
};

// `size` is a pixel height (matches the mobile API); we map it to the SVG's
// font-size via fixed dimensions so web + mobile read identically.
export const Icon = ({ icon, size = 20, className }: IconProps) => (
  <FontAwesomeIcon
    icon={ICONS[icon]}
    className={className}
    style={{ width: size, height: size }}
  />
);

export default Icon;
