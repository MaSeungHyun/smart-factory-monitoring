import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { WebGLRenderer } from 'three'

import { installShadowThrottle } from '@/shared/lib/three/shadowThrottle'
import { useGraphics } from '@/shared/stores/useGraphicsStore'

/**
 * 그림자 맵 갱신 게이트.
 * WebGL: 움직이는 그림자는 움직인 프레임에만, 고정 그림자는 정적 모델이 바뀔 때만 다시 그린다.
 * WebGPU: 움직이는 그림자는 기존대로 매 프레임, 고정 그림자 조명만 필요할 때 다시 그린다
 */
export default function ShadowUpdateGate() {
  const gl = useThree((state) => state.gl)

  const scene = useThree((state) => state.scene)

  const shadow = useGraphics().shadow

  useEffect(() => {
    if (shadow === 'off' || !gl.shadowMap) return

    return installShadowThrottle(gl, scene, gl instanceof WebGLRenderer)
  }, [gl, scene, shadow])

  return null
}