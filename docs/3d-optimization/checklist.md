# 웹 3D 최적화 체크리스트 (공통)

three.js / R3F 프로젝트에 공통으로 쓰는 체크리스트입니다.
난이도: 하(반나절 이하) · 중(1~3일) · 상(설계 변경). "확인"은 전후로 무엇을 재면 되는지입니다.

## 측정 기준

- **draws / tris**: `gl.info.render.calls`, `gl.info.render.triangles` (`gl.info.autoReset` 이 켜져 있으면 매 프레임 초기화).
- **프레임 시간**: CPU는 `useFrame` 전후 `performance.now()`, GPU는 `EXT_disjoint_timer_query_webgl2` 또는 stats-gl.
- **메모리**: `gl.info.memory.textures/geometries`, 크롬 작업 관리자 GPU 메모리.
- **로딩**: DevTools Performance의 Long Task, 첫 화면까지 걸린 시간, Network 전송량.
- 같은 카메라 시점, 같은 재생 시각, 같은 창 크기에서 비교한다.

## 1. 에셋 (다운로드 · 파싱 · VRAM)

| 기법 | 하는 일 | 언제 | 난이도 | 확인 |
| --- | --- | --- | --- | --- |
| KTX2(Basis) 압축 텍스처 | GPU 압축 포맷으로 트랜스코드해 VRAM · 업로드 시간 감소 | 텍스처가 있는 모든 GLB. 노멀맵은 UASTC, 컬러는 ETC1S | 하 | GLB 헤더의 `KHR_texture_basisu`, 이미지 mimeType `image/ktx2`, GPU 메모리 |
| 밉맵 | 먼 거리 깜빡임 · 텍스처 대역폭 감소 | 거의 항상. KTX2는 밉을 파일에 미리 넣는다 | 하 | KTX2 헤더 levelCount > 1 |
| 메시 압축(meshopt) | 정점 · 인덱스 압축으로 다운로드 · 파싱 감소 | 모든 GLB | 하 | `EXT_meshopt_compression` |
| 양자화(KHR_mesh_quantization) | 위치 · 노멀 · UV를 16/8비트로 → 다운로드 · VRAM 감소 | 모든 GLB (정밀도 확인 필요) | 하 | `KHR_mesh_quantization`, GLB 크기 |
| 텍스처 중복 제거 | 여러 GLB에 같은 텍스처가 들어 있으면 한 번만 받기 | 같은 머티리얼 라이브러리를 공유하는 모델들 | 중 | 전체 에셋 크기 |
| HDR/EXR 경량화 | 환경맵 해상도 · 채널 축소, RGBE(.hdr)나 UltraHDR(JPG 게인맵) | 환경맵이 MB 단위일 때 | 하 | 파일 크기, PMREM 결과 비교 |
| GLB 바이트 캐시 | Cache Storage / IndexedDB에 GLB를 저장해 새로고침 시 재다운로드 방지 | 웹 배포 + 큰 GLB. Electron 로컬 파일이면 불필요 | 하 | 두 번째 로드 Network 0 B |
| 코드 분할 | 벤더(three · r3f · react) 청크 분리, 첫 화면에 필요 없는 패널은 React.lazy | 번들 > 1 MB | 하 | 빌드 출력 청크 크기, 첫 로드 JS 양 |

## 2. 드로우콜 · 지오메트리

