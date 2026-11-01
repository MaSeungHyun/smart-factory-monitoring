import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Box3, Vector3, type Group } from 'three'

import { useMonitorState } from '@/shared/hooks/useMonitorView'
import { screenBounds, type ScreenRect } from '@/shared/lib/three/screenBounds'
import { surfaceBelow } from '@/shared/lib/three/surfaceBelow'

import { useRobotDetail } from '../hooks/useRobotDetail'
import { useRobotWorkSpot } from '../hooks/useRobotWorkSpot'
import { ROBOT_STATUS_COLOR } from '../lib/robotStatusColor'
import type { CalloutLayout } from './RobotCalloutOverlay'
import WorkSpotMarker from './WorkSpotMarker'

/** 바닥 마커를 표면 위로 살짝 띄움 (z-fighting 방지) */
const LIFT = 0.015

/** 표면을 못 찾았을 때 박스 윗면 기준 추정 높이 */
const FALLBACK_DROP = 0.3

const spot = new Vector3()

const anchor = new Vector3()

const markerBox = new Box3()

const rect: ScreenRect = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

const markerRect: ScreenRect = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

interface Props {
  layout: RefObject<CalloutLayout | null>
}

/** 선택 로봇의 작업 지점 (박스 집는 곳) 바닥 마커 + 로봇/마커를 가리지 않는 콜아웃 카드 */
export default function RobotMarker3D({ layout }: Props) {
  const { robotId } = useMonitorState()

  const detail = useRobotDetail()

  const workSpot = useRobotWorkSpot()

  const scene = useThree((state) => state.scene)

  const group = useRef<Group>(null)

  const surface = useRef<{ key: string; y: number | null }>({ key: '', y: null })

  useFrame(({ camera, size }) => {
    const robot = scene.getObjectByName(robotId)

    if (!robot || !group.current) return

    if (workSpot) {
      const key = `${robotId}:${workSpot.join(',')}`

      if (surface.current.key !== key || surface.current.y === null) {
        surface.current = { key, y: surfaceBelow(scene, workSpot[0], workSpot[1] + 0.05, workSpot[2], group.current) }
      }

      spot.set(workSpot[0], (surface.current.y ?? workSpot[1] - FALLBACK_DROP) + LIFT, workSpot[2])
    } else {
      robot.getWorldPosition(spot)

      spot.y = LIFT
    }

    group.current.position.copy(spot)

    const bounds = screenBounds(robot, camera, size.width, size.height, rect)

    markerBox.setFromObject(group.current)

    const marker = markerBox.isEmpty() ? null : screenBounds(group.current, camera, size.width, size.height, markerRect)

    if (bounds && marker) {
      bounds.minX = Math.min(bounds.minX, marker.minX)

      bounds.minY = Math.min(bounds.minY, marker.minY)

      bounds.maxX = Math.max(bounds.maxX, marker.maxX)

      bounds.maxY = Math.max(bounds.maxY, marker.maxY)
    }

    anchor.copy(spot).project(camera)

    const visible = anchor.z <= 1 && Math.abs(anchor.x) <= 1 && Math.abs(anchor.y) <= 1

    layout.current?.update(bounds ? { rect: bounds, anchor: visible ? [((anchor.x + 1) / 2) * size.width, ((1 - anchor.y) / 2) * size.height] : null, size: [size.width, size.height] } : null)
  })

  if (!detail) return null

  return (
    <group ref={group}>
      <WorkSpotMarker color={ROBOT_STATUS_COLOR[detail.status]} />
    </group>
  )
}
