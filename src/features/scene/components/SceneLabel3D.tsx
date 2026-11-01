import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3, type Group } from 'three'

import { TONE_BG, TONE_BORDER, TONE_TEXT } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'
import { worldTopCenter } from '@/shared/lib/three/worldAnchor'

import type { FaultLabel } from '../lib/faultTargets'

const anchor = new Vector3()

/** 장비(name = id) 월드 바운딩 박스 윗면 중앙에 점(핀 끝)이 오도록 붙어 따라다니는 라벨 */
export default function SceneLabel3D({ label }: { label: FaultLabel }) {
  const group = useRef<Group>(null)

  const scene = useThree((state) => state.scene)

  useFrame(() => {
    const target = scene.getObjectByName(label.id)

    if (!target || !group.current) return

    worldTopCenter(target, anchor, 0.3)

    group.current.position.copy(anchor)
  })

  return (
    <group ref={group}>
      <Html zIndexRange={[5, 0]} style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}>
        <div className="flex flex-col items-center whitespace-nowrap">
          <span className={cn('rounded border bg-bg-surface/90 px-2 py-1 text-caption text-text-primary', TONE_BORDER[label.status])}>
            <span className={TONE_TEXT[label.status]}>● </span>
            {label.text}
          </span>

          <span className="h-6 w-px bg-border-default" />

          <span className={cn('size-2 rounded-full', TONE_BG[label.status])} />
        </div>
      </Html>
    </group>
  )
}
