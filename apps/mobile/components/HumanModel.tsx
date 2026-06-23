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

// PolyOne "Normal Humanoid Mannequin" (Fab Standard License) — a smooth matte
// gender-neutral figure. The Fab-converted GLB has malformed skin transforms,
// which collapse it into a blob when evaluated. We extract its intact,
// already-Y-up POSITION data offline (scripts/bake-mannequin.mjs) into a plain
// static mesh, so the app never evaluates the broken skeleton.
const HUMAN_GLB = require('@/assets/models/mannequin-static.glb');

// Warm clay-grey — premium mannequin, not skin, not clinical.
const SKIN = '#cdbfae';

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
          // Pre-baked = a plain static mesh (no skeleton, already Y-up). Apply
          // the calm matte clay material and rebuild normals (the extractor
          // intentionally emits only positions + indices).
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(SKIN),
            roughness: 0.85,
            metalness: 0,
          });
          root.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.geometry.computeVertexNormals();
              mesh.material = mat;
            }
          });
          // Static non-skinned geometry → Box3 measures correctly. Center on
          // origin + scale to targetHeight so the camera frames it head-on.
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);
          const scale = targetHeight / (size.y || 1);
          root.position.sub(center);
          const wrapper = new THREE.Group();
          wrapper.add(root);
          wrapper.scale.setScalar(scale);
          setScene(wrapper);
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
// onLoad fires with the loaded group so the parent can raycast site anchors
// onto the actual mesh.
export const HumanModel = ({
  height = 1.8,
  onLoad,
}: {
  height?: number;
  onLoad?: (group: THREE.Group) => void;
}) => {
  const scene = useHumanModel(height);
  useEffect(() => {
    if (scene && onLoad) onLoad(scene);
  }, [scene, onLoad]);
  // Memoize the primitive so it isn't re-created each render.
  const primitive = useMemo(
    () => (scene ? <primitive object={scene} /> : null),
    [scene],
  );
  return primitive;
};

export default HumanModel;
