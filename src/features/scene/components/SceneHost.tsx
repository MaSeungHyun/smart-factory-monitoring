import { useLayoutEffect, useRef, type ReactNode } from 'react'

import { sceneHost } from '../lib/sceneHost'
import FactoryScene from './FactoryScene'

/**
 * 앱 수명 동안 한 번만 마운트되는 Canvas + FactoryScene.
 * 화면 전환 시 언마운트되지 않고 SceneSlot 으로 DOM 만 이동, 카메라는 GlbCameraRig 가 목표 시점으로 비행.
 * children: 화면별 3D 오버레이 (Canvas 안)
 */
export default function SceneHost({ children }: { children?: ReactNode }) {
  const park = useRef<HTMLDivElement>(null)

  const host = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    sceneHost.register(host.current, park.current)

    return () => sceneHost.register(null, null)
  }, [])

  return (
    <div ref={park} aria-hidden className="pointer-events-none fixed top-0 left-0 size-px overflow-hidden opacity-0">
      <div ref={host} className="pointer-events-auto absolute inset-0">
        <FactoryScene>{children}</FactoryScene>
      </div>
    </div>
  )
}
