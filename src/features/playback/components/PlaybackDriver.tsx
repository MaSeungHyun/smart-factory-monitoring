import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Object3D } from 'three'

import { usePlayback } from '../hooks/usePlayback'
import { indexAt } from '../lib/frameAt'
import { lerp, lerpAngle } from '../lib/interpolate'
import { playbackStore } from '../lib/playbackStore'
import { createJointControl, setJointDegrees, type JointControl } from '../lib/robotJoints'

/**
 * Canvas 안에서 매 프레임 재생 시각의 포즈를 장비 그룹(name = id)에 적용.
 * 위치 x/z · yaw 는 10Hz 샘플을 선형 보간, 높이는 템플릿 배치 값을 유지.
 */
export default function PlaybackDriver() {
  const { run } = usePlayback()

  const scene = useThree((state) => state.scene)

  const objects = useRef(new Map<string, Object3D | null>())

  const joints = useRef(new Map<string, JointControl[] | null>())

  const names = useMemo(() => run?.meta.jointNames ?? [], [run])

  useFrame(() => {
    if (!run) return

    const { t, poses, joints: tracks } = run.tracks

    const time = playbackStore.getExactTime()

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
          ? names.map((name) => root.getObjectByName(name)).filter((node): node is Object3D => !!node).map(createJointControl)
          : []

        joints.current.set(id, controls.length === names.length ? controls : null)
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
