import { useMemo } from 'react'
import type { Object3D } from 'three'

import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { enableShadows } from '@/shared/lib/three/modelBounds'

/** GLB 를 불러와 장비마다 독립된 복제본을 만든다 (prepare 로 위치 보정) */
export function useCloned(url: string, prepare?: (model: Object3D) => Object3D) {
  const { scene } = useGLTF(url)

  return useMemo(() => {
    const model = scene.clone(true)

    return enableShadows(prepare ? prepare(model) : model)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prepare 는 모듈 상수
  }, [scene])
}
