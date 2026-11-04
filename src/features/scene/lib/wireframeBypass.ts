import type { LineSegments, MeshStandardMaterial } from 'three'

export interface WireSaved {
  opacity: number
  transparent: boolean
  depthWrite: boolean
}

/** FactoryWireframe 이 켜져 있을 때 채워 두는 현재 상태 (원래 재질 값 · 겹친 선) */
export const wireState = {
  active: false,
  saved: new Map<MeshStandardMaterial, WireSaved>(),
  lines: [] as LineSegments[][],
}

const opacity = new Map<MeshStandardMaterial, number>()

const depth = new Map<MeshStandardMaterial, boolean>()

/**
 * 비전 인셋처럼 실제 모델로 그려야 하는 렌더: 그 동안만 선을 숨기고 면 불투명도 · 깊이 쓰기를 원래대로 돌린다.
 * transparent 는 바꾸지 않는다 (셰이더 재컴파일 방지). 메인 뷰 비용은 그대로
 */
export function withRealMaterials(render: () => void) {
  if (!wireState.active) {
    render()

    return
  }

  for (const [material, snap] of wireState.saved) {
    opacity.set(material, material.opacity)

    depth.set(material, material.depthWrite)

    material.opacity = snap.opacity

    material.depthWrite = snap.depthWrite
  }

  for (const group of wireState.lines) for (const line of group) line.visible = false

  try {
    render()
  } finally {
    for (const group of wireState.lines) for (const line of group) line.visible = true

    for (const [material, value] of opacity) material.opacity = value

    for (const [material, value] of depth) material.depthWrite = value

    opacity.clear()

    depth.clear()
  }
}