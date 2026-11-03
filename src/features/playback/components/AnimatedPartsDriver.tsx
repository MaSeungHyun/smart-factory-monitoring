import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'

import { bindPart, samplePart, type PartBinding } from '@/shared/lib/animatedParts'
import type { AnimatedPartTrack } from '@/shared/types/animatedParts'
import type { PlaybackRun } from '@/shared/types/playback'

import { getExactTime, playbackStore } from '../lib/usePlaybackStore'

/**
 * run.parts (robot_IK animatedParts) 를 장비 그룹(name = deviceId) 안 GLB 노드에 적용.
 * 장비 종류를 모르므로 새 장비도 노드 이름만 맞으면 움직인다. 리렌더 없이 프레임에서만 적용.
 * 로봇 관절은 PlaybackDriver 가 tracks.joints 로 이미 돌리므로 여기서 건너뛴다.
 */

/** 장비 마운트를 기다리는 프레임 수 */
const MAX_BIND_RETRIES = 300

interface BoundTrack {
  track: AnimatedPartTrack
  binding: PartBinding | null
}

/** tracks.joints 가 있는 장비의 관절 노드는 PlaybackDriver 몫 */
function ownedByJoints(run: PlaybackRun, track: AnimatedPartTrack) {
  return !!run.tracks.joints[track.part.deviceId] && run.meta.jointNames.includes(track.part.partName)
}

export default function AnimatedPartsDriver() {
  const scene = useThree((state) => state.scene)

  const runSeen = useRef<PlaybackRun | null>(null)

  const bound = useRef<BoundTrack[]>([])

  /** 장비가 아직 씬에 없으면 다음 프레임에 다시 찾는다 */
  const pending = useRef<AnimatedPartTrack[]>([])

  const retries = useRef(0)

  const applied = useRef(Number.NaN)

  useFrame(() => {
    const run = playbackStore.getState().run

    if (!run?.parts) return

    if (run !== runSeen.current) {
      runSeen.current = run

      bound.current = []

      pending.current = run.parts.filter((track) => !ownedByJoints(run, track))

      retries.current = 0

      applied.current = Number.NaN
    }

    if (pending.current.length) {
      const waiting: AnimatedPartTrack[] = []

      for (const track of pending.current) {
        const root = scene.getObjectByName(track.part.deviceId)

        if (!root) waiting.push(track)
        else bound.current.push({ track, binding: bindPart(root, track.part) })
      }

      // 씬에 없는 장비 (예: scanbelt:scanner-16) 는 잠깐 기다린 뒤 포기한다
      retries.current += 1

      pending.current = retries.current < MAX_BIND_RETRIES ? waiting : []

      applied.current = Number.NaN
    }

    const time = getExactTime()

    if (applied.current === time) return

    applied.current = time

    for (const { track, binding } of bound.current) {
      if (!binding) continue

      const value = samplePart(track, time)

      if (value === null) continue

      binding.handler.apply(binding.node, value, track.part, binding.root)
    }
    // 차량 · 포크 포즈를 박스 · 팔레트보다 먼저 적용해 실린 짐이 한 프레임 늦지 않게 한다
  }, -1)

  return null
}