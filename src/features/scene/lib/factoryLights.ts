import { DirectionalLight, Object3D, SpotLight, Vector3 } from 'three'

/** smart-factory factoryLights 축약판: 이름 규칙별 세기와 그림자 여부 */
const RULES = [
  { match: /^HighBay_\d+$/, intensity: 201.3, shadow: false },
  { match: /^Process_Key_\d+$/, intensity: 146.4, shadow: false },
  { match: /^Dock_Daylight$/, intensity: 477.5, shadow: false },
  { match: /^Sun$/, intensity: 1.0, shadow: true },
]

/** 태양광은 방향 그대로 멀리 빼서 ±80 m 그림자 박스가 공장 전체를 덮게 한다 */
const SUN_BACK = 200

export type FactoryLight = SpotLight | DirectionalLight

function configureSunShadow(light: DirectionalLight) {
  light.castShadow = true

  light.shadow.mapSize.set(2048, 2048)

  light.shadow.bias = -0.0003

  light.shadow.normalBias = 0.03

  const camera = light.shadow.camera

  camera.left = -80
  camera.right = 80
  camera.top = 80
  camera.bottom = -80
  camera.near = 0.5
  camera.far = 400
}

/** factory.glb 의 조명으로 새 조명(+target) 생성 */
export function buildFactoryLights(scene: Object3D) {
  scene.updateMatrixWorld(true)

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

      lights.push(light)

      return
    }

    const sun = new DirectionalLight(source.color, rule.intensity)

    sun.position.subVectors(from, to).normalize().multiplyScalar(SUN_BACK)

    sun.target = target

    if (rule.shadow) configureSunShadow(sun)

    lights.push(sun)
  })

  return lights
}
