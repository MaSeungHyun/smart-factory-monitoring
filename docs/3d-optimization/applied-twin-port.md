# Twin-Port 적용 현황 (요약)

- 기준: maseunghyun-pc 의 `codex/port-call-demo` 작업 트리, 2026-11-12. 코드만 읽고 수정은 안 함
- 원본 점검 페이지("Twin-Port 웹 3D 최적화 점검")를 다른 프로젝트에서도 참고할 수 있게 요약한 것

## 결론: GPU에서 데이터 · 텍스처를 만들어 재사용하는 기법

- **바다에는 적용**: 바다 FFT를 TSL compute로 스토리지 버퍼에서 계산하고, 결과를 렌더 타깃 텍스처로 바로 쓴다. 해안 필드도 워커에서 한 번 구워 텍스처로 공유한다.
- **항만 오브젝트에는 미적용**: 컨테이너 · 크레인 · 배는 CPU에서 행렬을 계산해 InstancedMesh에 올린다. 인스턴스 상태를 데이터 텍스처나 스토리지 버퍼에 담아 셰이더가 읽는 구조는 아니다.
- 텍스처 압축은 KTX2 + 밉맵이 대부분 적용, 남은 PNG 2장.

## 측정한 에셋 (GLB 헤더 · 내장 텍스처 헤더 직접 읽음)

| 파일 | 크기 | 확장 | 텍스처 |
| --- | --- | --- | --- |
| ship.glb | 10.5 MB | meshopt, quantization, basisu | KTX2 15장 (1024² 10장, 512² 4장) |
| BUSAN.glb | 8.0 MB | meshopt, quantization, basisu | KTX2 30장 (4500² 지면 1장, 1024² 5장, 256²급 24장 등) |
| overhead_crane.glb | 1.6 MB | meshopt, basisu | KTX2 2장 + **PNG 1024² 1장 (1.1 MB)** |
| containers.glb | 0.3 MB | 없음 | **PNG 1024² 1장 (326 KB)** |
| sky.hdr / port_hdr.hdr | 1.4 / 1.1 MB | — | HDR, PMREM 변환 |

## 기법별 현황

| 기법 | 상태 | 근거 파일 · 비고 |
| --- | --- | --- |
| TSL compute + 스토리지 버퍼 → 텍스처 | 적용 | `OceanTsl/webgpu/fftGPU.ts` (instancedArray, `.compute`, RenderTarget) |
| 베이크된 데이터 텍스처 | 적용 | `domain/waterSim.ts`, `OceanTsl/portShore.ts`, `OceanTsl/scene/resources.ts` — 해안 필드를 워커에서 한 번 굽고 Water · Ground가 같은 텍스처 공유 |
| 인스턴스 상태를 데이터 텍스처/스토리지 버퍼로 | 미적용 | 컨테이너 · 크레인 · 배는 CPU `setMatrixAt` + `needsUpdate` |
| KTX2 | 부분 | `domain/gltfLoaders.ts`, `ktx2MainThread.ts`. BUSAN · ship 전부 KTX2, overhead_crane PNG 1장 · containers PNG 1장 남음 |
| 밉맵 | 적용 | KTX2마다 밉 9~13단계 |
| meshopt + 양자화 | 적용 | BUSAN · ship · overhead_crane (`EXT_meshopt_compression`, `KHR_mesh_quantization`) |
| GLB 바이트 캐시 | 적용 | `domain/glbCache.ts` (Cache Storage) |
| InstancedMesh | 적용 | `containerInstancePool.ts`, `quayCraneInstance.ts`, `ContainerYard.tsx`, `ShipCargo.tsx`, `BlockMarks.tsx` 등 |
| 반복 구간 인스턴싱 + 청크 컬링 | 적용 | `domain/repeatMesh.ts` (Fence / Road / LimitLine, 약 240 m 칸) |
| 정적 지오메트리 병합 | 적용 | `domain/mergeStaticGeometry.ts` |
| BatchedMesh | 미적용 | — |
| LOD / 메시 단순화 | 적용 | `craneLod.ts`, `shipLod.ts`, `constants/*Lod.ts`, `ContainerYard.tsx`, 워커 `meshopt.worker.ts` |
| 임포스터 / HLOD | 미적용 | — |
| 버텍스 애니메이션 텍스처 | 해당 없음 | 애니메이션은 행렬 이동뿐 (GLB 애니메이션 0개) |
| 텍스처 아틀라스 / 배열 텍스처 | 미적용 | BUSAN.glb 에 256px 텍스처 24장 |
| 셰이더 예열 (compileAsync) | 적용 | `compileObject.ts`, `renderGate.ts`, `warmupOccupancyPrograms.ts`, `craneDepthFade.ts` |
| 인스턴스 셰이더 공유 | 적용 | `domain/shareInstanceShaders.ts` |
| 렌더 게이트 | 적용 | `domain/renderGate.ts` (로딩 중 화면 렌더 생략) |
| Render on demand | 부분 | `Scene.tsx` frameloop always, `MonitorFrameLoopGate.tsx` 에서 모니터 모드만 never |
| DPR | 부분 | `Scene.tsx` `dpr = min(devicePixelRatio, renderScale)` 프리셋만, 이동 중 자동 하향 없음 |
| 그림자 | 부분 | `SunLight.tsx`: 2048 맵, 카메라 추종 · 텍셀 스냅, off/low/high, 점유 모드에서 정지. 그 외엔 매 프레임 갱신 |
| CSM | 미적용 | — |
| 물 반사 | 부분 | `WaterReflection.tsx`: 반사 카메라 없이 Y 반전 복제본 + 단순화. RT 비용은 없지만 반사 대상 드로우콜이 늘어남 |
| 간접 드로우 / GPU 컬링 | 미적용 | WebGPU 전용, 수만 인스턴스에서 의미 |
| 오클루전 컬링 | 미적용 | — |
| 워커 | 적용 (KTX2 제외) | `meshoptPool.ts` · `meshopt.worker.ts`(단순화), `shoreBake.worker.ts`. **KTX2 트랜스코드는 메인 스레드** (`ktx2MainThread.ts`, 브라우저 문제 우회) |
| OffscreenCanvas | 미적용 | R3F와 궁합이 까다로움 |
| dispose | 적용 | `containerInstancePool.ts`, `Scene.tsx`, `OutlineMode.tsx` 등 18개 파일 |
| useFrame 직접 변경 | 적용 | `OverHeadCrane.tsx` writeMatrices, `ContainerYard.tsx` LOD 주기 검사 |

