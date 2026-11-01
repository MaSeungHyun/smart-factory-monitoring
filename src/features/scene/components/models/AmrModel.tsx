import { centerOnFloor } from '@/shared/lib/three/modelBounds'
import type { SceneEquipment } from '@/shared/types'

import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

const FORKLIFT_ROLES = new Set(['forklift', 'rack'])

function Forklift() {
  return <primitive object={useCloned(MODEL_URL.forklift)} />
}

function Agv() {
  return <primitive object={useCloned(MODEL_URL.agv)} />
}

/** AMR.glb 는 바운딩 박스 중심/바닥 기준으로 보정 */
function Amr() {
  return <primitive object={useCloned(MODEL_URL.amr, centerOnFloor)} />
}

/** amrRole: forklift/rack -> Forklift.glb, agv -> AGV.glb, 그 외 -> AMR.glb */
export default function AmrModel({ entity }: { entity: SceneEquipment }) {
  const role = entity.settings?.amrRole

  if (role && FORKLIFT_ROLES.has(role)) return <Forklift />

  if (role === 'agv') return <Agv />

  return <Amr />
}
