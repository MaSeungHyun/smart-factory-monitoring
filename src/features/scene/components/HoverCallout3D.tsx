import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3, type Group } from 'three'

import { dashboardAt } from '@/features/playback/hooks/useDashboardView'
import { playbackStore } from '@/features/playback/lib/usePlaybackStore'
import { TONE_BG, TONE_TEXT, TONE_TINT } from '@/shared/constants/status'
import { getHover, uiStore } from '@/shared/stores/useUiStore'

import { equipmentById, equipmentTop } from '../lib/boundsRaycast'

const anchor = new Vector3()

function writeChip(
  active: string,
  nameEl: HTMLSpanElement | null,
  processEl: HTMLSpanElement | null,
  badgeEl: HTMLSpanElement | null,
  dotEl: HTMLSpanElement | null,
  labelEl: HTMLSpanElement | null,
) {
  const snap = playbackStore.getState()

  const item = dashboardAt(snap)?.equipment.find((entry) => entry.id === active) ?? null

  if (nameEl) nameEl.textContent = item?.name ?? active

  if (processEl) {
    processEl.textContent = item?.process ?? ''

    processEl.style.display = item ? '' : 'none'
  }

  if (!badgeEl || !dotEl || !labelEl) return

  badgeEl.style.display = item ? '' : 'none'

  if (!item) return

  badgeEl.className = `inline-flex h-6 items-center gap-1 rounded px-2 text-caption font-semibold whitespace-nowrap ${TONE_TINT[item.status]} ${TONE_TEXT[item.status]}`

  dotEl.className = `size-1.5 rounded-full ${TONE_BG[item.status]}`

  labelEl.textContent = item.statusLabel
}

/** 호버 콜아웃. 상태 구독 없이 프레임에서 ref 로 위치와 문구만 바꾼다 */
export default function HoverCallout3D() {
  const group = useRef<Group>(null)

  const root = useRef<HTMLDivElement>(null)

  const nameEl = useRef<HTMLSpanElement>(null)

  const processEl = useRef<HTMLSpanElement>(null)

  const badgeEl = useRef<HTMLSpanElement>(null)

  const dotEl = useRef<HTMLSpanElement>(null)

  const labelEl = useRef<HTMLSpanElement>(null)

  const shown = useRef('')

  const display = useRef('none')

  useFrame(() => {
    const id = getHover()

    const active = id && id !== uiStore.getState().selectedId ? id : null

    const target = active ? equipmentById(active) : null

    const visible = Boolean(target?.visible && group.current && root.current)

    const nextDisplay = visible ? '' : 'none'

    if (root.current && display.current !== nextDisplay) {
      display.current = nextDisplay

      root.current.style.display = nextDisplay
    }

    if (!visible || !active || !target || !group.current) {
      shown.current = ''

      return
    }

    if (shown.current !== active) {
      shown.current = active

      writeChip(active, nameEl.current, processEl.current, badgeEl.current, dotEl.current, labelEl.current)
    }

    if (!equipmentTop(target, anchor, 0.4)) return

    group.current.position.copy(anchor)
  })

  return (
    <group ref={group}>
      <Html zIndexRange={[6, 0]} style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}>
        <div ref={root} className="flex flex-col items-center whitespace-nowrap" style={{ display: 'none' }}>
          <div className="flex items-center gap-2 rounded border border-primary-on-dark bg-bg-surface/95 px-2.5 py-1.5 text-caption text-text-primary shadow-lg">
            <span ref={nameEl} className="font-semibold" />

            <span ref={processEl} className="text-text-tertiary" />

            <span ref={badgeEl} className="inline-flex h-6 items-center gap-1 rounded px-2 text-caption font-semibold whitespace-nowrap">
              <span ref={dotEl} className="size-1.5 rounded-full" />

              <span ref={labelEl} />
            </span>
          </div>

          <span className="h-7 w-px bg-primary-on-dark" />

          <span className="size-2 rounded-full bg-primary-on-dark" />
        </div>
      </Html>
    </group>
  )
}
