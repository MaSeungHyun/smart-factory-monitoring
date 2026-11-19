# smart-factory-monitoring 적용 현황

- 위치: `C:\Users\seung\OneDrive\Desktop\smart-factory-monitoring` (Vite 8 + React 19 + R3F 9 + drei 10 + three 0.187, Electron 패키징)
- 점검일: 2026-11-17 (KST). 커밋 `660342c` 위에서 작업, 커밋은 하지 않음
- 확인 방법: 코드 읽기 + GLB/KTX2/EXR 헤더 직접 읽기 + `tsc` · `npm run build`. 실행 화면 측정은 아직 안 함

## 측정한 에셋 (`src/assets`)

| 파일 | 크기 | 확장 | 텍스처 |
| --- | --- | --- | --- |
| templates/factory.glb | 9.45 MB | meshopt, basisu, lights_punctual, texture_transform 등 | KTX2 23장 (1024² 22장, 512² 1장), 메시 152 · 노드 185 · 재질 14 |
| Forklift.glb | 3.90 MB | meshopt, basisu | KTX2 1024² 12장 |
| Transfer_Forklift.glb | 3.72 MB | meshopt, basisu | KTX2 1024² 12장 |
| robot_arm_place.glb | 2.30 MB | meshopt, basisu | KTX2 1024² 6장 |
| Rack_m.glb / Rack.glb | 2.28 / 2.22 MB | meshopt, basisu | KTX2 1024² 6장씩 |
| ScanTunnel.glb | 1.31 MB | meshopt, basisu | KTX2 4장 |
| rail.glb / rail_c.glb / AMR.glb / door.glb | 1.1 MB 안팎 | meshopt, basisu | KTX2 1024² 3~4장 |
| robot_base.glb / RobotArm.glb | 1.00 / 0.88 MB | meshopt, basisu | KTX2 1024² 3장씩 |
| box.glb / pallet.glb | 0.30 MB씩 | meshopt, basisu | KTX2 512² 3장 (두 파일이 같은 텍스처) |
| AGV / scanner / rail_condition / rail_in_out | 0.02~0.04 MB | meshopt | 없음 또는 KTX2 1장 |
| robot.glb | 0.20 MB | meshopt, EXT_texture_webp | WebP 3장. **코드에서 참조하지 않음** (번들에도 안 들어감) |
| hdr/factory_hdr.exr | 3.74 MB | — | 1500×750, RGBA half, ZIP 압축. PMREM 변환해 환경맵으로 사용 |

- KTX2 텍스처는 모두 밉 10~11단계 내장.
- 남은 PNG/JPG 없음. 변환할 텍스처가 없어 이번에 GLB는 건드리지 않았다.
- 어떤 GLB에도 `KHR_mesh_quantization` 이 없다 (양자화 미적용).
- 크기가 같은, 중복으로 보이는 텍스처가 여러 GLB에 반복된다. 예: 944 KB 텍스처가 Forklift · Rack · Rack_m · robot_arm_place · Transfer_Forklift 5곳, 904 KB 텍스처가 AMR · Rack · Rack_m · Transfer_Forklift 4곳. 다운로드 · VRAM 모두 중복이다.

## 기법별 현황

상태: 적용 / 부분 / 미적용 / 해당 없음. ★ 는 이번(2026-11-17)에 바꾼 항목.

