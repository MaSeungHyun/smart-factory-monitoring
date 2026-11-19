import type { Scene, WebGLRenderer } from 'three'

let secondaryDepth = 0

/** 지금 보조 렌더 중인지 (그림자 갱신 게이트가 보조 렌더에서 그림자 맵을 다시 그리지 않게) */
export function isSecondaryRender() {
  return secondaryDepth > 0
}

/**
 * 같은 프레임에 메인 화면을 그린 뒤 한 번 더 그리는 보조 렌더 (비전 인셋 등).
 * 그림자 맵과 월드 행렬은 메인 렌더에서 이미 이번 프레임 값으로 갱신됐으므로 다시 계산하지 않는다.
 * 2048 그림자 맵을 두 번 그리던 비용과 씬 전체 행렬 순회를 덜어 카메라 이동 중 프레임 시간을 줄인다
 */
export function renderSecondary(gl: WebGLRenderer, scene: Scene, draw: () => void) {
  const shadowAuto = gl.shadowMap.autoUpdate

  const shadowNeeds = gl.shadowMap.needsUpdate

  const matrixAuto = scene.matrixWorldAutoUpdate

  gl.shadowMap.autoUpdate = false

  gl.shadowMap.needsUpdate = false

  scene.matrixWorldAutoUpdate = false

  secondaryDepth += 1

  try {
    draw()
  } finally {
    secondaryDepth -= 1

    gl.shadowMap.autoUpdate = shadowAuto

    gl.shadowMap.needsUpdate = shadowNeeds

    scene.matrixWorldAutoUpdate = matrixAuto
  }
}
