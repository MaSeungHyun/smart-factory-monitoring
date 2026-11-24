import type { Material, Mesh, Object3D } from 'three'

/** GLB 에 구워 넣은 바닥 그림자 판(rail_shadow · Forklift_shadow 등)의 재질 이름 */
const SHADOW_DECAL_MATERIAL = 'shadow'

/**
 * 그림자 판 그리기 순서. 반투명 바닥(BG_Floor) · 바닥 표식(alpha, FloorMarking)은 0 이고 깊이를 안 쓰므로,
 * 같은 높이(y≈0)의 그림자 판은 거리 정렬에 따라 바닥에 덮여 사라졌다. 1 로 두면 항상 바닥 위에 그린다
 */
export const SHADOW_DECAL_RENDER_ORDER = 1

const isDecal = (material: Material) => material.name === SHADOW_DECAL_MATERIAL

/** GLB 에 구운 그림자 판인지 */
export function isShadowDecal(mesh: Mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

  return materials.some(isDecal)
}

/** 로드한 GLB 원본에 한 번 적용한다. clone 은 renderOrder 를 그대로 복사한다 */
export function prepareShadowDecals(root: Object3D) {
  root.traverse((object) => {
    const mesh = object as Mesh

    if (!mesh.isMesh) return

    if (!isShadowDecal(mesh)) return

    mesh.renderOrder = SHADOW_DECAL_RENDER_ORDER

    // 구운 그림자 자체는 실시간 그림자를 드리우지 않는다
    mesh.castShadow = false
  })

  return root
}