import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { Object3D } from 'three'

import type { PlaybackRun } from '@/shared/types/playback'

import { indexAt } from '../lib/frameAt'
import { sampleJoint, samplePose } from '../lib/samplePose'
import { getExactTime, playbackStore } from '../lib/usePlaybackStore'
import { createJointControl, setJointDegrees, type JointControl } from '../lib/robotJoints'

/**
 * Canvas 안에서 재생 시각의 포즈를 장비 그룹(name = id)에 적용.
 * 한 프레임에 재생 시각은 최대 40ms 만 진행하고, 샘플 사이 위치·관절은 곡선으로 잇는다.
 * 높이는 템플릿 배치 값을 유지한다.
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

      const pose = samplePose(track, t, time)

      if (!object || !pose) continue

      object.position.x = pose.x

      object.position.z = pose.z

      object.rotation.y = pose.yaw
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

      controls.forEach((control, joint) => setJointDegrees(control, sampleJoint(track, index, next, k, joint)))
    }
    // 차량 · 포크 포즈를 박스 · 팔레트보다 먼저 적용해 실린 짐이 한 프레임 늦지 않게 한다
  }, -1)

  return null
}
