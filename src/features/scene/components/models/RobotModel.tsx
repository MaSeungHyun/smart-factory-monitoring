import { useLayoutEffect, useMemo } from 'react'
import { Group, Matrix4, type Object3D } from 'three'

import { findGlbNode } from '@/shared/lib/three/glbNode'
import { castShadows } from '@/shared/lib/three/modelBounds'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import type { SceneEquipment } from '@/shared/types'

import { MODEL_URL } from '../../constants/modelUrls'
import { ROBOT_PEDESTALS } from '../../constants/modelPlacement'
import { useCloned } from '../../lib/useCloned'

const PEDESTAL_URL = {
  base: MODEL_URL.robotBase,
  place: MODEL_URL.robotArmPlace,
} as const

/** 받침대 GLB: *_point empty 가 팔 원점(그룹 원점)에 오도록 이동 */
function Pedestal({ kind }: { kind: keyof typeof PEDESTAL_URL }) {
  const { scene } = useGLTF(PEDESTAL_URL[kind])

  const model = useMemo(() => {
    const clone = castShadows(scene.clone(true))

    clone.updateMatrixWorld(true)

    const point = findGlbNode(clone, ROBOT_PEDESTALS[kind].point)

    const wrapper = new Group()

    wrapper.add(clone)

    // robot_IK RobotPedestal: point 의 월드 행렬 역행렬 전체(이동+회전)를 적용
    if (point) clone.applyMatrix4(new Matrix4().copy(point.matrixWorld).invert())

    return wrapper as Object3D
  }, [scene, kind])

  return <primitive object={model} />
}

/** RobotArm.glb (원본 그대로) + 선택된 받침대 */
export default function RobotModel({ entity }: { entity: SceneEquipment }) {
  const arm = useCloned(MODEL_URL.robotArm)

  useLayoutEffect(() => {
    castShadows(arm)
  }, [arm])

  const pedestal = entity.settings?.robotPedestal

  const pedestalYaw = ((entity.settings?.robotPedestalYaw ?? 0) * Math.PI) / 180

  return (
    <>
      <primitive object={arm} />

      {pedestal && pedestal !== 'none' && (
        <group rotation={[0, pedestalYaw, 0]}>
          <Pedestal kind={pedestal} />
        </group>
      )}
    </>
  )
}
