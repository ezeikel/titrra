import { Asset } from 'expo-asset';
// expo-file-system 56 moved readAsStringAsync + EncodingType to the /legacy
// entrypoint (the main export is the new File/Paths API). Using /legacy here.
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three/webgpu';

// Decode a base64 string to a Uint8Array (Hermes provides atob via core-js).
const base64ToBytes = (b64: string): Uint8Array => {
  const binary = global.atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

// CC0 stylized low-poly human (Quaternius "Animated Human"). We render its rest
// pose — no animations played. Loaded from the bundled .glb via expo-asset.
const HUMAN_GLB = require('@/assets/models/human.glb');

const SKIN = '#d9c7b0';

// Loads + normalizes the human GLB: centers it on the origin and scales it to a
// target height, so the camera framing + anchor coordinates are stable
// regardless of the model's authored units. Returns null while loading.
const useHumanModel = (targetHeight = 1.8) => {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const asset = Asset.fromModule(HUMAN_GLB);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      // GLTFLoader's FileLoader uses fetch(), and RN's fetch does NOT support
      // file:// URIs, so loader.load(uri) silently fails on a bundled asset.
      // Read the bytes ourselves (via expo-file-system's /legacy API — the new
      // SDK-56 File API dropped readAsStringAsync) and GLTFLoader.parse() them.
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (cancelled) return;
      const bytes = base64ToBytes(b64);
      const loader = new GLTFLoader();
      loader.parse(
        bytes.buffer as ArrayBuffer,
        '',
        (gltf) => {
          if (cancelled) return;
          const root = gltf.scene;
          // Recolor to the calm matte skin tone, preserving skinning: a
          // SkinnedMesh keeps its material's skinning binding, so mutate the
          // color in place rather than swapping the material instance.
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && 'color' in mat) {
                mat.color = new THREE.Color(SKIN);
                if ('map' in mat) mat.map = null;
                mat.roughness = 0.8;
                mat.metalness = 0;
                mat.needsUpdate = true;
              }
            }
          });
          // Normalize: center on origin, scale to targetHeight.
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);
          const scale = targetHeight / (size.y || 1);
          root.scale.setScalar(scale);
          root.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale,
          );
          setScene(root);
        },
        (err) => {
          console.warn('[HumanModel] GLTF parse failed:', err);
        },
      );
    })().catch((err) => {
      console.warn('[HumanModel] asset read failed:', err);
    });
    return () => {
      cancelled = true;
    };
  }, [targetHeight]);

  return scene;
};

// Renders the normalized human model (rest pose), centered on the origin.
export const HumanModel = ({ height = 1.8 }: { height?: number }) => {
  const scene = useHumanModel(height);
  // Memoize the primitive so it isn't re-created each render.
  const primitive = useMemo(
    () => (scene ? <primitive object={scene} /> : null),
    [scene],
  );
  return primitive;
};

export default HumanModel;
