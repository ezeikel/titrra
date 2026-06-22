import {
  createRoot,
  events,
  extend,
  type ReconcilerRoot,
  unmountComponentAtNode,
} from '@react-three/fiber';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { PixelRatio, type ViewProps } from 'react-native';
import { Canvas, type CanvasRef } from 'react-native-wgpu';
import * as THREE from 'three/webgpu';
import { makeWebGPURenderer, ReactNativeCanvas } from '@/lib/webgpu-renderer';

type FiberCanvasProps = {
  children: ReactNode;
  style?: ViewProps['style'];
};

// Drives React Three Fiber on top of react-native-wgpu's Metal-backed Canvas.
// expo-gl's OpenGL ES backend renders NOTHING on the Apple-Silicon iOS
// simulator, so we render through Dawn → Metal instead (same backend Skia uses,
// which proves Metal paints on this sim). Pattern from Expo's `with-webgpu`
// template: get a WebGPU context, build a three WebGPURenderer, then configure
// R3F's reconciler imperatively and present() the drawable after each frame.
export const FiberCanvas = ({ children, style }: FiberCanvasProps) => {
  const root = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const canvasRef = useRef<CanvasRef>(null);

  const ready = useRef(false);
  const childrenRef = useRef(children);
  childrenRef.current = children;

  // Register three's namespace with R3F's reconciler (so <mesh>, lights, etc.
  // resolve against the WebGPU build).
  // @ts-expect-error — extend accepts the full THREE namespace
  useMemo(() => extend(THREE), []);

  // ── One-time setup (mount only) ────────────────────────────────────────────
  // Init the renderer + configure the R3F root ONCE. Re-running this every
  // render would tear down and rebuild the whole 3D tree, cancelling in-flight
  // async work (e.g. the GLTF model load → CFNetwork -999) and thrashing the GPU.
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

    // three 0.184's WebGPURenderer throws if render() runs before init()
    // resolves. R3F starts its frameloop synchronously, so we MUST await
    // init() BEFORE configuring the root (not inside onCreated, which races).
    const setup = async () => {
      await renderer.init();
      if (cancelled) return;
      // Present the Metal drawable after each frame.
      const renderFrame = renderer.render.bind(renderer);
      renderer.render = (s: THREE.Scene, c: THREE.Camera) => {
        renderFrame(s, c);
        context.present();
      };

      if (!root.current) {
        root.current = createRoot(canvas);
      }
      root.current.configure({
        size,
        events,
        gl: renderer,
        frameloop: 'always',
        dpr: 1,
      });
      ready.current = true;
      root.current.render(childrenRef.current);
    };
    setup();

    return () => {
      cancelled = true;
      ready.current = false;
      if (root.current) {
        root.current = null;
      }
      if (canvas) unmountComponentAtNode(canvas);
    };
  }, []);

  // ── Children updates ───────────────────────────────────────────────────────
  // Push fresh children (selected/suggested/recent state) into the existing
  // root WITHOUT tearing it down. Safe to call before setup completes (skipped).
  useEffect(() => {
    if (ready.current && root.current) {
      root.current.render(children);
    }
  }, [children]);

  return <Canvas ref={canvasRef} style={style} />;
};

export default FiberCanvas;
