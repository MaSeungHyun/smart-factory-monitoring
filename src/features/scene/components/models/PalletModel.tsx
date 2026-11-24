import type { Object3D } from 'three'

import { castShadows, centerOnFloor } from '@/shared/lib/three/modelBounds'

import { PALLET_YAW } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

type Props = { y?: number }

/** 팔레트는 포크리프트 · AMR 이 옮기므로 그림자를 드리운다 */
const preparePallet = (model: Object3D) => castShadows(centerOnFloor(model))

/** pallet.glb: 중심/바닥 기준 보정 후 90° 회전 (createUnitPallet + palletYawDegrees) */
export default function PalletModel({ y = 0 }: Props) {
  const model = useCloned(MODEL_URL.pallet, preparePallet)

  return (
    <group position={[0, y, 0]} rotation={[0, PALLET_YAW, 0]}>
      <primitive object={model} />
    </group>
  )
}
