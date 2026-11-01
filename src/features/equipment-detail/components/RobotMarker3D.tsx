import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Vector3, type Group } from 'three'

import { useMonitorState } from '@/shared/hooks/useMonitorView'
import { screenBounds, type ScreenRect } from '@/shared/lib/three/screenBounds'
import { worldTopCenter } from '@/shared/lib/three/worldAnchor'

import { useRobotDetail } from '../hooks/useRobotDetail'
import { ROBOT_STATUS_COLOR } from '../lib/robotStatusColor'
import type { CalloutLayout } from './RobotCalloutOverlay'

const base = new Vector3()

const anchor = new Vector3()

const rect: ScreenRect = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

/** 선택 로봇 바닥 링 마커 + 로봇을 가리지 않는 콜아웃 카드 (화면 bbox 바깥, 리더선으로 연결) */
interface Props {
  layout: RefObject<CalloutLayout | null>
}

export default function RobotMarker3D({ layout }: Props) {
  const { robotId } = useMonitorState()

  const detail = useRobotDetail()

  const scene = useThree((state) => state.scene)

  const group = useRef<Group>(null)

  useFrame(({ camera, size }) => {
    const robot = scene.getObjectByName(robotId)

    if (!robot || !group.current) return

    robot.getWorldPosition(base)

    group.current.position.set(base.x, 0.02, base.z)

    const bounds = screenBounds(robot, camera, size.width, size.height, rect)

    worldTopCenter(robot, anchor).project(camera)

    const visible = anchor.z <= 1 && Math.abs(anchor.x) <= 1 && Math.abs(anchor.y) <= 1

    layout.current?.update(bounds ? { rect: bounds, anchor: visible ? [((anchor.x + 1) / 2) * size.width, ((1 - anchor.y) / 2) * size.height] : null, size: [size.width, size.height] } : null)
  })

  if (!detail) return null

  const color = ROBOT_STATUS_COLOR[detail.status]

  return (
    <group ref={group}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.62, 64]} />

          <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.5, 64]} />

          <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.95, 2.0, 64]} />

          <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
        </mesh>

        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12, 24]} />

          <meshBasicMaterial color={color} />
        </mesh>
    </group>
  )
}
