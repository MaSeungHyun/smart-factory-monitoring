import { useFrame } from '@react-three/fiber'
import { useRef, useState, type RefObject } from 'react'
import { Box3, Vector3, type Group } from 'three'

import { boxPoseAt, decodeBoxes, type DecodedBox } from '@/features/boxes'
import { WorkSpotMarker, type CalloutLayout } from '@/features/equipment-detail'
import { getExactTime, playbackStore } from '@/features/playback'
import { screenBounds, type ScreenRect } from '@/shared/lib/three/screenBounds'
import { monitorView } from '@/shared/stores/useMonitorViewStore'
import type { PlaybackRun } from '@/shared/types/playback'

import { currentScanBox, scanRecords, type ScanBox, type ScanRecord } from '../lib/scanDetail'
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

interface Cache {
  run: PlaybackRun | null
  scannerId: string
  records: ScanRecord[]
  boxes: DecodedBox[]
}

/** 스캐너 벨트 위 현재 박스에 링 마커 (판정 색). 판정이 바뀔 때만 다시 그린다 */
export default function ScanMarker3D({ layout }: Props) {
  const group = useRef<Group>(null)

  const cache = useRef<Cache>({ run: null, scannerId: '', records: [], boxes: [] })

  const boxRef = useRef<DecodedBox | null>(null)

  const keyRef = useRef('')

  const [current, setCurrent] = useState<ScanBox | null>(null)

  useFrame(({ camera, size }) => {
    if (!group.current) return

    const snap = playbackStore.getState()

    const scannerId = monitorView.getState().scannerId

    if (snap.run !== cache.current.run || scannerId !== cache.current.scannerId) {
      cache.current = {
        run: snap.run,
        scannerId,
        records: snap.run ? scanRecords(snap.run, scannerId) : [],
        boxes: snap.run ? decodeBoxes(snap.run) : [],
      }

      keyRef.current = ''
    }

    const next = currentScanBox(cache.current.records, getExactTime())

    const key = next ? `${next.boxId}:${next.verdict}` : ''

    if (key !== keyRef.current) {
      keyRef.current = key

      boxRef.current = next ? (cache.current.boxes.find((entry) => entry.id === next.boxId) ?? null) : null

      setCurrent(next)
    }

    const box = boxRef.current

    if (!box) {
      group.current.visible = false

      layout.current?.update(null)

      return
    }

    boxPoseAt(box, getExactTime(), pose)

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
