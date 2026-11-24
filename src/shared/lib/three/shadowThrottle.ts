import type { DirectionalLight, InstancedMesh, Mesh, Object3D, Scene, SpotLight } from 'three'

import { isSecondaryRender } from './secondaryRender'
import { DYNAMIC_SHADOW_LAYER, STATIC_SHADOW_LAYER } from './shadowLayers'

/** 그림자를 드리우는 물체가 그대로여도 이 렌더 횟수마다 한 번은 움직이는 그림자 맵을 다시 그린다 (재질 변경 등 안전망) */
const FORCE_EVERY = 120

type ShadowLight = DirectionalLight | SpotLight

/** 여기서 쓰는 렌더러 shadowMap 부분 (WebGL · WebGPU 공통) */
interface ShadowRenderer {
  shadowMap: { enabled: boolean; autoUpdate: boolean; needsUpdate: boolean }
}

/** 한 번만 그리는 고정 그림자 조명 (shadow.autoUpdate = false, 필요할 때 shadow.needsUpdate) */
const isManual = (light: ShadowLight) => light.shadow.autoUpdate === false

/**
 * 그림자 맵 갱신을 "바뀐 프레임"으로만 줄인다.
 * - 움직이는 그림자(태양): gateDynamic(WebGL) 이면 shadowMap.autoUpdate 를 끄고, 움직이는 메시 · 조명의
 *   월드 행렬, 보이기, 인스턴스 버전이 바뀐 프레임만 needsUpdate 를 켠다. WebGPU 는 렌더러가 매 프레임 그린다.
 * - 고정 그림자 조명: 행렬은 비교하지 않고 고정 메시 목록(id)과 조명 자체만 본다. 새 정적 모델이 로드 · 표시되거나
 *   조명 방향 · 맵 크기가 바뀔 때만 그 조명의 shadow.needsUpdate 를 켠다.
 * scene.onBeforeRender 는 행렬 갱신 뒤 · 그림자 렌더 전에 불린다 (WebGL · WebGPU 둘 다)
 */
export function installShadowThrottle(gl: ShadowRenderer, scene: Scene, gateDynamic: boolean) {
  const values: number[] = []

  const statics: number[] = []

  const manual: ShadowLight[] = []

  let renders = 0

  const previous = scene.onBeforeRender

  const record = (list: number[], index: number, value: number) => {
    if (list[index] === value) return false

    list[index] = value

    return true
  }

  scene.onBeforeRender = (...args: Parameters<Scene['onBeforeRender']>) => {
    previous.apply(scene, args)

    if (!gl.shadowMap.enabled || isSecondaryRender()) return

    let index = 0

    let staticIndex = 0

    let changed = false

    let staticChanged = false

    manual.length = 0

    scene.traverseVisible((object: Object3D) => {
      const light = object as ShadowLight

      if (light.isLight && light.castShadow && light.shadow) {
        let moved = record(values, index++, object.id)

        moved = record(values, index++, light.shadow.mapSize.x) || moved

        for (const value of object.matrixWorld.elements) moved = record(values, index++, value) || moved

        for (const value of light.target.matrixWorld.elements) moved = record(values, index++, value) || moved

        if (!isManual(light)) {
          changed = moved || changed

          return
        }

        manual.push(light)

        if (moved) light.shadow.needsUpdate = true

        return
      }

      if (!object.castShadow || !(object as Mesh).isMesh) return

      // 고정 그림자 메시: 목록만 본다 (행렬 비교 없음)
      if (object.layers.isEnabled(STATIC_SHADOW_LAYER)) {
        staticChanged = record(statics, staticIndex++, object.id) || staticChanged

        return
      }

      // 레이어를 안 단 그림자 메시(JSX castShadow, 다시 만든 InstancedMesh 등)는 움직이는 쪽으로 본다
      if (!object.layers.isEnabled(DYNAMIC_SHADOW_LAYER)) object.layers.enable(DYNAMIC_SHADOW_LAYER)

      changed = record(values, index++, object.id) || changed

      const instanced = object as InstancedMesh

      if (instanced.isInstancedMesh) changed = record(values, index++, instanced.instanceMatrix.version + instanced.count * 1e6) || changed

      for (const value of object.matrixWorld.elements) changed = record(values, index++, value) || changed
    })

    if (values.length !== index) {
      values.length = index

      changed = true
    }

    if (statics.length !== staticIndex) {
      statics.length = staticIndex

      staticChanged = true
    }

    if (staticChanged) for (const light of manual) light.shadow.needsUpdate = true

    if (!gateDynamic) return

    const manualPending = manual.some((light) => light.shadow.needsUpdate)

    renders += 1

    // 전역 needsUpdate 를 켜야 WebGLShadowMap 이 돈다. 고정 조명은 자기 needsUpdate 가 꺼져 있으면 건너뛴다
    if (changed || manualPending || renders >= FORCE_EVERY) {
      renders = 0

      gl.shadowMap.needsUpdate = true
    }
  }

  if (gateDynamic) {
    gl.shadowMap.autoUpdate = false

    gl.shadowMap.needsUpdate = true
  }

  return () => {
    scene.onBeforeRender = previous

    if (!gateDynamic) return

    gl.shadowMap.autoUpdate = true

    gl.shadowMap.needsUpdate = true
  }
}