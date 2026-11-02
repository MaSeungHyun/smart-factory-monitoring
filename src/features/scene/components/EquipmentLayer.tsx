import type { SceneEquipment } from '@/shared/types'

import { equipmentPosition } from '../lib/equipmentPose'
import EquipmentNode from './EquipmentNode'

export default function EquipmentLayer({ equipment }: { equipment: SceneEquipment[] }) {
  return (
    <group name="equipment">
      {equipment.map((entity) => (
        <EquipmentNode
          key={entity.id}
          entity={entity}
          position={equipmentPosition(entity, equipment)}
        />
      ))}
    </group>
  )
}
