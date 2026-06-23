// Pure-Node GLB static-mesh extractor.
//
// The Fab-converted mannequin has valid POSITION/index data, but its skin is
// malformed: the joint nodes have identity transforms while the inverse-bind
// matrices contain different transforms. Evaluating that skin collapses the
// body. The undeformed POSITION accessor is already the correct upright,
// Y-up mannequin, so extract that geometry directly and discard the rig.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2];
const OUT = process.argv[3];

// ---- GLB parse ----
const buf = readFileSync(SRC);
if (buf.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a GLB');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
// BIN chunk starts after JSON chunk (12 header + 8 json-chunk-header + jsonLen, then 8 bin-chunk-header)
const binChunkStart = 20 + jsonLen;
const binLen = buf.readUInt32LE(binChunkStart);
const bin = buf.subarray(binChunkStart + 8, binChunkStart + 8 + binLen);

const compType = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const numComp = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readAccessor(idx) {
  const a = json.accessors[idx];
  const bv = json.bufferViews[a.bufferView];
  const TA = compType[a.componentType];
  const n = numComp[a.type];
  const offset = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const packedStride = TA.BYTES_PER_ELEMENT * n;
  if (bv.byteStride && bv.byteStride !== packedStride) {
    throw new Error(`accessor ${idx} is interleaved; unsupported byteStride ${bv.byteStride}`);
  }
  return new TA(bin.buffer, bin.byteOffset + offset, a.count * n);
}

// ---- find the mannequin mesh ----
let meshNodeIdx = -1;
json.nodes.forEach((n, i) => {
  if (n.mesh != null && meshNodeIdx < 0) meshNodeIdx = i;
});
if (meshNodeIdx < 0) throw new Error('no mesh node found');
const node = json.nodes[meshNodeIdx];
const mesh = json.meshes[node.mesh];
const prim = mesh.primitives[0];

const POS = readAccessor(prim.attributes.POSITION);
const count = POS.length / 3;
const out = new Float32Array(count * 3);
const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
for (let i = 0; i < count; i++) {
  const x = POS[i*3], y = POS[i*3+1], z = POS[i*3+2];
  out[i*3]=x; out[i*3+1]=y; out[i*3+2]=z;
  if(x<min[0])min[0]=x; if(y<min[1])min[1]=y; if(z<min[2])min[2]=z;
  if(x>max[0])max[0]=x; if(y>max[1])max[1]=y; if(z>max[2])max[2]=z;
}
// CENTER the geometry on the origin (so the app needs no centering logic) AND
// scale to a target height of 1.8 — bake both into the vertices.
const cx = (min[0]+max[0])/2, cy = (min[1]+max[1])/2, cz = (min[2]+max[2])/2;
const targetH = 1.8;
const s = targetH / (max[1]-min[1] || 1);
for (let i=0;i<count;i++){
  out[i*3]   = (out[i*3]   - cx) * s;
  out[i*3+1] = (out[i*3+1] - cy) * s;
  out[i*3+2] = (out[i*3+2] - cz) * s;
}
// recompute bounds post-transform
min[0]=min[1]=min[2]=Infinity; max[0]=max[1]=max[2]=-Infinity;
for(let i=0;i<count;i++){const x=out[i*3],y=out[i*3+1],z=out[i*3+2];
  if(x<min[0])min[0]=x;if(y<min[1])min[1]=y;if(z<min[2])min[2]=z;
  if(x>max[0])max[0]=x;if(y>max[1])max[1]=y;if(z>max[2])max[2]=z;}
console.log('CENTERED+SCALED bbox min', min.map(v=>v.toFixed(2)), 'max', max.map(v=>v.toFixed(2)));
console.log('size (w,h,d):', (max[0]-min[0]).toFixed(2), (max[1]-min[1]).toFixed(2), (max[2]-min[2]).toFixed(2));

// ---- write a minimal static GLB (POSITION + indices, no skin/normals — three computes normals) ----
const INDEX = prim.indices != null ? readAccessor(prim.indices) : null;
// pack binary: positions (f32) then indices (u32)
const posBytes = Buffer.from(out.buffer, out.byteOffset, out.byteLength);
let idxArr = INDEX ? Uint32Array.from(INDEX) : null;
const idxBytes = idxArr ? Buffer.from(idxArr.buffer, idxArr.byteOffset, idxArr.byteLength) : Buffer.alloc(0);
// pad to 4
const pad = (b) => b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length%4))]) : b;
const posP = pad(posBytes); const idxP = pad(idxBytes);
const binOut = Buffer.concat([posP, idxP]);

