import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import { cameraArrival } from '@/features/scene/lib/cameraArrival'
import { sceneReady } from '@/shared/stores/sceneReady'

import { playbackStore } from '../lib/usePlaybackStore'

/** 씬이 그려지고 오프닝 카메라가 main_cam 에 도착한 뒤에만 재생을 시작한다 */
export default function PlaybackStart() {
  const begun = useRef(false)

  useFrame(() => {
    if (begun.current) return

    if (!sceneReady.getState().ready || !cameraArrival.getState().arrived) return

    if (!playbackStore.getState().begin()) return

    begun.current = true
  })

  return null
}