| 기법 | 상태 | 근거 파일 · 비고 |
| --- | --- | --- |
| TSL compute + 스토리지 버퍼 → 텍스처 | 해당 없음 | GPU에서 계산할 시뮬레이션(바다 · 파티클)이 없다. WebGPU는 선택 렌더러로만 있음 (`FactoryScene.tsx` createWebGPU) |
| 베이크된 데이터 텍스처 | 해당 없음 | 공유할 정적 필드가 없다 |
| 인스턴스 상태를 데이터 텍스처/스토리지 버퍼로 | 미적용 | 박스는 `BoxInstances.tsx` 에서 CPU `setMatrixAt` · `setColorAt`(인스턴스 색 attribute)로 한 InstancedMesh. 차량 · 랙 · 팔레트는 장비마다 `scene.clone()` |
| KTX2(Basis) 압축 텍스처 | 적용 | 모든 텍스처가 KTX2. `shared/lib/three/gltfLoader.ts` (KTX2Loader, `public/basis/` 트랜스코더), `configureKTX2` 를 Canvas `onCreated` 에서 실제 렌더러로 다시 감지 |
| 밉맵 | 적용 | KTX2 내장 밉 |
| meshopt | 적용 | 모든 GLB `EXT_meshopt_compression`, `MeshoptDecoder` |
| 양자화 | 미적용 | `KHR_mesh_quantization` 없음 |
| GLB 바이트 캐시 (Cache Storage) | 미적용 | drei `useGLTF` 메모리 캐시 + `preloadGLTF`. Electron은 로컬 파일이라 필요성 낮음, 웹 배포 시 검토 |
| InstancedMesh | 부분 | 박스만 (`features/boxes/components/BoxInstances.tsx`). 차량 · 랙 · 팔레트는 복제본 |
| 반복 구간 인스턴싱 + 청크 컬링 | 해당 없음 | 공장 하나 규모라 긴 반복 구간이 없다 |
| 정적 지오메트리 병합 | 부분 | 와이어프레임 선 병합 (`FactoryWireframe.tsx` mergeGeometries), 박스 부품 병합 (`boxes/lib/boxGeometry.ts`). factory.glb props(메시 152)는 병합 안 함 |
| BatchedMesh | 미적용 | — |
| LOD / 메시 단순화 | 미적용 | — |
| 임포스터 / HLOD | 미적용 | 공장 규모에서는 필요 낮음 |
| 텍스처 아틀라스 / 배열 텍스처 | 미적용 | 대신 GLB 간 텍스처 중복 제거가 먼저 |
| 셰이더 예열 (compileAsync) | 적용 | `features/scene/components/FactoryWarmup.tsx` (`gl.compileAsync` 두 번 + `initTexturesInBatches` 12ms 예산). `shared/lib/three/compileInBatches.ts` 의 `compileInBatches` 는 지금 안 씀 |
| 재질 · 셰이더 공유 | 적용 | `features/scene/lib/useCloned.ts` (`scene.clone(true)` 로 지오메트리 · 재질 공유), 예열은 재질 uuid 기준 1회 |
| 로딩 중 렌더 게이트 | 적용 | `FactoryWarmup.tsx` 가 예열 끝날 때까지 메시 숨김, `SuspendFactoryAssets.tsx` · `WarmupScreen.tsx`, 로딩 배경 WebP |
| Render on demand | ★ 부분 | 전: frameloop always 고정. 후: `FrameLoopGate.tsx` — 일시정지 후 1.5초 무변화, 또는 대시보드 다이얼로그가 씬을 덮을 때만 demand |
| DPR 프리셋 | 적용 | `shared/stores/useGraphicsStore.ts` `QUALITY_DPR` (1 / 1.5 / 2) |
| 이동 중 DPR 낮추기 | 미적용 (의도적) | 사용자 요청으로 제외 (2026-11-17): 카메라를 움직이는 동안에도 화질을 낮추지 않는다. 한 번 구현(`MotionDpr.tsx`)했다가 삭제. DPR은 품질 프리셋(`QUALITY_DPR`)만 따른다 |
| 그림자 최적화 | ★ 부분 | 태양광만 그림자, 로봇만 캐스터 (`lib/factoryLights.ts`, `shared/lib/three/modelBounds.ts`), off/1024/2048 프리셋, 보조 렌더에서 그림자 생략 (`shared/lib/three/secondaryRender.ts`). 후: 캐스터가 움직인 프레임만 그림자 맵 갱신 (`shadowThrottle.ts`) |
| CSM | 미적용 | ±80 m 그림자 박스 하나로 공장 전체를 덮음. 필요 낮음 |
| 워커 (KTX2) | 적용 | three `KTX2Loader` 기본 워커 풀 |
| 워커 (meshopt) | 부분 | `MeshoptDecoder` 는 메인 스레드 WASM. 파일이 작아 영향 작음 |
| dispose | 부분 | `SceneBloom.tsx`, `FactoryLighting.tsx`(그림자 맵), `FaultHighlight.tsx`(재질). Canvas가 앱 수명 동안 한 번만 마운트돼 큰 해제는 필요 없음 |
| 대시보드 리렌더 줄이기 | 적용 | `660342c`: `SegmentBar` · `AnimatedNumber` · `EquipmentCard` · `TodayPanel` memo, `shared/lib/sameEquipmentItem.ts` |
| useFrame 직접 변경 | 적용 | `features/playback/components/PlaybackDriver.tsx` 등. 재생 시각은 스토어 밖(`usePlaybackStore.ts` `getExactTime`), UI는 250ms 주기 |
| Canvas 단일 마운트 | 적용 | `SceneHost.tsx` + `SceneSlot.tsx` 로 DOM만 이동, WebGL 컨텍스트 · GLB 유지 |
| 피킹 | 적용 | `features/scene/lib/boundsRaycast.ts` (AABB) |
| 청크 재생 | 적용 | `features/playback/lib/chunkWindow.ts` 등 (현재+다음 청크, 최대 4개 캐시, 프리페치) |
| 코드 분할 | ★ 적용 | 전: 스플래시 · App 동적 import, three/webgpu 동적 import, App 청크 1.7 MB. 후: 벤더 그룹 + DashboardDialog lazy |
| HDR/EXR 경량화 | 미적용 | 3.74 MB, RGBA(알파 불필요) ZIP |
| 이방성 필터 | ★ 적용 | `shared/lib/three/anisotropy.ts`, `FactoryWarmup.tsx` 에서 factory props 재질에 8 (GPU 최대값으로 자름) |