const gltf = {
  asset: { version: '2.0', generator: 'titrra-static-mesh-extractor' },
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, ...(idxArr?{indices:1}:{}), mode: 4 }] }],
  accessors: [
    { bufferView: 0, componentType: 5126, count, type: 'VEC3', min, max },
    ...(idxArr ? [{ bufferView: 1, componentType: 5125, count: idxArr.length, type: 'SCALAR' }] : []),
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: posBytes.length, target: 34962 },
    ...(idxArr ? [{ buffer: 0, byteOffset: posP.length, byteLength: idxBytes.length, target: 34963 }] : []),
  ],
  buffers: [{ byteLength: binOut.length }],
};
const jsonStr = JSON.stringify(gltf);
let jsonBuf = Buffer.from(jsonStr, 'utf8');
jsonBuf = pad(jsonBuf); // glb json chunk pad with spaces ideally, but 0 works for most loaders; use spaces
// re-pad json with spaces
const jsonRaw = Buffer.from(jsonStr, 'utf8');
const jsonPad = jsonRaw.length % 4 ? 4 - (jsonRaw.length % 4) : 0;
const jsonChunk = Buffer.concat([jsonRaw, Buffer.alloc(jsonPad, 0x20)]);

const header = Buffer.alloc(12);
header.write('glTF', 0, 'ascii');
header.writeUInt32LE(2, 4);
const total = 12 + 8 + jsonChunk.length + 8 + binOut.length;
header.writeUInt32LE(total, 8);
const jsonHdr = Buffer.alloc(8); jsonHdr.writeUInt32LE(jsonChunk.length,0); jsonHdr.writeUInt32LE(0x4E4F534A,4); // 'JSON'
const binHdr = Buffer.alloc(8); binHdr.writeUInt32LE(binOut.length,0); binHdr.writeUInt32LE(0x004E4942,4); // 'BIN\0'

writeFileSync(OUT, Buffer.concat([header, jsonHdr, jsonChunk, binHdr, binOut]));
console.log('wrote', OUT, total, 'bytes');

// ─── Injection-site landmarks ──────────────────────────────────────────────
// Derive the 6 marker positions by scanning the (centered, Y-up, 1.8-tall)
// geometry at standard anatomical HEIGHT FRACTIONS and snapping to the real
// skin surface. No hand-tuned coordinates → robust + scales to any humanoid
// model (e.g. the female mannequin). Writes <OUT-basename>-landmarks.json.
const H = max[1] - min[1];
const yAt = (f) => min[1] + f * H;
// Front-facing surface point near a target x at a height fraction.
const frontPoint = (yFrac, xTarget, band = 0.04) => {
  const y = yAt(yFrac);
  let best = null;
  for (let i = 0; i < count; i++) {
    const x = out[i * 3], vy = out[i * 3 + 1], z = out[i * 3 + 2];
    if (Math.abs(vy - y) > band) continue;
    if (Math.abs(x - xTarget) > 0.05) continue;
    if (!best || z > best.z) best = { x, y: vy, z };
  }
  return best;
};
// Outermost (limb-edge) surface point on one side at a height fraction.
const outerPoint = (yFrac, sign, band = 0.04) => {
  const y = yAt(yFrac);
  let best = null;
  for (let i = 0; i < count; i++) {
    const x = out[i * 3], vy = out[i * 3 + 1], z = out[i * 3 + 2];
    if (Math.abs(vy - y) > band) continue;
    if (sign > 0 ? x < 0.15 : x > -0.15) continue;
    if (!best || (sign > 0 ? x > best.x : x < best.x)) best = { x, y: vy, z };
  }
  return best;
};
const r = (v, fb) => (v ? [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)] : fb);
// Fractions: belly ~60%, upper thigh ~42%, upper arm/deltoid ~70% of height.
const landmarks = {
  ABDOMEN_L: r(frontPoint(0.6, -0.09), [-0.05, 0.17, 0.12]),
  ABDOMEN_R: r(frontPoint(0.6, 0.09), [0.05, 0.17, 0.12]),
  THIGH_L: r(frontPoint(0.42, -0.1), [-0.09, -0.16, 0.09]),
  THIGH_R: r(frontPoint(0.42, 0.1), [0.09, -0.16, 0.09]),
  ARM_L: r(outerPoint(0.7, -1), [-0.3, 0.34, -0.06]),
  ARM_R: r(outerPoint(0.7, 1), [0.3, 0.34, -0.06]),
};
const LANDMARKS_OUT = OUT.replace(/\.glb$/, '') + '-landmarks.json';
writeFileSync(LANDMARKS_OUT, `${JSON.stringify(landmarks, null, 2)}\n`);
console.log('wrote', LANDMARKS_OUT);
