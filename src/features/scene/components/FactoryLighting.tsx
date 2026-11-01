import { Environment } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import type { DirectionalLight } from 'three'

import hdrUrl from '@/assets/hdr/factory_hdr.exr?url'
import { FACTORY_GLB_URL } from '@/features/template'
import { EquirectEXRLoader } from '@/shared/lib/three/exrLoader'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { receiveShadows } from '@/shared/lib/three/modelBounds'
import { SHADOW_MAP, useGraphics } from '@/shared/stores/useGraphicsStore'

import { buildFactoryLights, type FactoryLight } from '../lib/factoryLights'

/** factory.glb 의 KHR_lights_punctual 조명(Blender 기준 세기) + 공장 HDR 환경맵 */
function applyShadow(lights: FactoryLight[], size: number) {
  for (const light of lights) {
    if (!(light as DirectionalLight).isDirectionalLight) continue

    const sun = light as DirectionalLight

    sun.castShadow = size > 0

    if (size > 0 && (sun.shadow.mapSize.x !== size || sun.shadow.mapSize.y !== size)) {
      sun.shadow.mapSize.set(size, size)

      sun.shadow.map?.dispose()

      sun.shadow.map = null
    }
  }
}

export default function FactoryLighting() {
  const { scene } = useGLTF(FACTORY_GLB_URL)

  const lights = useMemo(() => buildFactoryLights(scene), [scene])

  const shadow = useGraphics().shadow

  const gl = useThree((state) => state.gl)

  const root = useThree((state) => state.scene)

  useLayoutEffect(() => {
    if (gl.shadowMap) {
      gl.shadowMap.enabled = shadow !== 'off'

      gl.shadowMap.autoUpdate = true

      gl.shadowMap.needsUpdate = true
    }

    applyShadow(lights, shadow === 'off' ? 0 : SHADOW_MAP[shadow])

    const built = root.getObjectByName('factory-props')

    if (built) receiveShadows(built)
  }, [gl, lights, root, shadow])

  const hdr = useLoader(EquirectEXRLoader, hdrUrl)

  return (
    <>
      <Environment map={hdr} />

      {lights.map((light) => (
        <group key={light.uuid}>
          <primitive object={light} />

          <primitive object={light.target} />
        </group>
      ))}
    </>
  )
}
