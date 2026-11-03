import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3, type Group } from 'three'

import { getExactTime } from '@/features/playback'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

import { boxPoseAt } from '../lib/boxPoseAt'
import type { DecodedBox } from '../lib/decodeBoxes'

const pose = [0, 0, 0, 0]

const anchor = new Vector3()

/** 박스 윗면보다 조금 위. 원점은 윗면 중앙이다 */
const LIFT = 0.08

function DefectMark({ box }: { box: DecodedBox }) {
  const group = useRef<Group>(null)

  const root = useRef<HTMLDivElement>(null)

  useFrame(() => {
    const node = group.current

    if (!node) return

    const time = getExactTime()

    const visible = time >= box.start && time >= box.defectAt && time < box.end

    node.visible = visible

    if (root.current) root.current.style.display = visible ? 'flex' : 'none'

    if (!visible) return

    boxPoseAt(box, time, pose)

    anchor.set(pose[0], pose[1] + LIFT, pose[2])

    node.position.copy(anchor)
  })

  const text = box.defectReason ? `${box.id} · ${box.defectReason}` : `${box.id} · 불량`

  return (
    <group ref={group}>
      <Html zIndexRange={[5, 0]} style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}>
        <div
          ref={root}
          data-viewport-annotation="hide"
          style={{ display: 'none' }}
          className="flex flex-col items-center whitespace-nowrap"
        >
          <span className={cn('rounded border bg-bg-surface/90 px-2 py-1 text-caption text-text-primary', TONE_BORDER.error)}>
            <span className={TONE_TEXT.error}>● </span>
            {text}
          </span>

          <span className="h-6 w-px bg-border-default" />

          <span className={cn('size-2 rounded-full', TONE_BG.error)} />
        </div>
      </Html>
    </group>
  )
}

/** 스캐너가 불량으로 판정한 박스에만 사유를 붙인다 */
export default function BoxDefectMarks({ boxes }: { boxes: DecodedBox[] }) {

  const marked = boxes.filter((box) => Number.isFinite(box.defectAt))

  if (marked.length === 0) return null

  return (
    <>
      {marked.map((box) => (
        <DefectMark key={box.id} box={box} />
      ))}
    </>
  )
}
