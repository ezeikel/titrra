import type { ViewStyle } from 'react-native';

// Soft, warm elevation presets — the single biggest "premium" lever the v1
// app was missing (it had zero shadows). Applied via `style={elevation.card}`
// because RN shadows are most reliable through StyleSheet, not className utils
// (matches the go-unbeaten / chunky-crayon pattern). iOS reads shadow*,
// Android reads elevation — both set so it looks right on each.

const warm = '#14201f'; // ink, so shadows read warm not blue-grey

export const elevation: Record<'card' | 'raised' | 'float', ViewStyle> = {
  // Resting card on the app background.
  card: {
    shadowColor: warm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  // A lifted element (selected card, summary hero).
  raised: {
    shadowColor: warm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  // Floating chrome — the glass tab bar, sheets.
  float: {
    shadowColor: warm,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 20,
  },
};

export default elevation;
