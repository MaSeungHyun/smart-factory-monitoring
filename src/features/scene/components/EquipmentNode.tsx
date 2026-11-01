import type { ThreeEvent } from '@react-three/fiber'

import { flyToEquipment } from '@/shared/lib/equipmentActions'
import { uiStore } from '@/shared/stores/uiStore'
import type { SceneEquipment } from '@/shared/types'

import EquipmentModel from './EquipmentModel'

type Props = {
  entity: SceneEquipment
  elevation: number
}

/** 드래그(카메라 회전) 뒤 클릭은 선택으로 보지 않음 (px) */
const CLICK_SLOP = 4

const setCursor = (value: string) => {
  document.body.style.cursor = value
}

/**
 * 장비 하나의 그룹. name / userData.equipmentId 에 템플릿 id 를 넣어
 * 이후 JSON 재생 시 scene.getObjectByName(id) 로 찾아 움직일 수 있게 한다.
 * 호버: 커서 + 옅은 외곽, 클릭: 선택 (목록과 동기), 더블클릭: 카메라 비행
 */
export default function EquipmentNode({ entity, elevation }: Props) {
  const onOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()

    uiStore.hover(entity.id)

    setCursor('pointer')
  }

  const onOut = () => {
    if (uiStore.get().hoverId === entity.id) uiStore.hover(null)

    setCursor('')
  }

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (event.delta <= CLICK_SLOP) uiStore.toggleSelect(entity.id)
  }

  const onDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    flyToEquipment(entity.id)
  }

  return (
    <group
      name={entity.id}
      userData={{ equipmentId: entity.id, kind: entity.kind }}
      position={[entity.x, elevation, entity.z]}
      rotation={[0, entity.yaw, 0]}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <EquipmentModel entity={entity} />
    </group>
  )
}
