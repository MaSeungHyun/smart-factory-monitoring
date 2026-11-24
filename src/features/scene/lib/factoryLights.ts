import { Box3, DirectionalLight, Object3D, OrthographicCamera, SpotLight, Vector3 } from 'three'

import { DYNAMIC_SHADOW_LAYER, STATIC_SHADOW_LAYER } from '@/shared/lib/three/shadowLayers'

/** 태양광 세기. 1.0 이면 천장 조명 · HDR 에 묻혀 그림자가 거의 안 보여 올렸다. 그림자를 더 진하게 하려면 올린다 */
const SUN_INTENSITY = 5

/**
 * 태양 세기 중 고정 그림자 조명이 가져가는 비율 (0~1). 나머지는 움직이는 그림자 태양.
 * 같은 방향 두 조명이라 전체 밝기는 그대로이고, 한쪽 그림자는 그 조명 몫만큼만 어두워진다.
 * 올리면 철창 · 랙 등 고정 그림자가 진해지고 로봇 · 차량 그림자가 옅어진다
 */
const STATIC_SHADOW_LIGHT_SHARE = 0.85

/** 그림자 깊이 비교 오프셋 (줄무늬 그림자 방지) */
const SUN_SHADOW_BIAS = -0.0003

/** 법선 방향 오프셋 (m). 기준 씬 값. 로봇 · 차량 표면에 줄무늬가 보이면 0.04 정도로 올린다 (키우면 접지 그림자가 떨어져 보인다) */
const SUN_SHADOW_NORMAL_BIAS = 0.03

/** PCF 그림자 가장자리 번짐 반경 (그림자 맵 텍셀 단위). r187 PCF 는 이 반경 안에서 5 샘플을 섞는다 */
const SUN_SHADOW_RADIUS = 4

/** 고정 그림자 스포트라이트 깊이 비교 오프셋 */
const SPOT_SHADOW_BIAS = -0.0003

/** 고정 그림자 스포트라이트 법선 방향 오프셋 (m) */
const SPOT_SHADOW_NORMAL_BIAS = 0.03

/** 고정 그림자 스포트라이트 가장자리 번짐 반경 (텍셀) */
const SPOT_SHADOW_RADIUS = 4

/** 기본 스포트라이트 그림자 맵 크기. 실제 크기는 그래픽 설정(SPOT_SHADOW_MAP)이 덮어쓴다 */
const SPOT_SHADOW_MAP_SIZE = 2048

/** 공장 바운딩 박스에 맞춘 그림자 범위에 더하는 여유 (m) */
const SUN_SHADOW_MARGIN = 2

/** 공장 바운딩 박스를 못 구했을 때 쓰는 그림자 범위 반폭 (m) */
const SUN_SHADOW_FALLBACK_HALF = 80

/**
 * smart-factory factoryLights 축약판: 이름 규칙별 세기와 그림자 여부.
 * 스포트라이트 shadow 는 고정 구조물 그림자만 한 번 그린다 (움직이는 물체는 태양 그림자만)
 */
const RULES = [
  // 스포트 세기는 기준 설정(블렌더와 같아 보이는 three.js 참고 렌더) 값 그대로
  { match: /^HighBay_\d+$/, intensity: 601.3, shadow: false },
  { match: /^Process_Key_\d+$/, intensity: 146.4, shadow: true },
  { match: /^Dock_Daylight$/, intensity: 477.5, shadow: true },
  { match: /^Sun$/, intensity: SUN_INTENSITY, shadow: true },
]

/** 태양광은 방향 그대로 멀리 빼서 그림자 카메라가 공장 전체를 앞에서 보게 한다 (범위는 fitSunShadow 가 맞춘다) */
const SUN_BACK = 200

export type FactoryLight = SpotLight | DirectionalLight

/** 그림자를 쓰는 조명 표시 (그래픽 설정 그림자 끔/켬 · 맵 크기는 FactoryLighting 이 이 표시로 고른다) */
export const SHADOW_LIGHT_FLAG = 'factoryShadow'

/** 고정 그림자: 이 레이어만 그리고, 맵은 한 번만 그린다 (ShadowUpdateGate 가 정적 모델이 바뀔 때 다시 그린다) */
function makeStaticShadow(light: FactoryLight) {
  light.shadow.camera.layers.set(STATIC_SHADOW_LAYER)

  light.shadow.autoUpdate = false

  light.shadow.needsUpdate = true
}

/** Process_Key · Dock_Daylight: 기본 그림자 카메라, 고정 구조물만 */
function configureSpotShadow(light: SpotLight) {
  light.castShadow = true

  light.userData[SHADOW_LIGHT_FLAG] = true

  light.shadow.mapSize.set(SPOT_SHADOW_MAP_SIZE, SPOT_SHADOW_MAP_SIZE)

  light.shadow.bias = SPOT_SHADOW_BIAS

  light.shadow.normalBias = SPOT_SHADOW_NORMAL_BIAS

  light.shadow.radius = SPOT_SHADOW_RADIUS

  makeStaticShadow(light)
}

