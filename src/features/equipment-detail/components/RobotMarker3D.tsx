import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3, type Group } from 'three'

import { useMonitorState } from '@/shared/hooks/useMonitorView'

import { useRobotDetail } from '../hooks/useRobotDetail'
import RobotCallout from './RobotCallout'

const RING_COLOR = { running: '#34c77b', idle: '#8a8f98', warning: '#d99718', error: '#d94845' }

const CONNECTOR = 2.6

const base = new Vector3()

/** 선택 로봇 바닥 링 마커 + 세로 연결선 + 콜아웃 카드 (Canvas 안, 로봇 위치를 따라감) */
export default function RobotMarker3D() {
  const { robotId } = useMonitorState()

  const detail = useRobotDetail()

  const scene = useThree((state) => state.scene)

  const group = useRef<Group>(null)

  useFrame(() => {
    const robot = scene.getObjectByName(robotId)

    if (!robot || !group.current) return

    robot.getWorldPosition(base)

    group.current.position.set(base.x, 0.02, base.z)
  })

  if (!detail) return null

  const color = RING_COLOR[detail.status]

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

      <mesh position={[0, CONNECTOR / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, CONNECTOR, 6]} />

        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      <Html position={[0, CONNECTOR, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}>
        <RobotCallout detail={detail} />
      </Html>
    </group>
  )
}
