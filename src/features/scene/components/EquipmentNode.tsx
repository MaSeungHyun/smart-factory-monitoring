import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { Group } from 'three'

import { flyToEquipment, pickDetailEquipment } from '@/shared/lib/equipmentActions'
import { getHover, setHover, uiStore } from '@/shared/stores/useUiStore'
import type { SceneEquipment } from '@/shared/types'

import { boundsRaycast, capturePickBox, registerEquipment } from '../lib/boundsRaycast'
import EquipmentModel from './EquipmentModel'

type Props = {
  entity: SceneEquipment
  elevation: number
}

/** 드래그(카메라 회전) 뒤 클릭은 선택으로 보지 않음 (px) */
const CLICK_SLOP = 4

/** 장비 사이를 지날 때 '' 와 pointer 를 한 이벤트에서 연달아 바꾸지 않는다 */
let cursorToken = 0

const setCursor = (value: string) => {
  if (document.body.style.cursor === value) return

  document.body.style.cursor = value
}

/**
 * 장비 하나의 그룹. name / userData.equipmentId 에 템플릿 id 를 넣어
 * 이후 JSON 재생 시 scene.getObjectByName(id) 로 찾아 움직일 수 있게 한다.
 * 호버: 커서 + 옅은 외곽 + 정보, 클릭: 선택 (목록과 동기, 정보 유지).
 * 픽킹은 모델 삼각형이 아니라 자식 그룹의 바운딩 박스만 본다.
 * 장비 상세 탭에서는 클릭한 로봇·AMR 계열로 오른쪽 정보도 바꾼다. 더블클릭: 카메라 비행
 */
export default function EquipmentNode({ entity, elevation }: Props) {
  const groupRef = useRef<Group>(null)

  useLayoutEffect(() => {
    const object = groupRef.current

    if (!object) return

    capturePickBox(object)

    return registerEquipment(entity.id, object)
  }, [entity.id])

  const onOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()

    cursorToken += 1

    setHover(entity.id)

    setCursor('pointer')
  }

  const onOut = () => {
    if (getHover() === entity.id) setHover(null)

    const token = ++cursorToken

    queueMicrotask(() => {
      if (token === cursorToken) setCursor('')
    })
  }

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (event.delta > CLICK_SLOP) return

    if (!pickDetailEquipment(entity.id)) uiStore.getState().toggleSelect(entity.id)
  }

  const onDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    flyToEquipment(entity.id)
  }

  return (
    <group
      ref={groupRef}
      name={entity.id}
      userData={{ equipmentId: entity.id, kind: entity.kind }}
      position={[entity.x, elevation, entity.z]}
      rotation={[0, entity.yaw, 0]}
    >
      <group
        raycast={boundsRaycast}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />

      <EquipmentModel entity={entity} />
    </group>
  )
}