## 우선 추천 (원본 점검 기준)

1. **남은 PNG 2장을 KTX2로** — overhead_crane.glb 1024² PNG(1.1 MB), containers.glb PNG(326 KB). 이미 쓰는 gltf-transform으로 바로 가능, 로더 준비됨. 난이도 하.
2. **컨테이너 상태를 인스턴스 버퍼로 합치기** — 지금은 블록 × 색마다 InstancedMesh를 따로 두고 하이라이트도 별도 재질. 색 · 상태 · 하이라이트를 인스턴스 attribute나 데이터 텍스처에 넣어 셰이더에서 읽으면 메시 · 재질 수와 예열 조합이 준다. "GPU 텍스처를 만들고 갖다 쓰는" 방식이 가장 효과를 볼 곳. 난이도 중.
3. **그림자 갱신 줄이기** — 2048 맵을 매 프레임 다시 그림. 정적(지면 · 블록) / 동적(크레인 · 배) 분리, 또는 카메라가 멈추면 몇 프레임에 한 번만. smart-factory-monitoring 의 `shadowThrottle.ts`(캐스터가 움직인 프레임만 갱신) 방식을 옮겨 쓸 수 있다. 난이도 중.
4. **카메라 이동 중 해상도 낮추기** — 회전 · 이동 중에만 DPR을 낮추고 멈추면 복원. `renderScale` 프리셋 위에 얹기. 난이도 하. (참고: smart-factory-monitoring 에서는 사용자 선호로 이동 중 화질을 낮추지 않기로 해 구현 후 삭제함. 적용 전 확인 필요)
5. **KTX2 트랜스코드 워커 복구** — 메인 스레드 트랜스코드(`ktx2MainThread.ts`)라 로딩 중 메인 스레드가 막힐 수 있음. 원인이 풀리면 워커로. 난이도 중.
6. **나중에 검토** — BUSAN의 작은 텍스처 24장을 배열 텍스처 · 아틀라스로, 먼 배에 임포스터, 컨테이너가 훨씬 많아지면 compute 컬링 + 간접 드로우. 지금 규모에서는 효과 대비 작업량이 크다.

실제 효과는 PerfOverlay 의 draws/tris와 프레임 시간으로 전후를 재서 확인해야 한다. 위 기대 효과는 일반적인 경향이고 측정값이 아니다.
