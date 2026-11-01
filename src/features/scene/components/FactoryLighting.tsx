import { Environment } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useMemo } from 'react'

import hdrUrl from '@/assets/hdr/factory_hdr.exr?url'
import { FACTORY_GLB_URL } from '@/features/template'
import { EquirectEXRLoader } from '@/shared/lib/three/exrLoader'
import { useGLTF } from '@/shared/lib/three/gltfLoader'

import { buildFactoryLights } from '../lib/factoryLights'

/** factory.glb 의 KHR_lights_punctual 조명(Blender 기준 세기) + 공장 HDR 환경맵 */
export default function FactoryLighting() {
  const { scene } = useGLTF(FACTORY_GLB_URL)

  const lights = useMemo(() => buildFactoryLights(scene), [scene])

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
