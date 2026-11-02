import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group } from 'three'

import { getExactTime } from '@/features/playback'
import PalletModel from '@/features/scene/components/models/PalletModel'
import { PALLET_HEIGHT } from '@/features/scene/constants/modelPlacement'

import { boxOwnerAt, boxPoseAt } from '../lib/boxPoseAt'
import { holdBoxesOnPallet, nearestAmrYaw } from '../lib/carryYaw'
import type { DecodedBox } from '../lib/decodeBoxes'
import { createGripSync } from '../lib/gripSync'

/** 박스 원점은 윗면 */
const BOX_HEIGHT = 0.36

/** 한 팔레트로 볼 수평 거리 (슬롯 간격 0.5m, 이웃 팔레트와는 약 1.3m) */
const REACH = 0.6

/** 팔레트 한 층으로 볼 높이 차 */
const LAYER = 0.2

const CAPACITY = 32

interface Point {
  x: number
  y: number
  z: number
  yaw: number
  /** 로봇 셀에 혼자 남아도 팔레트를 유지 */
  keep: boolean
}

interface Load {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
}

/**
 * 같이 움직이는 박스 더미 아래의 팔레트.
 * robot-IK 는 팔레트와 박스를 한 그룹으로 옮겨 condition_rail 경사(pitch)를 타고
 * Transfer_Forklift 포크까지 싣는다. 재생 기록에는 박스 위치만 있으므로
 * 더미의 바닥 기울기로 그 그룹을 복원한다. 레일 안에서만 만들면 AMR 위에는 없고
 * 리프트에 올라가면 사라진다.
 */
function loadsOf(points: Point[], time: number): Load[] {
  const clusters: Array<{ x: number; z: number; n: number; members: Point[] }> = []

  for (const point of points) {
    let best: (typeof clusters)[number] | null = null

    let bestD = REACH

    for (const cluster of clusters) {
      const distance = Math.hypot(point.x - cluster.x / cluster.n, point.z - cluster.z / cluster.n)

      if (distance < bestD) {
        best = cluster

        bestD = distance
      }
    }

    if (best && best.n < 8) {
      best.x += point.x

      best.z += point.z

      best.n += 1

      best.members.push(point)
    } else {
      clusters.push({ x: point.x, z: point.z, n: 1, members: [point] })
    }
  }

  return clusters.filter((cluster) => cluster.n >= 2 || cluster.members[0]?.keep).map((cluster) => {
    const members = cluster.members

    const x = cluster.x / cluster.n

    const z = cluster.z / cluster.n

    const minY = Math.min(...members.map((member) => member.y))

    const bottom = members.filter((member) => member.y <= minY + LAYER)

    // 팔레트는 입하·레일의 90°를 따르지 않는다. AMR에 실린 뒤에만 그 AMR yaw를 따른다.
    let pitch = 0

    if (bottom.length >= 2) {
      let low = bottom[0]

      let high = bottom[0]

      for (const member of bottom) {
        if (member.y < low.y) low = member

        if (member.y > high.y) high = member
      }

      const dz = high.z - low.z

      const span = Math.abs(dz)

      const rise = high.y - low.y

      if (span > 0.15 && rise > 0.03) pitch = Math.atan2(rise, span) * Math.sign(dz)
    }

    const average = bottom.reduce((sum, member) => sum + member.y, 0) / bottom.length

    return {
      x,
      y: average - BOX_HEIGHT - PALLET_HEIGHT,
      z,
      yaw: nearestAmrYaw(x, z, time) ?? 0,
      pitch,
    }
  })
}

/** 내려놓은 직후 컨베이어 위 박스는 팔레트로 보지 않는다 */
const PLACED = 6

function keepsPallet(box: DecodedBox, time: number) {
  if (boxOwnerAt(box, time) !== 'robot') return false

  return !box.grips.some((grip) => !grip.synthetic && time >= grip.end && time < grip.end + PLACED)
}

export default function RailPallets({ boxes }: { boxes: DecodedBox[] }) {
  const slots = useRef<Array<Group | null>>([])

  const applied = useRef(Number.NaN)

  const pose = useMemo(() => [0, 0, 0, 0], [])

  const points = useMemo(() => [] as Point[], [])

  const world = useThree((state) => state.scene)

  const gripSync = useMemo(() => createGripSync(world), [world])

  useFrame(() => {
    const time = getExactTime()

    if (applied.current === time) return

    applied.current = time

    points.length = 0

    for (const box of boxes) {
      if (time < box.start || time >= box.end) continue

      boxPoseAt(box, time, pose)

      const mode = gripSync.place(box, time, pose)

      if (mode === 'attach' || mode === 'omit') continue

      points.push({ x: pose[0], y: pose[1], z: pose[2], yaw: pose[3], keep: keepsPallet(box, time) })
    }

    holdBoxesOnPallet(points, points.length, time)

    const loads = loadsOf(points, time)

    slots.current.forEach((slot, index) => {
      if (!slot) return

      const load = loads[index]

      if (!load) {
        slot.visible = false

        return
      }

      slot.visible = true

      slot.position.set(load.x, load.y, load.z)

      slot.rotation.order = 'YXZ'

      slot.rotation.set(-load.pitch, load.yaw, 0)
    })
  })

  return (
    <>
      {Array.from({ length: CAPACITY }, (_, index) => (
        <group key={index} name="cargo-pallet" ref={(node) => { slots.current[index] = node }} visible={false}>
          <PalletModel />
        </group>
      ))}
    </>
  )
}