## 이미 커밋된 최적화: `660342c` (2026-11-17 09:11 KST, Monitoring Bot)

`perf: 카메라 이동 끊김 개선과 exe 단독 실행, 스플래시 로딩 디자인 적용` (`git show --stat 660342c` 로 확인)

| 항목 | 파일 | 내용 |
| --- | --- | --- |
| 대시보드 리렌더 줄이기 | `src/shared/components/SegmentBar.tsx`, `src/shared/components/AnimatedNumber.tsx`, `src/features/dashboard/components/EquipmentCard.tsx`, `src/features/dashboard/components/TodayPanel.tsx`, 새 파일 `src/shared/lib/sameEquipmentItem.ts` | `memo` + 장비 항목 비교 함수로 재생 시각 틱(250ms)마다 내용이 같은 카드 · 막대 · 숫자를 다시 그리지 않음 |
| 보조 렌더 경로 정리 | `src/shared/lib/three/secondaryRender.ts`, `src/features/scene/lib/visionFrame.ts` | 비전 인셋 같은 같은 프레임 두 번째 렌더에서 그림자 맵 · 월드 행렬 갱신을 생략 (2048 그림자 맵을 두 번 그리던 비용 제거) |
| 라벨 갱신 줄이기 | `src/features/scene/components/SceneLabels.tsx` | `dashboardAt` 결과가 같으면 라벨 목록 · 키 문자열을 매 프레임 만들지 않음 |
| 카메라 비행 단계 상한 | `src/features/scene/components/GlbCameraRig.tsx` | `FLIGHT_STEP = 1/30`: 긴 프레임이 생겨도 비행이 한 번에 건너뛰지 않고 이어서 움직임. 30fps 이상에서는 비행 시간 그대로 |
| Draco 끄기 | `src/shared/lib/three/gltfLoader.ts` | `USE_DRACO = false`: 모든 GLB가 meshopt라 불필요. 켜 두면 drei가 디코더를 gstatic CDN에서 받으려 해 오프라인 exe에서 깨질 수 있음 |
| Electron 단독 실행 | `electron/main.cjs` | 배포 exe의 `userData` 를 별도 폴더로 (개발용과 캐시 잠금 충돌 방지), `requestSingleInstanceLock` 으로 단일 인스턴스, `monitor://` 프로토콜에 `corsEnabled` · `stream` 권한 (fetch · 워커 · wasm · 데이터 청크를 dist에서 읽기) |
| 스플래시 로딩 디자인 | `src/app/components/SplashScreen.tsx` | 스플래시 화면 (성능 항목 아님) |

