import type { NativeCanvas } from 'react-native-wgpu';
import * as THREE from 'three/webgpu';

// Wraps react-native-wgpu's NativeCanvas in a minimal DOM-canvas-like object so
// three's WebGPURenderer (which expects an HTMLCanvasElement) can use it. From
// Expo's official `with-webgpu` template. The 3D body map renders through this
// (Dawn → Metal) because expo-gl's OpenGL ES is dead on the iOS simulator.
export class ReactNativeCanvas {
  constructor(private canvas: NativeCanvas) {}

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  set width(width: number) {
    this.canvas.width = width;
  }

  set height(height: number) {
    this.canvas.height = height;
  }

  get clientWidth() {
    return this.canvas.width;
  }

  get clientHeight() {
    return this.canvas.height;
  }

  set clientWidth(width: number) {
    this.canvas.width = width;
  }

  set clientHeight(height: number) {
    this.canvas.height = height;
  }

  addEventListener(_type: string, _listener: unknown) {
    // no-op (R3F events are driven separately)
  }

  removeEventListener(_type: string, _listener: unknown) {
    // no-op
  }

  dispatchEvent(_event: unknown) {
    // no-op
  }

  setPointerCapture() {
    // no-op
  }

  releasePointerCapture() {
    // no-op
  }
}

export const makeWebGPURenderer = (
  context: GPUCanvasContext,
  { antialias = true }: { antialias?: boolean } = {},
) => {
  const renderer = new THREE.WebGPURenderer({
    antialias,
    // @ts-expect-error — ReactNativeCanvas stands in for an HTMLCanvasElement
    canvas: new ReactNativeCanvas(context.canvas),
    context,
  });
  // Transparent clear so the wrapping RN View's sand backdrop shows through
  // (the body map sets backgroundColor on its container). Alpha 0 = see-through.
  renderer.setClearColor(new THREE.Color('#f7f4ed'), 0);
  return renderer;
};
