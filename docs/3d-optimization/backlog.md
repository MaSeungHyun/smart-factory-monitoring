# 남은 작업 (우선순위 순)

P1 = 바로 할 만함(효과 크고 위험 작음), P2 = 다음 단계, P3 = 규모가 커지면.
SFM = smart-factory-monitoring, TP = Twin-Port.

## P1

| 프로젝트 | 작업 | 기대 효과 | 난이도 | 메모 |
| --- | --- | --- | --- | --- |
| SFM | 이번 변경 실측 (일시정지 · 재생 · 카메라 조작 · 다이얼로그 열림에서 프레임 시간 · GPU 사용률) | 효과 확인, 문제 조기 발견 | 하 | 그림자가 늦게 따라오거나 일시정지 중 멈춘 연출이 있으면 `renderActivity.keepAlive()` 추가 |
| TP | overhead_crane.glb · containers.glb PNG → KTX2 | VRAM · 업로드 시간 감소 (약 1.4 MB) | 하 | `gltf-transform etc1s/uastc` |
| TP | 카메라 이동 중 DPR 낮추기 (선택) | 조작 중 프레임 시간 감소 | 하 | 사용자는 이동 중 화질 저하를 원하지 않음 → SFM에서는 제거함. TP에 넣을지 먼저 확인 |
| TP | 그림자 갱신 줄이기 | 정지 · 정적 장면에서 그림자 패스 제거 | 중 | SFM `shadowThrottle.ts` 이식 + 카메라 추종 그림자라 카메라 이동도 조건에 포함 |
| SFM | GLB 텍스처 중복 제거 | 다운로드 · VRAM 수 MB 감소 | 중 | 같은 텍스처를 공유 GLB(머티리얼 라이브러리)로 빼거나, 로더에서 이미지 해시로 Texture 재사용. 먼저 해시로 실제 중복인지 확인 |
| SFM | factory_hdr.exr 경량화 | 3.7 MB → 1 MB 이하 예상 | 하 | 알파 채널 제거(RGB), 1024×512, 또는 .hdr(RGBE)/UltraHDR. PMREM 결과 화질 비교 |

| SFM | 북마크 7번 키 이동 시 약 50ms 프레임 1회 | 시점 이동 끊김 제거 | 중 | 처음 보는 영역의 셰이더 컴파일 · 텍스처 업로드 · 그림자 맵 재생성 의심. Performance 탭으로 원인 확인 후 예열 대상 추가 (`FactoryWarmup.tsx`) |
| SFM | 페이지(화면) 전환 시 끊김 1회 | 전환 끊김 제거 | 중 | 패널 마운트(React 커밋) · SceneSlot DOM 이동 · 캔버스 리사이즈가 한 프레임에 몰리는지 확인. 패널 마운트 분산 또는 리사이즈 지연 |

## P2

| 프로젝트 | 작업 | 기대 효과 | 난이도 | 메모 |
| --- | --- | --- | --- | --- |
| TP | 컨테이너 상태(색 · 상태 · 하이라이트)를 인스턴스 attribute / 데이터 텍스처로 | 메시 · 재질 · 예열 프로그램 수 감소 | 중 | "GPU 텍스처를 만들고 갖다 쓰는" 방식의 1순위 후보 |
| TP | KTX2 트랜스코드 워커 복구 | 로딩 중 메인 스레드 Long Task 감소 | 중 | `ktx2MainThread.ts` 우회 원인 확인부터 |
| SFM | GLB 양자화 (`KHR_mesh_quantization`) | GLB 크기 · VRAM 감소 | 하 | `gltf-transform quantize`. 피킹 AABB · 위치 정밀도 확인 |
| SFM | factory.glb 정적 props 병합 또는 BatchedMesh | draws 감소 (메시 152 · 재질 14) | 중 | 인트로 와이어프레임 · 바닥 반투명 · FloorMarking polygonOffset 처리 유지 필요 |
| SFM | 일시정지가 아닌 정지 상황의 render on demand 확대 | GPU 사용 감소 | 중 | 재생 중이라도 화면에 움직이는 게 없을 때를 판별해야 함 |
| SFM | WebGPU 경로 그림자 갱신 줄이기 | WebGPU 선택 시 프레임 시간 감소 | 중 | 조명별 `light.shadow.autoUpdate / needsUpdate` |
| SFM | 상세 · 스캔 · 창고 페이지 React.lazy | 첫 로드 JS 감소 | 하 | 전환 애니메이션 중 Suspense 대체 화면 처리, 예열 후 프리로드 |
| SFM | robot.glb 정리 | 저장소 정리 | 하 | 코드에서 참조 안 함 (번들엔 안 들어감) |

## P3

| 프로젝트 | 작업 | 메모 |
| --- | --- | --- |
| SFM | 차량 · 랙 · 팔레트 인스턴싱 | 개별 이동 · 선택 · 고장 하이라이트 · 박스 부모 관계를 인스턴스 인덱스 기반으로 바꿔야 함. 장비 수가 크게 늘면 |
| 공통 | LOD / 메시 단순화 | tris 가 병목일 때. TP는 이미 적용 |
| TP | BUSAN 작은 텍스처 24장 → 배열 텍스처 · 아틀라스 | 재질 · 바인딩 수 감소 |
| TP | 먼 배 · 크레인 임포스터 / HLOD | 원경 draws · tris 감소 |
| TP | compute 컬링 + 간접 드로우 (WebGPU) | 컨테이너가 수만 개 이상일 때 |
| 공통 | CSM | 넓은 맵에서 가까운 그림자 해상도 부족할 때 |
| 공통 | 오클루전 컬링, OffscreenCanvas | 효과 대비 작업량 큼 |