남은 끊김 (backlog에 기록): 북마크 7번 키로 이동할 때 약 50ms 프레임 1회, 페이지 전환 때 끊김 1회.

## 2026-11-17 변경 내역 (이번 작업, 커밋 안 함)

모두 WebGL 경로 기준이며, 멈춘 화면 · 재생 화면의 모양은 그대로 두는 것을 원칙으로 했다.

### 1. Render on demand (조건부)
- 새 파일 `src/features/scene/components/FrameLoopGate.tsx`, `src/shared/lib/three/renderActivity.ts`
- 평소에는 지금처럼 매 프레임 그린다. 다음일 때만 `setFrameloop('demand')`:
  - 재생이 한 번 시작된 뒤 **일시정지** 상태이고, 카메라 · 입력 · 스토어 · 연출이 1.5초 동안 그대로일 때
  - **대시보드 다이얼로그**가 씬을 덮고 있을 때 (재생 중이어도. 재생 시계는 씬과 별개 rAF라 닫으면 현재 시각으로 이어짐)
- 깨우는 것: pointerdown/move, wheel, keydown, resize, uiStore · monitorView · graphicsStore · playbackStore · 다이얼로그 스토어 변경, cameraBus 명령, 카메라 행렬 변화
- 계속 그려야 하는 연출은 `renderActivity.keepAlive()` 로 알린다: 고장 맥동(`FaultHighlight.tsx`), 선택 외곽선 맥동(`SelectionHighlight.tsx`), 와이어프레임 페이드(`FactoryWireframe.tsx`)
- 재생 중에는 절대 멈추지 않는다 (오프닝 전에도).

### 2. 카메라 조작 중 DPR 낮추기 → 제거함
- 처음에는 OrbitControls 조작 중 DPR을 프리셋 × 0.7로 낮추는 `MotionDpr.tsx` 를 넣었다
- **사용자 요청으로 삭제했다: 카메라를 움직이는 동안에도 화질을 낮추지 않는다.** 파일과 `FactoryScene.tsx` 의 사용 · import 를 지웠고, DPR은 원래대로 품질 프리셋(`QUALITY_DPR` 1 / 1.5 / 2)만 따른다
- 이 프로젝트에서는 다시 넣지 않는다. 조작 중 프레임 시간이 문제면 품질 프리셋을 낮추는 쪽으로 대응

### 3. 그림자 갱신 줄이기
- 새 파일 `src/shared/lib/three/shadowThrottle.ts`, `src/features/scene/components/ShadowUpdateGate.tsx`
- `shadowMap.autoUpdate = false`, `scene.onBeforeRender`(행렬 갱신 뒤 · 그림자 렌더 전)에서 그림자 캐스터 메시 · 조명의 월드 행렬, 보이기, 인스턴스 버전이 바뀐 프레임만 `needsUpdate`. 안전망으로 120렌더마다 한 번 강제 갱신
- 보조 렌더(비전 인셋)에서는 다시 그리지 않게 `secondaryRender.ts` 에 `isSecondaryRender()` 추가
- `FactoryLighting.tsx` 는 더 이상 `autoUpdate = true` 를 덮어쓰지 않고, 설정이 바뀌면 `needsUpdate` 만 켬
- WebGPU 렌더러는 기존대로 (WebGPU 그림자는 조명별 `shadow.autoUpdate` 를 쓰므로 별도 작업 필요)
- 효과: 로봇이 멈춰 있거나 재생이 멈춘 프레임은 2048 그림자 맵 렌더를 건너뜀. 움직이는 프레임은 전과 같음

