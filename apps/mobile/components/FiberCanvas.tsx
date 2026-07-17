import {
  createRoot,
  events,
  extend,
  type ReconcilerRoot,
  unmountComponentAtNode,
} from '@react-three/fiber';
import {
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import { Canvas, type CanvasRef } from 'react-native-wgpu';
import * as THREE from 'three/webgpu';
import { makeWebGPURenderer, ReactNativeCanvas } from '@/lib/webgpu-renderer';

type FiberCanvasProps = {
  children: ReactNode;
  style?: ViewProps['style'];
  /** Logical px size of the canvas — used to convert taps to NDC for picking. */
  width: number;
  height: number;
};

// Imperative handle: lets the parent raycast a tap into the scene. RN's wgpu
// Canvas has a no-op addEventListener, so R3F's DOM-style pointer events never
// fire — we pick manually from a gesture-handler tap instead.
export type FiberCanvasHandle = {
  /** Raycast a tap (logical px, origin top-left) → the nearest hit Object3D. */
  pick: (x: number, y: number) => THREE.Object3D | null;
};

// Drives React Three Fiber on top of react-native-wgpu's Metal-backed Canvas.
// expo-gl's OpenGL ES backend renders NOTHING on the Apple-Silicon iOS
// simulator, so we render through Dawn → Metal instead (same backend Skia uses).
// Pattern from Expo's `with-webgpu` template: get a WebGPU context, build a
// three WebGPURenderer, configure R3F's reconciler imperatively, present() each
// frame.
export const FiberCanvas = forwardRef<FiberCanvasHandle, FiberCanvasProps>(
  ({ children, style, width, height }, handleRef) => {
    const root = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
    const canvasRef = useRef<CanvasRef>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.Camera | null>(null);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);

    const ready = useRef(false);
    const childrenRef = useRef(children);
    childrenRef.current = children;
    const sizeRef = useRef({ width, height });
    sizeRef.current = { width, height };

    // Register three's namespace with R3F's reconciler.
    // @ts-expect-error — extend accepts the full THREE namespace
    useMemo(() => extend(THREE), []);

    useImperativeHandle(
      handleRef,
      () => ({
        pick: (x, y) => {
          const scene = sceneRef.current;
          const camera = cameraRef.current;
          if (!scene || !camera) return null;
          const { width: w, height: h } = sizeRef.current;
          // Logical px (top-left origin) → normalized device coords [-1, 1].
          const ndc = new THREE.Vector2((x / w) * 2 - 1, -((y / h) * 2 - 1));
          raycaster.setFromCamera(ndc, camera);
          const hits = raycaster.intersectObjects(scene.children, true);
          return hits.length ? hits[0].object : null;
        },
      }),
      [raycaster],
    );

    // ── One-time setup (mount only) ──────────────────────────────────────────
    // Configure the R3F root ONCE; re-running every render tears down the tree
    // and cancels in-flight async work (e.g. the GLTF load).
    useEffect(() => {
      let cancelled = false;
      const context = canvasRef.current?.getContext('webgpu');
      if (!context) return;

      const renderer = makeWebGPURenderer(context);
      // @ts-expect-error — ReactNativeCanvas stands in for an HTMLCanvasElement
      const canvas = new ReactNativeCanvas(context.canvas) as HTMLCanvasElement;
      canvas.width = canvas.clientWidth * PixelRatio.get();
      canvas.height = canvas.clientHeight * PixelRatio.get();

      const size = {
        top: 0,
        left: 0,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };

      // three 0.184's WebGPURenderer throws if render() runs before init().
      const setup = async () => {
        await renderer.init();
        if (cancelled) return;
        const renderFrame = renderer.render.bind(renderer);
        renderer.render = (s: THREE.Scene, c: THREE.Camera) => {
          renderFrame(s, c);
          context.present();
        };

        if (!root.current) {
          root.current = createRoot(canvas);
        }
        await root.current.configure({
          size,
          events,
          gl: renderer,
          frameloop: 'always',
          dpr: 1,
        });
        if (cancelled) return;
        ready.current = true;
        // render() returns the zustand RootStore — read scene + camera from it
        // for manual tap picking (R3F's own events don't fire on the RN canvas).
        const store = root.current.render(childrenRef.current);
        const rootState = store.getState();
        sceneRef.current = rootState.scene;
        cameraRef.current = rootState.camera;
      };
      setup();

      return () => {
        cancelled = true;
        ready.current = false;
        sceneRef.current = null;
        cameraRef.current = null;
        if (root.current) root.current = null;
        if (canvas) unmountComponentAtNode(canvas);
      };
    }, []);

    // ── Children updates (no teardown) ───────────────────────────────────────
    useEffect(() => {
      if (ready.current && root.current) {
        root.current.render(children);
      }
    }, [children]);

    return <Canvas ref={canvasRef} style={style} />;
  },
);

FiberCanvas.displayName = 'FiberCanvas';

export default FiberCanvas;