| 기법 | 하는 일 | 언제 | 난이도 | 확인 |
| --- | --- | --- | --- | --- |
| InstancedMesh | 같은 지오메트리+재질을 드로우 1번으로 | 같은 모양이 수십 개 이상 (박스, 팔레트, 컨테이너) | 하~중 | draws |
| 반복 구간 인스턴싱 + 청크 컬링 | 펜스 · 도로처럼 긴 반복물을 칸 단위로 인스턴싱하고 화면 밖 칸 제외 | 넓은 맵 | 중 | draws, tris |
| 정적 지오메트리 병합 | 움직이지 않는 부품을 재질별로 하나로 합침 | 정적 구조물이 수백 메시 | 하 | draws |
| BatchedMesh | 모양이 다른 정적 부품을 한 드로우로 + 개별 가시성/행렬 | 병합하면 개별 제어가 안 되는 경우 | 중 | draws |
| LOD / 메시 단순화 | 멀면 삼각형 수가 적은 버전 | tris가 병목, 카메라 거리 범위가 넓을 때 | 중 | tris |
| 임포스터 / HLOD | 아주 먼 물체를 카드 한 장(또는 묶음 메시)으로 | 원경에 큰 물체가 많을 때 | 중상 | draws, tris |
| 텍스처 아틀라스 / 배열 텍스처 | 작은 텍스처 여러 장을 하나로 → 재질 · 바인딩 수 감소 | 작은 텍스처가 많고 재질만 다른 경우 | 중 | 재질 수, draws |
| 피킹을 AABB/BVH로 | 메시 정밀 raycast 대신 박스 · BVH | 포인터 이동마다 raycast | 하 | 포인터 이동 중 CPU 시간 |

## 3. GPU 주도 (데이터를 GPU에 두고 재사용)

| 기법 | 하는 일 | 언제 | 난이도 | 확인 |
| --- | --- | --- | --- | --- |
| TSL compute + 스토리지 버퍼 → 텍스처 | 시뮬레이션(바다 FFT, 파티클)을 GPU에서 계산해 렌더 타깃 텍스처로 바로 사용 | WebGPU, 매 프레임 많은 값을 계산할 때 | 상 | CPU 프레임 시간 |
| 베이크된 데이터 텍스처 | 한 번 계산한 필드(거리장, 해안선 등)를 텍스처로 굽고 여러 재질이 공유 | 정적 필드를 여러 셰이더가 읽을 때 | 중 | 로딩 시간, 재질 수 |
| 인스턴스 상태를 버퍼/데이터 텍스처로 | 색 · 상태 · 하이라이트를 인스턴스 attribute나 데이터 텍스처에 넣고 셰이더가 읽음 → 상태별 메시 · 재질 분리 제거 | 상태 종류마다 InstancedMesh를 따로 두고 있을 때 | 중 | draws, 재질 수, 예열할 프로그램 수 |
| 간접 드로우 + compute 컬링 | GPU가 보이는 인스턴스만 골라 그림 | WebGPU, 수만 인스턴스 | 상 | CPU 프레임 시간 |
| 버텍스 애니메이션 텍스처 | 스키닝 애니메이션을 텍스처로 구워 인스턴싱 | 같은 캐릭터가 많이 움직일 때 | 중상 | draws |

## 4. 매 프레임 비용

| 기법 | 하는 일 | 언제 | 난이도 | 확인 |
| --- | --- | --- | --- | --- |
| useFrame 안에서 직접 변경 | 위치 · 회전을 React 상태가 아니라 ref로 바꿔 리렌더 제거 | 항상 (R3F) | 하 | React Profiler 커밋 수 |
| 시뮬레이션 시각을 스토어 밖에 | 매 프레임 바뀌는 값은 모듈 변수, UI는 4Hz 등으로만 갱신 | 재생 · 실시간 데이터 | 하 | 리렌더 수 |
| Render on demand | 아무것도 안 바뀌면 렌더 중지 (`frameloop="demand"` + `invalidate()`) | 정지 화면이 길 때. 애니메이션이 계속 돌면 조건부로 | 하~중 | 정지 시 GPU 사용률 |
| DPR 프리셋 | 품질 설정별 DPR 상한 | 항상 | 하 | 프레임 시간 |
| 이동 중 DPR 낮추기 (regress) | 카메라 조작 중에만 DPR을 낮추고 멈추면 복원 | 고해상도 화면, 무거운 프래그먼트. **이동 중 흐려지는 걸 싫어하는 사용자도 있으니 먼저 확인** (smart-factory-monitoring 은 이 이유로 제외) | 하 | 조작 중 프레임 시간 |
| 그림자 갱신 줄이기 | `shadowMap.autoUpdate=false` + 바뀐 프레임만 `needsUpdate` 또는 N프레임마다 | 그림자를 드리우는 물체가 자주 멈춰 있을 때 | 하~중 | 프레임 시간, 그림자 패스 draws |
| 그림자 범위 최소화 | 그림자 캐스터 제한, 맵 크기 프리셋, 카메라 추종 + 텍셀 스냅 | 항상 | 하 | 그림자 패스 draws |
| CSM(계단식 그림자) | 가까운 곳은 고해상도, 먼 곳은 저해상도 | 넓은 맵에서 가까운 그림자가 뭉개질 때 | 중 | 화질 · 프레임 시간 |
| 이방성 필터(anisotropy) | 비스듬한 바닥 · 벽 텍스처 선명도 개선 | 바닥 텍스처가 흐릿할 때. GPU 최대값으로 자름, 보통 4~8 | 하 | 화질 (비용은 작음) |
| 보조 렌더 비용 줄이기 | 같은 프레임 두 번째 렌더에서 그림자 · 행렬 갱신 생략 | 인셋 카메라 · 미니맵 | 하 | 프레임 시간 |
| 후처리 최소화 | 블룸 등은 옵션으로, 레이어 · 실루엣만 | 저사양 대응 | 하 | 프레임 시간 |
| 오클루전 컬링 | 가려진 물체 제외 | 실내 · 밀집 구조 | 상 | draws |

