import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Vector3, type Group } from 'three'

import { dashboardAt, playbackStore } from '@/features/playback'
import InfoCard from '@/shared/components/InfoCard'
import StatusBadge from '@/shared/components/StatusBadge'
import { LEADER_OVERLAP, LEADER_RISE, LEADER_RUN } from '@/shared/lib/leaderLine'
import type { EquipmentItem } from '@/shared/types'

import { equipmentById, equipmentTop } from '../lib/boundsRaycast'

const anchor = new Vector3()

const PERCENT_LABEL: Record<EquipmentItem['type'], string> = {
  robot: '가동률',
  amr: '배터리',
  scanner: '처리율',
}

function itemKey(id: string, item: EquipmentItem | null) {
  if (!item) return id

  return `${id}|${item.name}|${item.status}|${item.statusLabel}|${item.process}|${item.metricLeft}|${item.metricRight}|${item.percent}|${item.type}`
}

function itemOf(id: string) {
  return dashboardAt(playbackStore.getState())?.equipment.find((entry) => entry.id === id) ?? null
}

/** 클릭으로 고정되는 콜아웃. 호버 칩(이름·공정·상태)보다 작업량·비율을 더 보여 준다. 내용이 바뀔 때만 다시 그린다 */
export default function SelectionCallout3D({ id }: { id: string }) {
  const group = useRef<Group>(null)

  const [item, setItem] = useState<EquipmentItem | null>(() => itemOf(id))

  const sig = useRef(itemKey(id, item))

  useFrame(() => {
    const next = itemOf(id)

    const key = itemKey(id, next)

    if (key !== sig.current) {
      sig.current = key

      setItem(next)
    }

    const target = equipmentById(id)

    if (!target || !group.current || !equipmentTop(target, anchor, 0)) return

    group.current.position.copy(anchor)
  })

  return (
    <group ref={group}>
      <Html zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
        {/* ㄱ자 리더선: 점에서 위로 LEADER_RISE, 오른쪽으로 LEADER_RUN 꺾인 뒤 카드 옆면 세로 가운데에 붙는다 (상세 · 스캔 콜아웃과 같은 길이) */}
        <div data-viewport-annotation="hide" className="relative">
          <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={1} height={1}>
            <polyline
              points={`0,0 0,${-LEADER_RISE} ${LEADER_RUN + LEADER_OVERLAP},${-LEADER_RISE}`}
              fill="none"
              stroke="var(--color-primary-on-dark)"
              strokeWidth={1.5}
            />

            <circle r={4} fill="var(--color-primary-on-dark)" />
          </svg>

          <div className="absolute -translate-y-1/2" style={{ left: LEADER_RUN, top: -LEADER_RISE }}>
            <InfoCard className="w-max">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item?.name ?? id}</span>

                {item && (
                  <span className="ml-auto">
                    <StatusBadge tone={item.status} label={item.statusLabel} />
                  </span>
                )}
              </div>

              {item && <p className="mt-0.5 text-text-tertiary">{item.process}</p>}

              {item && (
                <dl className="mt-1.5 flex flex-col gap-1 border-t border-border-default pt-1.5">
                  <div className="flex gap-3">
                    <dt className="min-w-0 truncate text-text-tertiary">{item.metricLeft}</dt>

                    <dd className="ml-auto shrink-0 font-semibold tabular-nums">{item.metricRight}</dd>
                  </div>

                  <div className="flex gap-3">
                    <dt className="text-text-tertiary">{PERCENT_LABEL[item.type]}</dt>

                    <dd className="ml-auto font-semibold tabular-nums">{item.percent}%</dd>
                  </div>
                </dl>
              )}
            </InfoCard>
          </div>
        </div>
      </Html>
    </group>
  )
}
