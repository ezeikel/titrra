// Central Font Awesome setup for mobile. The shared friendly names keep the
// tab bar + screens consistent with the web app's iconography.

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartLine,
  faChevronLeft,
  faChevronRight,
  faGear,
  faHeartPulse,
  faSyringe,
  faTriangleExclamation,
  faWeightScale,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { ColorValue } from 'react-native';

const ICONS = {
  syringe: faSyringe,
  'chart-line': faChartLine,
  'weight-scale': faWeightScale,
  'triangle-exclamation': faTriangleExclamation,
  gear: faGear,
  'heart-pulse': faHeartPulse,
  'chevron-right': faChevronRight,
  'chevron-left': faChevronLeft,
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  icon: IconName;
  size?: number;
  // Accept RN's ColorValue (what expo-router's tabBarIcon passes) as well as a
  // plain hex string. FontAwesomeIcon accepts a string at runtime; coerce here.
  color?: ColorValue;
};

export const Icon = ({ icon, size = 20, color = '#0e1a1a' }: IconProps) => (
  <FontAwesomeIcon icon={ICONS[icon]} size={size} color={color as string} />
);

export default Icon;
