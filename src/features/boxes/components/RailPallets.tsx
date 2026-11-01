import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group } from 'three'

import { playbackStore } from '@/features/playback'
import PalletModel from '@/features/scene/components/models/PalletModel'
import { PALLET_HEIGHT, PALLET_YAW } from '@/features/scene/constants/modelPlacement'

import { boxPoseAt } from '../lib/boxPoseAt'
import type { DecodedBox } from '../lib/decodeBoxes'

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
function loadsOf(points: Point[]): Load[] {
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

  return clusters.filter((cluster) => cluster.n >= 2).map((cluster) => {
    const members = cluster.members

    const x = cluster.x / cluster.n

    const z = cluster.z / cluster.n

    const minY = Math.min(...members.map((member) => member.y))

    const bottom = members.filter((member) => member.y <= minY + LAYER)

    let forwardX = 0

    let forwardZ = 1

    let pitch = 0

    if (bottom.length >= 2) {
      let low = bottom[0]

      let high = bottom[0]

      for (const member of bottom) {
        if (member.y < low.y) low = member

        if (member.y > high.y) high = member
      }

      const dx = high.x - low.x

      const dz = high.z - low.z

      const span = Math.hypot(dx, dz)

      const rise = high.y - low.y

      if (span > 0.15 && rise > 0.03) {
        forwardX = dx / span

        forwardZ = dz / span

        pitch = Math.atan2(rise, span)
      } else {
        const yaw = Math.atan2(
          bottom.reduce((sum, member) => sum + Math.sin(member.yaw), 0),
          bottom.reduce((sum, member) => sum + Math.cos(member.yaw), 0),
        )

        forwardX = Math.sin(yaw - PALLET_YAW)

        forwardZ = Math.cos(yaw - PALLET_YAW)
      }
    }

    const average = bottom.reduce((sum, member) => sum + member.y, 0) / bottom.length

    let yaw = Math.atan2(forwardX, forwardZ)

    // 팔레트는 180° 돌려도 같아서, 높은 쪽이 바뀌며 한 바퀴 도는 것을 막는다
    if (yaw > Math.PI / 2) {
      yaw -= Math.PI

      pitch = -pitch
    } else if (yaw < -Math.PI / 2) {
      yaw += Math.PI

      pitch = -pitch
    }

    return {
      x,
      y: average - BOX_HEIGHT - PALLET_HEIGHT,
      z,
      yaw,
      pitch,
    }
  })
}

export default function RailPallets({ boxes }: { boxes: DecodedBox[] }) {
  const slots = useRef<Array<Group | null>>([])

  const pose = useMemo(() => [0, 0, 0, 0], [])

  const points = useMemo(() => [] as Point[], [])

  useFrame(() => {
    const time = playbackStore.getExactTime()

    points.length = 0

    for (const box of boxes) {
      if (time < box.start || time >= box.end) continue

      boxPoseAt(box, time, pose)

      points.push({ x: pose[0], y: pose[1], z: pose[2], yaw: pose[3] })
    }

    const loads = loadsOf(points)

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
