import { useLayoutEffect } from 'react'
import type { Object3D } from 'three'

import { centerOnFloor } from '@/shared/lib/three/modelBounds'
import type { SceneEquipment } from '@/shared/types'

import { BLOOM_LAYER } from '../../constants/bloomLayer'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

const FORKLIFT_ROLES = new Set(['forklift', 'rack'])

/** 블룸은 이 메시만 탄다. 레이어 0 은 유지해서 일반 화면에도 보인다 */
function BloomVehicle({ object }: { object: Object3D }) {
  useLayoutEffect(() => {
    object.traverse((node) => node.layers.enable(BLOOM_LAYER))
  }, [object])

  return <primitive object={object} />
}

function Forklift() {
  return <BloomVehicle object={useCloned(MODEL_URL.forklift)} />
}

function Agv() {
  return <BloomVehicle object={useCloned(MODEL_URL.agv)} />
}

/** AMR.glb 는 바운딩 박스 중심/바닥 기준으로 보정 */
function Amr() {
  return <BloomVehicle object={useCloned(MODEL_URL.amr, centerOnFloor)} />
}

/** amrRole: forklift/rack -> Forklift.glb, agv -> AGV.glb, 그 외 -> AMR.glb */
export default function AmrModel({ entity }: { entity: SceneEquipment }) {
  const role = entity.settings?.amrRole

  if (role && FORKLIFT_ROLES.has(role)) return <Forklift />

  if (role === 'agv') return <Agv />

  return <Amr />
}