## 5. 로딩 · 끊김

| 기법 | 하는 일 | 언제 | 난이도 | 확인 |
| --- | --- | --- | --- | --- |
| 셰이더 예열 (compileAsync) | 첫 화면에 쓸 프로그램을 미리 비동기 컴파일 (KHR_parallel_shader_compile) | 재질 종류가 많을 때 | 하 | 첫 프레임 Long Task |
| 텍스처 업로드 분할 | `initTexture`를 프레임 예산(예: 12ms)으로 나눔 | 큰 텍스처가 많을 때 | 하 | Long Task |
| 렌더 게이트 | 로딩 · 예열 중에는 메시를 숨기거나 렌더 생략 | 항상 | 하 | 초기 끊김 |
| 재질 · 지오메트리 공유 | `scene.clone()`은 지오메트리 · 재질을 공유. 인스턴스 셰이더도 공유 | 같은 모델 여러 개 | 하 | 프로그램 수 (`gl.info.programs.length`) |
| 워커 활용 | KTX2 트랜스코드, 메시 단순화, 필드 베이크를 워커에서 | 메인 스레드가 막힐 때 | 중 | Long Task |
| OffscreenCanvas | 렌더 전체를 워커로 | R3F와 궁합이 까다로움 | 상 | — |
| 리소스 해제 (dispose) | 지오메트리 · 재질 · 텍스처 · 렌더 타깃 해제 | 화면 전환 · 설정 변경 | 하 | `gl.info.memory` 증가 여부 |

## R3F에서 자주 쓰는 패턴

```tsx
// 1) 이동 중 DPR 낮추기: OrbitControls start/end 에 맞춰 setDpr (화질 저하를 허용하는 프로젝트에서만)
const setDpr = useThree((s) => s.setDpr)
controls.addEventListener('start', () => setDpr(base * 0.7))
controls.addEventListener('end', () => setTimeout(() => setDpr(preset), 250))

// 2) 그림자는 바뀐 프레임만 (WebGL). scene.onBeforeRender 는 행렬 갱신 뒤 · 그림자 렌더 전에 불린다
gl.shadowMap.autoUpdate = false
scene.onBeforeRender = () => { if (castersMoved()) gl.shadowMap.needsUpdate = true }

// 3) 조건부 render on demand: 평소 always, 쉬어도 될 때만 demand
const setFrameloop = useThree((s) => s.setFrameloop)
useFrame(() => setFrameloop(idle ? 'demand' : 'always'))   // 실제로는 바뀔 때만 호출
```

주의: R3F `setFrameloop`은 `clock.elapsedTime`을 0으로 되돌린다. `clock.elapsedTime`으로 맥동하는 연출은 위상이 한 번 튄다.
drei `AdaptiveDpr`은 `viewport.initialDpr`(처음 값)으로만 복원하므로, 실행 중에 품질 프리셋을 바꾸는 앱에서는 직접 `setDpr`로 복원하는 편이 안전하다.
