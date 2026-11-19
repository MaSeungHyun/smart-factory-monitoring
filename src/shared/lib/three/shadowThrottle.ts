import type { DirectionalLight, InstancedMesh, Mesh, Object3D, Scene, SpotLight, WebGLRenderer } from 'three'

import { isSecondaryRender } from './secondaryRender'

/** 그림자를 드리우는 물체가 그대로여도 이 렌더 횟수마다 한 번은 그림자 맵을 다시 그린다 (재질 변경 등 안전망) */
const FORCE_EVERY = 120

type ShadowLight = DirectionalLight | SpotLight

/**
 * 그림자 맵 갱신을 "바뀐 프레임"으로만 줄인다 (WebGL 전용).
 * shadowMap.autoUpdate 를 끄고, scene.onBeforeRender(행렬 갱신 뒤 · 그림자 렌더 전)에서
 * 그림자를 드리우는 메시 · 조명의 월드 행렬, 보이기, 인스턴스 버전이 바뀌었을 때만 needsUpdate 를 켠다.
 * 로봇이 멈춰 있거나 재생이 멈추면 2048 그림자 맵 렌더를 건너뛴다. 움직이는 프레임은 지금과 똑같이 그린다.
 */
export function installShadowThrottle(gl: WebGLRenderer, scene: Scene) {
  const values: number[] = []

  let renders = 0

  const previous = scene.onBeforeRender

  const record = (index: number, value: number) => {
    if (values[index] === value) return false

    values[index] = value

    return true
  }

  scene.onBeforeRender = (...args: Parameters<Scene['onBeforeRender']>) => {
    previous.apply(scene, args)

    if (!gl.shadowMap.enabled || isSecondaryRender()) return

    let index = 0

    let changed = false

    scene.traverseVisible((object: Object3D) => {
      const light = object as ShadowLight

      if (light.isLight && light.castShadow && light.shadow) {
        changed = record(index++, object.id) || changed

        changed = record(index++, light.shadow.mapSize.x) || changed

        for (const value of object.matrixWorld.elements) changed = record(index++, value) || changed

        for (const value of light.target.matrixWorld.elements) changed = record(index++, value) || changed

        return
      }

      if (!object.castShadow || !(object as Mesh).isMesh) return

      changed = record(index++, object.id) || changed

      const instanced = object as InstancedMesh

      if (instanced.isInstancedMesh) changed = record(index++, instanced.instanceMatrix.version + instanced.count * 1e6) || changed

      for (const value of object.matrixWorld.elements) changed = record(index++, value) || changed
    })

    if (values.length !== index) {
      values.length = index

      changed = true
    }

    renders += 1

    if (changed || renders >= FORCE_EVERY) {
      renders = 0

      gl.shadowMap.needsUpdate = true
    }
  }

  gl.shadowMap.autoUpdate = false

  gl.shadowMap.needsUpdate = true

  return () => {
    scene.onBeforeRender = previous

    gl.shadowMap.autoUpdate = true

    gl.shadowMap.needsUpdate = true
  }
}
