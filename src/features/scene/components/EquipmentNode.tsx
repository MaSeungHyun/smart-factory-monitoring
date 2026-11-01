import type { SceneEquipment } from '@/shared/types'

import EquipmentModel from './EquipmentModel'

type Props = {
  entity: SceneEquipment
  elevation: number
}

/**
 * 장비 하나의 그룹. name / userData.equipmentId 에 템플릿 id 를 넣어
 * 이후 JSON 재생 시 scene.getObjectByName(id) 로 찾아 움직일 수 있게 한다.
 */
export default function EquipmentNode({ entity, elevation }: Props) {
  return (
    <group
      name={entity.id}
      userData={{ equipmentId: entity.id, kind: entity.kind }}
      position={[entity.x, elevation, entity.z]}
      rotation={[0, entity.yaw, 0]}
    >
      <EquipmentModel entity={entity} />
    </group>
  )
}
