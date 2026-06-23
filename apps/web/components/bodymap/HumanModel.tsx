'use client';

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

// Warm clay-grey — premium mannequin, not skin, not clinical (matches mobile).
const SKIN = '#cdbfae';

// Renders the baked static mannequin GLB (served from /public/models),
// normalized to a target height and centered on the origin. The bake already
// emits a clean upright Y-up static mesh (positions + indices only), so here we
// just apply the matte material, rebuild normals, and scale.
export const HumanModel = ({
  url,
  height = 1.8,
}: {
  url: string;
  height?: number;
}) => {
  const { scene } = useGLTF(url);

  const normalized = useMemo(() => {
    const root = scene.clone(true);
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
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = height / (size.y || 1);
    root.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(scale);
    return wrapper;
  }, [scene, height]);

  return <primitive object={normalized} />;
};

export default HumanModel;
