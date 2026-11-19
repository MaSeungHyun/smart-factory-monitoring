# 웹 3D 최적화 문서

three.js · React Three Fiber(R3F) 기반 웹 3D 앱(디지털 트윈, 관제 화면 등)에 쓰는 최적화 기법과
프로젝트별 적용 현황을 정리한 폴더입니다. 다른 프로젝트로 그대로 복사해서 체크리스트로 쓸 수 있게 일반화해 두었습니다.

작성: 2026-11-17 (KST)

## 파일

| 파일 | 내용 |
| --- | --- |
| [checklist.md](./checklist.md) | 기법별 설명 · 언제 쓰는지 · 난이도 · 확인 방법 (프로젝트 공통 체크리스트) |
| [applied-smart-factory-monitoring.md](./applied-smart-factory-monitoring.md) | smart-factory-monitoring 적용 현황(파일 경로 포함)과 2026-11-17 작업 내역 |
| [applied-twin-port.md](./applied-twin-port.md) | Twin-Port(항만 트윈) 점검 결과 요약 (2026-11-12 기준, 코드만 읽음) |
| [backlog.md](./backlog.md) | 두 프로젝트에서 남은 작업, 우선순위 순 |
| [references.md](./references.md) | 참고 자료 링크 |

## 새 프로젝트에 적용하는 순서

1. **먼저 잰다.** `renderer.info.render.calls`(draws), `triangles`, 프레임 시간(ms), `renderer.info.memory.textures/geometries`를 화면에 띄운다 (r3f-perf, stats-gl, 또는 직접 만든 PerfOverlay).
2. **에셋부터 줄인다.** GLB는 meshopt + 양자화, 텍스처는 KTX2(Basis) + 밉맵. 다운로드 · 파싱 · VRAM이 한꺼번에 준다. 효과 대비 작업량이 가장 작다.
3. **드로우콜을 줄인다.** 같은 모양은 InstancedMesh, 모양이 다른 정적 부품은 병합(mergeGeometries) 또는 BatchedMesh.
4. **매 프레임 하는 일을 줄인다.** 그림자 맵 갱신, 화면 해상도(DPR), 정지 화면 렌더(render on demand), React 리렌더(useFrame 안에서 직접 변경).
   - 카메라 이동 중 DPR을 낮추는 기법(regress)은 화질이 잠깐 떨어진다. smart-factory-monitoring 은 사용자 선호(이동 중에도 화질 유지)로 쓰지 않는다.
5. **로딩 중 끊김을 없앤다.** 셰이더 예열(compileAsync), 텍스처 업로드 분할, 로딩 중 렌더 게이트.
6. **그다음이 GPU 주도 기법.** 인스턴스 상태를 데이터 텍스처 · 스토리지 버퍼로, compute 컬링 + 간접 드로우, 임포스터. 수만 개 규모가 아니면 효과 대비 작업량이 크다.
7. **다시 잰다.** 같은 카메라 시점 · 같은 재생 시각에서 전후 값을 비교한다. 기대 효과는 일반적인 경향일 뿐이다.

## 용어

- **draws**: 한 프레임의 드로우콜 수. CPU 부담의 대표 지표.
- **tris**: 한 프레임에 그린 삼각형 수. GPU 정점 부담.
- **DPR**: devicePixelRatio. 2면 픽셀 수가 4배라 프래그먼트 비용도 거의 4배.
- **KTX2 / Basis**: GPU가 압축된 채로 바로 읽는 텍스처 포맷(BC/ASTC/ETC)으로 트랜스코드되는 컨테이너. PNG/JPG는 GPU에 올리면 압축이 풀려 VRAM을 그대로 차지한다.
