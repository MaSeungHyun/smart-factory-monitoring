import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { WebGLRenderer } from 'three'

import { installShadowThrottle } from '@/shared/lib/three/shadowThrottle'
import { useGraphics } from '@/shared/stores/useGraphicsStore'

/** 그림자 맵은 그림자를 드리우는 물체가 움직인 프레임에만 다시 그린다 (WebGL). WebGPU 는 기존대로 매 프레임 */
export default function ShadowUpdateGate() {
  const gl = useThree((state) => state.gl)

  const scene = useThree((state) => state.scene)

  const shadow = useGraphics().shadow

  useEffect(() => {
    if (!(gl instanceof WebGLRenderer) || shadow === 'off') return

    return installShadowThrottle(gl, scene)
  }, [gl, scene, shadow])

  return null
}