### 4. 이방성 필터
- 새 파일 `src/shared/lib/three/anisotropy.ts`
- `FactoryWarmup.tsx` 에서 factory props(바닥 · 벽 · 구조물) 재질 텍스처에 `min(8, GPU 최대)` 을 GPU 업로드 전에 적용
- 바닥처럼 비스듬히 보이는 텍스처가 선명해진다 (의도된 화질 변화). 장비 GLB에는 적용 안 함

### 5. 코드 분할
- `vite.config.ts`: `build.rolldownOptions.output.codeSplitting.groups` 로 three(30) · react(25) · r3f(20) · ui(10) 청크 분리. three/webgpu 는 그룹에서 빼서 계속 동적 로드
  - react 그룹 우선순위를 r3f보다 높게 둔 이유: 낮으면 react가 r3f 청크로 끌려가고, 진입 청크(일렉트론 스플래시)가 three · r3f 를 미리 받게 된다. 빌드 후 `dist/index.html` modulepreload 가 react 청크만인 것을 확인
- `DashboardDialog` 를 `React.lazy` 로 분리 (`MonitoringPage.tsx` 의 `DashboardDialogSlot`). 열릴 때만 마운트하고, 씬 예열이 끝나면 미리 받아 둔다. 닫혀 있을 때 매 250ms 돌던 처리량 계산도 이제 안 돈다
- `features/dashboard/index.ts` 에서 DashboardDialog 재내보내기 제거 (정적 import가 남으면 분리가 안 됨)
- 빌드 결과: App 1,700 KB → App 268 KB + three 885 KB + r3f 323 KB + react 221 KB + ui 261 KB + DashboardDialog 22 KB (three.webgpu 611 KB는 전과 같이 동적)

### 검증
- `npx tsc --noEmit -p tsconfig.app.json` 통과, `tsconfig.node.json` 통과, 바꾼 파일 eslint 통과, `npm run build` 성공
- 실행 화면 측정(draws · 프레임 시간 전후)은 사용자가 시뮬에서 확인 예정

## 이번에 하지 않은 것 (이유)

| 항목 | 이유 |
| --- | --- |
| PNG → KTX2 변환 | 남은 PNG/JPG가 없음 |
| 차량 · 랙 · 팔레트 인스턴싱 | 장비마다 이름(id)으로 찾아 `PlaybackDriver` 가 움직이고, 선택 · 고장 하이라이트가 장비별 재질을 바꾸며, 박스 부모 관계 · 비전 인셋도 개별 오브젝트에 묶여 있다. 인스턴싱하면 이 경로를 모두 바꿔야 해서 위험 |
| 인스턴스 상태를 데이터 텍스처로 | 박스는 이미 인스턴스 색 attribute로 한 InstancedMesh. 추가 이득 작음 |
| 카메라 이동 중 DPR 낮추기 | 사용자 선호: 이동 중에도 화질 유지 (구현 후 삭제) |
| 일시정지 외 render on demand | 재생 중에는 로봇 · 차량이 계속 움직여 항상 그려야 함 |
| 페이지(상세 · 스캔 · 창고) React.lazy | `AnimatePresence` 전환 중 Suspense 대체 화면이 끼어들 수 있음. 이득 대비 위험 |
| EXR 경량화 · GLB 양자화 · 텍스처 중복 제거 | 에셋 파이프라인(Blender/gltf-transform) 작업이고 화질 확인이 필요. `gltf-transform` 이 이 프로젝트 node_modules 에 없음 → backlog |
| WebGPU 그림자 갱신 줄이기 | 기본 렌더러가 WebGL이고 WebGPU 경로는 API가 다름 → backlog |
