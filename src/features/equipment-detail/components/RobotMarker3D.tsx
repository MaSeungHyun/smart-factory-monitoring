import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState, type RefObject } from 'react'
import { Box3, Vector3, type Group } from 'three'

import { decodeBoxes, robotWorkSpots, type WorkSpot } from '@/features/boxes'
import { dashboardAt, playbackStore } from '@/features/playback'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'
import { screenBounds, type ScreenRect } from '@/shared/lib/three/screenBounds'
import { surfaceBelow } from '@/shared/lib/three/surfaceBelow'
import type { PlaybackRun } from '@/shared/types/playback'

import { detailKind } from '../lib/detailKind'
import { robotDetail } from '../lib/robotDetail'
import { ROBOT_STATUS_COLOR } from '../lib/robotStatusColor'
import { vehicleDetail } from '../lib/vehicleDetail'
import type { CalloutLayout } from './RobotCalloutOverlay'
import FadeSpotMarker from './FadeSpotMarker'
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

function colorOf(robotId: string, fade: boolean) {
  const snap = playbackStore.getState()

  const view = dashboardAt(snap)

  if (!snap.run || !view) return null

  const origin = snap.origins[snap.origins.length - 1] ?? 0

  if (fade) {
    const kind = detailKind(robotId)

    if (!kind || kind === 'robot') return null

    return ROBOT_STATUS_COLOR[vehicleDetail(snap.run, snap.time, origin, view.alarms, robotId, kind).status]
  }

  return ROBOT_STATUS_COLOR[robotDetail(snap.run, snap.time, origin, view.alarms, robotId).status]
}

/** 선택 로봇의 작업 지점 (박스 집는 곳) 바닥 마커. 상태 색은 바뀔 때만 다시 그린다 */
export default function RobotMarker3D({ layout }: Props) {
  const { robotId } = useMonitorState()

  const fade = detailKind(robotId) !== null && detailKind(robotId) !== 'robot'

  const scene = useThree((state) => state.scene)

  const group = useRef<Group>(null)

  const surface = useRef<{ key: string; y: number | null }>({ key: '', y: null })

  const spotsRun = useRef<PlaybackRun | null>(null)

  const spots = useRef(new Map<string, WorkSpot>())

  const [color, setColor] = useState<string | null>(() => colorOf(robotId, fade))

  const colorKey = useRef('')

  const viewSeen = useRef<ReturnType<typeof dashboardAt> | undefined>(undefined)

  const idSeen = useRef<string | null>(null)

  useFrame(({ camera, size }) => {
    const snap = playbackStore.getState()

    if (snap.run !== spotsRun.current) {
      spotsRun.current = snap.run

      spots.current = snap.run ? robotWorkSpots(decodeBoxes(snap.run)) : new Map()
    }

    const view = dashboardAt(snap)

    if (view !== viewSeen.current || robotId !== idSeen.current) {
      viewSeen.current = view

      idSeen.current = robotId

      const next = colorOf(robotId, fade)

      const key = `${robotId}:${next ?? ''}`

      if (key !== colorKey.current) {
        colorKey.current = key

        setColor(next)
      }
    }

    const robot = scene.getObjectByName(robotId)

    const workSpot = spots.current.get(robotId)

    if (!robot || !group.current) return

    if (workSpot && !fade) {
      const surfaceKey = `${robotId}:${workSpot.join(',')}`

      if (surface.current.key !== surfaceKey || surface.current.y === null) {
        surface.current = { key: surfaceKey, y: surfaceBelow(scene, workSpot[0], workSpot[1] + 0.05, workSpot[2], group.current) }
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

  if (!color) return null

  return (
    <group ref={group}>
      {fade ? <FadeSpotMarker color={color} /> : <WorkSpotMarker color={color} />}
    </group>
  )
}
