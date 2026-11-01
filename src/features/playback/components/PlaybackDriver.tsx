import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { Object3D } from 'three'

import type { PlaybackRun } from '@/shared/types/playback'

import { indexAt } from '../lib/frameAt'
import { lerp, lerpAngle } from '../lib/interpolate'
import { getExactTime, playbackStore } from '../lib/usePlaybackStore'
import { createJointControl, setJointDegrees, type JointControl } from '../lib/robotJoints'

/**
 * Canvas 안에서 매 프레임 재생 시각의 포즈를 장비 그룹(name = id)에 적용.
 * 위치 x/z · yaw 는 10Hz 샘플을 선형 보간, 높이는 템플릿 배치 값을 유지.
 * 재생 시각은 getState() 로만 읽어 시계 틱이 이 컴포넌트를 다시 그리지 않는다.
 */
export default function PlaybackDriver() {
  const scene = useThree((state) => state.scene)

  const objects = useRef(new Map<string, Object3D | null>())

  const joints = useRef(new Map<string, JointControl[] | null>())

  const names = useRef<string[]>([])

  const runSeen = useRef<PlaybackRun | null>(null)

  const applied = useRef(Number.NaN)

  useFrame(() => {
    const run = playbackStore.getState().run

    if (!run) return

    if (run !== runSeen.current) {
      runSeen.current = run

      names.current = run.meta.jointNames

      objects.current.clear()

      joints.current.clear()
    }

    const time = getExactTime()

    if (applied.current === time) return

    applied.current = time

    const { t, poses, joints: tracks } = run.tracks

    const index = indexAt(t, time)

    const next = Math.min(index + 1, t.length - 1)

    const span = t[next] - t[index]

    const k = span > 0 ? Math.min(Math.max((time - t[index]) / span, 0), 1) : 0

    const find = (id: string) => {
      if (!objects.current.has(id)) objects.current.set(id, scene.getObjectByName(id) ?? null)

      return objects.current.get(id) ?? null
    }

    for (const [id, track] of Object.entries(poses)) {
      const object = find(id)

      const a = track[index]

      const b = track[next] ?? a

      if (!object || !a || !b) continue

      object.position.x = lerp(a[0], b[0], k)

      object.position.z = lerp(a[2], b[2], k)

      object.rotation.y = lerpAngle(a[3], b[3], k)
    }

    for (const [id, track] of Object.entries(tracks)) {
      if (!joints.current.has(id)) {
        const root = find(id)

        const controls = root
          ? names.current.map((name) => root.getObjectByName(name)).filter((node): node is Object3D => !!node).map(createJointControl)
          : []

        joints.current.set(id, controls.length === names.current.length ? controls : null)
      }

      const controls = joints.current.get(id)

      const a = track[index]

      const b = track[next] ?? a

      if (!controls || !a || !b) continue

      controls.forEach((control, joint) => setJointDegrees(control, lerp(a[joint], b[joint], k)))
    }
  })

  return null
}
