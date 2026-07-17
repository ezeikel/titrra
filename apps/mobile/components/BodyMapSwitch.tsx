import { Component, type ReactNode } from 'react';
import { BodyMap } from '@/components/BodyMap';
import { BodyMap3D } from '@/components/BodyMap3D';
import type { BodyShape } from '@/lib/body-shape';
import type { InjectionSite, RecentDose } from '@/lib/rotation';

// Feature flag for the 3D body map. Flip to false to ship the proven 2D Skia
// map instead — the swap is zero-regression (identical props). See
// docs/DESIGN-SYSTEM.md (body map).
const USE_3D_BODY_MAP = true;

type Props = {
  selected: InjectionSite;
  suggested: InjectionSite;
  recent?: RecentDose[];
  onSelect: (site: InjectionSite) => void;
  /** Which mannequin the 3D map shows; ignored by the 2D fallback. */
  bodyShape?: BodyShape;
};

// If the 3D Canvas (expo-gl / R3F) throws at runtime, fall back to the 2D map
// rather than crashing the Today screen. The fallback honors the same props.
class BodyMapErrorBoundary extends Component<
  Props & { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      // BodyMap (2D) doesn't take bodyShape — drop it alongside children.
      const {
        children: _children,
        bodyShape: _bodyShape,
        ...mapProps
      } = this.props;
      return <BodyMap {...mapProps} />;
    }
    return this.props.children;
  }
}

// Picks the 3D body map (behind a flag + error boundary) or the 2D one. The
// rest of the app imports this and never has to know which is rendering.
export const BodyMapSwitch = (props: Props) => {
  if (!USE_3D_BODY_MAP) return <BodyMap {...props} />;
  return (
    <BodyMapErrorBoundary {...props}>
      <BodyMap3D {...props} />
    </BodyMapErrorBoundary>
  );
};

export default BodyMapSwitch;
