import { centerOnFloor } from '@/shared/lib/three/modelBounds'

import { PALLET_YAW } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

type Props = { y?: number }

/** pallet.glb: 중심/바닥 기준 보정 후 90° 회전 (createUnitPallet + palletYawDegrees) */
export default function PalletModel({ y = 0 }: Props) {
  const model = useCloned(MODEL_URL.pallet, centerOnFloor)

  return (
    <group position={[0, y, 0]} rotation={[0, PALLET_YAW, 0]}>
      <primitive object={model} />
    </group>
  )
}
