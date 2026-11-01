import type { SceneEquipment } from '@/shared/types'

import { DOCK, PALLET_HEIGHT, PALLET_SOURCE_STACK } from '../../constants/modelPlacement'
import PalletModel from './PalletModel'

/** 빈 팔레트 적치장: 바닥 표시 + 초기 적재 팔레트 */
export default function DockModel({ entity }: { entity: SceneEquipment }) {
  const source = entity.settings?.dockRole === 'palletSource'

  return (
    <>
      <mesh position={[0, DOCK.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DOCK.size, DOCK.size]} />

        <meshStandardMaterial color={DOCK.color} transparent opacity={DOCK.opacity} />
      </mesh>

      {source &&
        Array.from({ length: PALLET_SOURCE_STACK }, (_, index) => (
          <PalletModel key={index} y={index * PALLET_HEIGHT} />
        ))}
    </>
  )
}
