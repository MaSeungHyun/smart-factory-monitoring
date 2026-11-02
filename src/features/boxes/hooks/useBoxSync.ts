import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'

import { MODEL_URL } from '@/features/scene/constants/modelUrls'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import type { PlaybackRun } from '@/shared/types/playback'

import { createBoxSync } from '../lib/boxSync'
import type { DecodedBox } from '../lib/decodeBoxes'

/** 박스 부모 해석기 하나를 BoxInstances·RailPallets 가 함께 쓴다 (프레임당 계산 캐시 공유) */
export function useBoxSync(run: PlaybackRun, boxes: DecodedBox[]) {
  const scene = useThree((state) => state.scene)

  // 장면의 팔은 복제본이므로 원본은 휴지 자세 그대로다
  const { scene: arm } = useGLTF(MODEL_URL.robotArm)

  return useMemo(() => createBoxSync(scene, run, boxes, arm), [scene, run, boxes, arm])
}
