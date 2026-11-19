# 참고 자료

## 종합 · 팁
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips) — utsubo.com
- [Discover three.js Tips and Tricks](https://discoverthreejs.com/tips-and-tricks/) — discoverthreejs.com
- [WebGPU Best Practices](https://toji.dev/webgpu-best-practices/) — toji.dev

## React Three Fiber
- [R3F Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — on-demand 렌더, regress, 인스턴싱
- [R3F Performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) — useFrame 안에서 직접 변경, setState 피하기

## 인스턴싱 · 배칭 · LOD
- [Performance, measured: instancing, batching, LOD](https://spareilleux.github.io/learn/threejs/08-performance-instancing-batching-lod/) — spareilleux.github.io
- [BatchedMesh 문서](https://threejs.org/docs/pages/BatchedMesh.html) — threejs.org

## WebGPU · GPU 주도
- [WebGPU 간접 드로우 예제](https://threejs.org/examples/webgpu_struct_drawindirect.html) — threejs.org
- [IndirectStorageBufferAttribute PR #29594](https://github.com/mrdoob/three.js/pull/29594) — github.com/mrdoob/three.js
- [BatchedMesh via drawIndexedIndirect PR #30645](https://github.com/mrdoob/three.js/pull/30645) — github.com/mrdoob/three.js
- [WebGPU 스토리지 버퍼 예제](https://threejs.org/examples/webgpu_storage_buffer.html) — threejs.org
- [WebGPU compute 파티클 예제](https://threejs.org/examples/webgpu_compute_particles.html) — threejs.org

## 그림자 · 텍스처
- [WebGPU CSM 그림자 예제](https://threejs.org/examples/webgpu_shadowmap_csm.html) — threejs.org
- [배열 텍스처 예제](https://threejs.org/examples/webgl_texture2darray.html) — threejs.org
- [Choosing texture formats for WebGL and WebGPU](https://www.donmccurdy.com/2024/02/11/web-texture-formats/) — donmccurdy.com

## 에셋 파이프라인
- [glTF Transform CLI (KTX2, meshopt)](https://gltf-transform.dev/cli) — gltf-transform.dev

```bash
# 자주 쓰는 gltf-transform 명령 (원본은 백업해 두고, 백업은 git에 넣지 않는다)
npx @gltf-transform/cli inspect model.glb                     # 텍스처 · 확장 · 크기 확인
npx @gltf-transform/cli etc1s in.glb out.glb                  # 컬러 텍스처 → KTX2 ETC1S (KTX-Software 의 toktx 필요)
npx @gltf-transform/cli uastc in.glb out.glb --slots "{normalTexture}"   # 노멀맵 → KTX2 UASTC
npx @gltf-transform/cli meshopt in.glb out.glb                # meshopt 압축
npx @gltf-transform/cli quantize in.glb out.glb               # 양자화
npx @gltf-transform/cli dedup in.glb out.glb                  # 파일 안 중복 텍스처 · 재질 제거
```
