import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3, type Group } from 'three'

import { useDashboardView } from '@/features/playback'
import StatusBadge from '@/shared/components/StatusBadge'
import { worldTopCenter } from '@/shared/lib/three/worldAnchor'

const anchor = new Vector3()

/** 메인 관제: 선택 장비 위 콜아웃 (이름 · 공정 · 상태) */
export default function SelectionCallout3D({ id }: { id: string }) {
  const group = useRef<Group>(null)

  const scene = useThree((state) => state.scene)

  const view = useDashboardView()

  const item = view?.equipment.find((entry) => entry.id === id)

  useFrame(() => {
    const target = scene.getObjectByName(id)

    if (!target || !group.current) return

    worldTopCenter(target, anchor, 0.4)

    group.current.position.copy(anchor)
  })

  return (
    <group ref={group}>
      <Html zIndexRange={[6, 0]} style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}>
        <div className="flex flex-col items-center whitespace-nowrap">
          <div className="flex items-center gap-2 rounded border border-primary-on-dark bg-bg-surface/95 px-2.5 py-1.5 text-caption text-text-primary shadow-lg">
            <span className="font-semibold">{item?.name ?? id}</span>

            {item && <span className="text-text-tertiary">{item.process}</span>}

            {item && <StatusBadge tone={item.status} label={item.statusLabel} />}
          </div>

          <span className="h-7 w-px bg-primary-on-dark" />

          <span className="size-2 rounded-full bg-primary-on-dark" />
        </div>
      </Html>
    </group>
  )
}
