import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { Box3, Vector3, type Group } from 'three'

import { boxPoseAt, decodeBoxes } from '@/features/boxes'
import { WorkSpotMarker, type CalloutLayout } from '@/features/equipment-detail'
import { playbackStore, usePlayback } from '@/features/playback'
import { screenBounds, type ScreenRect } from '@/shared/lib/three/screenBounds'

import { useScanDetail } from '../hooks/useScanDetail'
import { VERDICT_COLOR } from '../lib/scanTone'

/** 박스 윗면 위로 살짝 띄움 */
const LIFT = 0.02

const pose = [0, 0, 0, 0]

const spot = new Vector3()

const anchor = new Vector3()

const markerBox = new Box3()

const rect: ScreenRect = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

interface Props {
  layout: RefObject<CalloutLayout | null>
}

/** 스캐너 벨트 위 현재 박스에 링 마커 (판정 색) + 마커를 가리지 않는 콜아웃 위치 계산 */
export default function ScanMarker3D({ layout }: Props) {
  const { run } = usePlayback()

  const detail = useScanDetail()

  const boxes = useMemo(() => (run ? decodeBoxes(run) : []), [run])

  const current = detail?.current ?? null

  const box = useMemo(() => boxes.find((entry) => entry.id === current?.boxId) ?? null, [boxes, current?.boxId])

  const group = useRef<Group>(null)

  useFrame(({ camera, size }) => {
    if (!group.current) return

    if (!box) {
      group.current.visible = false

      layout.current?.update(null)

      return
    }

    boxPoseAt(box, playbackStore.getExactTime(), pose)

    spot.set(pose[0], pose[1] + LIFT, pose[2])

    group.current.visible = true

    group.current.position.copy(spot)

    markerBox.setFromObject(group.current)

    const bounds = markerBox.isEmpty() ? null : screenBounds(group.current, camera, size.width, size.height, rect)

    anchor.copy(spot).project(camera)

    const visible = anchor.z <= 1 && Math.abs(anchor.x) <= 1 && Math.abs(anchor.y) <= 1

    layout.current?.update(bounds ? { rect: bounds, anchor: visible ? [((anchor.x + 1) / 2) * size.width, ((1 - anchor.y) / 2) * size.height] : null, size: [size.width, size.height] } : null)
  })

  return (
    <group ref={group} visible={false}>
      {current && <WorkSpotMarker color={VERDICT_COLOR[current.verdict]} />}
    </group>
  )
}
