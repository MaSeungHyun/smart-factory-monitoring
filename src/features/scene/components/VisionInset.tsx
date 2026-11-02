import { addAfterEffect, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { WebGLRenderer } from 'three'

import { drawVision } from '../lib/visionFrame'

/** 메인 화면을 그린 뒤, 비전 인셋 영역에만 작업 구역 카메라를 다시 그린다 */
export default function VisionInset() {
  const gl = useThree((state) => state.gl)

  const scene = useThree((state) => state.scene)

  useEffect(() => addAfterEffect(() => drawVision(gl as WebGLRenderer, scene)), [gl, scene])

  return null
}
