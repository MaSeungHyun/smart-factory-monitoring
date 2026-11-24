import type { Material, Mesh, Object3D } from 'three'

import { isShadowDecal } from './shadowDecals'

/**
 * 그림자 조명별 그릴 물체를 나누는 레이어 (light.shadow.camera.layers).
 * 레이어 0 은 그대로 두므로 화면 · 피킹에는 영향이 없다. BLOOM_LAYER(1) 과 겹치지 않게 2, 3 을 쓴다
 */

/** 고정 그림자 조명만 그리는 레이어: 가만히 있는 구조물 · 장비. 그림자 맵을 한 번만 그린다 */
export const STATIC_SHADOW_LAYER = 2

/** 움직이는 그림자 조명(태양)만 그리는 레이어: 로봇 · 차량 · 팔레트 · 박스 */
export const DYNAMIC_SHADOW_LAYER = 3

/** 반투명(BLEND) 재질은 그림자를 드리우지 않는다. 철망처럼 alphaTest 로 뚫린 재질은 불투명으로 보고 구멍째 그림자를 그린다 */
const isTransparent = (material: Material) => material.transparent

/** 그림자를 드리울 만한 불투명 메시인지 (구운 그림자 판 · 반투명 판은 제외) */
function canCast(mesh: Mesh) {
  if (isShadowDecal(mesh)) return false

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

  return materials.some((material) => !isTransparent(material))
}

/** 움직이는 물체: 움직이는 태양 그림자에만 드리우고, 그림자도 받는다 */
export function markDynamicCaster(model: Object3D) {
  model.traverse((object) => {
    if (!(object as Mesh).isMesh) return

    object.castShadow = true

    object.receiveShadow = true

    object.layers.enable(DYNAMIC_SHADOW_LAYER)

    object.layers.disable(STATIC_SHADOW_LAYER)
  })

  return model
}

/** 가만히 있는 물체: 고정 그림자 조명에만 드리우고(한 번만 그림), 그림자도 받는다 */
export function markStaticCaster(model: Object3D) {
  model.traverse((object) => {
    const mesh = object as Mesh

    if (!mesh.isMesh) return

    mesh.receiveShadow = true

    mesh.layers.disable(DYNAMIC_SHADOW_LAYER)

    mesh.castShadow = canCast(mesh)

    if (mesh.castShadow) mesh.layers.enable(STATIC_SHADOW_LAYER)
    else mesh.layers.disable(STATIC_SHADOW_LAYER)
  })

  return model
}

/** 그림자를 받기만 한다 (바닥 · 벽 셸, 바닥 표식) */
export function markReceiver(model: Object3D) {
  model.traverse((object) => {
    if (!(object as Mesh).isMesh) return

    object.castShadow = false

    object.receiveShadow = true

    object.layers.disable(STATIC_SHADOW_LAYER)

    object.layers.disable(DYNAMIC_SHADOW_LAYER)
  })

  return model
}