/**
 * 그림자 카메라(직교)를 태양 시점에서 본 공장 바운딩 박스에 딱 맞춘다.
 * 고정 ±80 m 정사각형은 공장 일부를 잘라 먹고 빈 공간에 해상도를 썼다. 맞추면 같은 맵 크기로 그림자가 더 선명하다
 */
function fitSunShadow(light: DirectionalLight, target: Vector3, bounds: Box3) {
  const camera = light.shadow.camera

  if (bounds.isEmpty()) {
    camera.left = -SUN_SHADOW_FALLBACK_HALF
    camera.right = SUN_SHADOW_FALLBACK_HALF
    camera.top = SUN_SHADOW_FALLBACK_HALF
    camera.bottom = -SUN_SHADOW_FALLBACK_HALF
    camera.near = 0.5
    camera.far = SUN_BACK * 2

    return
  }

  // LightShadow.updateMatrices 와 같은 방식으로 태양 위치에서 target 을 바라보는 뷰 행렬
  const view = new OrthographicCamera()

  view.position.copy(light.position)

  view.lookAt(target)

  view.updateMatrixWorld(true)

  const min = new Vector3(Infinity, Infinity, Infinity)

  const max = new Vector3(-Infinity, -Infinity, -Infinity)

  const corner = new Vector3()

  for (let i = 0; i < 8; i += 1) {
    corner.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z)

    corner.applyMatrix4(view.matrixWorldInverse)

    min.min(corner)

    max.max(corner)
  }

  camera.left = min.x - SUN_SHADOW_MARGIN
  camera.right = max.x + SUN_SHADOW_MARGIN
  camera.bottom = min.y - SUN_SHADOW_MARGIN
  camera.top = max.y + SUN_SHADOW_MARGIN

  // 카메라는 -z 를 본다: 가까운 면 = -max.z, 먼 면 = -min.z
  camera.near = Math.max(0.5, -max.z - SUN_SHADOW_MARGIN)
  camera.far = -min.z + SUN_SHADOW_MARGIN

  camera.updateProjectionMatrix()
}

function configureSunShadow(light: DirectionalLight, target: Vector3, bounds: Box3, layer: number) {
  light.castShadow = true

  light.userData[SHADOW_LIGHT_FLAG] = true

  light.shadow.radius = SUN_SHADOW_RADIUS

  // 이 조명의 그림자 맵에는 이 레이어 메시만 그린다 (WebGLShadowMap · WebGPU ShadowNode 둘 다 shadow.camera.layers 를 본다)
  light.shadow.camera.layers.set(layer)

  // 실제 맵 크기는 그래픽 설정(SHADOW_MAP)이 FactoryLighting 에서 덮어쓴다
  light.shadow.mapSize.set(2048, 2048)

  light.shadow.bias = SUN_SHADOW_BIAS

  light.shadow.normalBias = SUN_SHADOW_NORMAL_BIAS

  fitSunShadow(light, target, bounds)
}

/** factory.glb 의 조명으로 새 조명(+target) 생성 */
export function buildFactoryLights(scene: Object3D) {
  scene.updateMatrixWorld(true)

  // 조명 · 카메라는 지오메트리가 없어 바운딩 박스에 안 들어간다
  const bounds = new Box3().setFromObject(scene)

  const lights: FactoryLight[] = []

  const from = new Vector3()

  const to = new Vector3()

  scene.traverse((object) => {
    const source = object as FactoryLight

    if (!source.isLight || !('target' in source)) return

    const rule = RULES.find((item) => item.match.test(source.name))

    if (!rule) return

    source.getWorldPosition(from)

    source.target.getWorldPosition(to)

    const target = new Object3D()

    if ((source as SpotLight).isSpotLight) {
      const spot = source as SpotLight

      const light = new SpotLight(spot.color, rule.intensity, spot.distance, spot.angle, spot.penumbra, spot.decay)

      light.position.copy(from)

      target.position.copy(to)

      light.target = target

      if (rule.shadow) configureSpotShadow(light)

      lights.push(light)

      return
    }

    const share = rule.shadow ? STATIC_SHADOW_LIGHT_SHARE : 0

    // 움직이는 그림자 태양: 로봇 · 차량 · 팔레트 · 박스만 그림자 맵에 그린다 (ShadowUpdateGate 가 움직인 프레임만 갱신)
    const sun = new DirectionalLight(source.color, rule.intensity * (1 - share))

    sun.name = 'factory-sun'

    sun.position.subVectors(from, to).normalize().multiplyScalar(SUN_BACK)

    sun.target = target

    // target 은 원점(그룹 루트)에 그대로 둔다: 태양은 방향만 의미가 있다
    if (rule.shadow) configureSunShadow(sun, target.position, bounds, DYNAMIC_SHADOW_LAYER)

    lights.push(sun)

    if (!rule.shadow) return

    // 고정 그림자 조명: 같은 방향 · 같은 그림자 범위. 정적 구조물만 그리고, 맵은 한 번만 그린다
    const fixed = new DirectionalLight(source.color, rule.intensity * share)

    fixed.name = 'factory-sun-static'

    fixed.position.copy(sun.position)

    fixed.target = new Object3D()

    configureSunShadow(fixed, fixed.target.position, bounds, STATIC_SHADOW_LAYER)

    makeStaticShadow(fixed)

    lights.push(fixed)
  })

  return lights
}
