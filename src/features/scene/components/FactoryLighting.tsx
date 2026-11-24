import { Environment } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { Euler, LinearSRGBColorSpace, PCFShadowMap, type SpotLight } from 'three'

import hdrUrl from '@/assets/hdr/factory_hdr.exr?url'
import { FACTORY_GLB_URL } from '@/features/template'
import { EquirectEXRLoader } from '@/shared/lib/three/exrLoader'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { SHADOW_MAP, SPOT_SHADOW_MAP, STATIC_SHADOW_MAP, useGraphics, type ShadowLevel } from '@/shared/stores/useGraphicsStore'

import { buildFactoryLights, SHADOW_LIGHT_FLAG, type FactoryLight } from '../lib/factoryLights'


/** HDR 환경광 세기. 올리면 그늘이 밝아지고, 내리면 그림자가 진해진다 */
const ENV_MAP_INTENSITY = 2;

const TONE_MAPPING_EXPOSURE = 0.85;

/** factory.glb 의 KHR_lights_punctual 조명(Blender 기준 세기) + 공장 HDR 환경맵 */
/** 조명 종류별 그림자 맵 크기: 움직이는 태양 = SHADOW_MAP, 고정 태양 = STATIC_SHADOW_MAP, 고정 스포트 = SPOT_SHADOW_MAP */
function shadowMapSize(light: FactoryLight, level: Exclude<ShadowLevel, 'off'>) {
  if ((light as SpotLight).isSpotLight) return SPOT_SHADOW_MAP[level]

  return light.shadow.autoUpdate === false ? STATIC_SHADOW_MAP[level] : SHADOW_MAP[level]
}

function applyShadow(lights: FactoryLight[], level: ShadowLevel) {
  for (const light of lights) {
    if (!light.userData[SHADOW_LIGHT_FLAG]) continue

    light.castShadow = level !== 'off'

    if (level === 'off') continue

    const size = shadowMapSize(light, level)

    if (light.shadow.mapSize.x !== size || light.shadow.mapSize.y !== size) {
      light.shadow.mapSize.set(size, size)

      light.shadow.map?.dispose()

      light.shadow.map = null
    }

    // 고정 그림자 조명은 자동 갱신이 꺼져 있어, 설정이 바뀌면(맵을 버렸거나 꺼졌다 켜짐) 한 번 다시 그린다
    if (light.shadow.autoUpdate === false) light.shadow.needsUpdate = true
  }
}

export default function FactoryLighting() {
  const { scene } = useGLTF(FACTORY_GLB_URL)

  const lights = useMemo(() => buildFactoryLights(scene), [scene])

  const shadow = useGraphics().shadow

  const gl = useThree((state) => state.gl)


  useLayoutEffect(() => {
    if (gl.shadowMap) {
      gl.shadowMap.enabled = shadow !== 'off'

      // autoUpdate 는 ShadowUpdateGate 가 맡는다 (WebGL: 움직인 프레임만 갱신). 설정이 바뀌면 한 번은 다시 그린다
      gl.shadowMap.needsUpdate = true

      gl.toneMappingExposure = TONE_MAPPING_EXPOSURE;
      gl.shadowMap.enabled = true;
      gl.outputColorSpace = LinearSRGBColorSpace;
      gl.shadowMap.type = PCFShadowMap;
    }

    // factory-props 의 그림자 역할(고정 드리움 / 받기만)은 FactoryProps 가 복제할 때 정한다
    applyShadow(lights, shadow)
  }, [gl, lights, shadow])

  const hdr = useLoader(EquirectEXRLoader, hdrUrl)

  return (
    <>
      <Environment map={hdr} environmentIntensity={ENV_MAP_INTENSITY} environmentRotation={new Euler(0, 0, 0)}/>

      {lights.map((light) => (
        <group key={light.uuid}>
          <primitive object={light} />

          <primitive object={light.target} />
        </group>
      ))}
    </>
  )
}
