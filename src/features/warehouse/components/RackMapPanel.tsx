import { Boxes } from 'lucide-react'

import { useUi } from '@/shared/stores/useUiStore'
import { cn } from '@/shared/lib/cn'

import { RACK_SLOTS } from '../config/rackSlots.config'
import type { RackActivity } from '../lib/rackTimeline'
import type { RackCell, RackSummary } from '../lib/rackMap'
import RackCellButton from './RackCellButton'

interface Props {
  grid: RackCell[][]
  /** 셀 id → 지금 그 칸으로 가는 장비 코드 (재생 데이터) */
  loading: Map<string, string>
  /** 전체 적재 (재생 데이터, 없으면 null) */
  summary: RackSummary | null
  /** 최근 입고·출고 (최신순) */
  recent: (RackActivity & { rackName: string })[]
}

const COLUMNS = [1, 2, 3, 4, 5, 6, 7]

const BAYS = 'grid-cols-[18px_repeat(7,minmax(0,1fr))] gap-x-1'

const WIDE_BAYS = 'grid-cols-[18px_repeat(9,minmax(0,1fr))] gap-x-[3px]'

const SCALE = [
  { swatch: 'bg-primary-on-dark', label: '0~30%' },
  { swatch: 'bg-primary-fill', label: '30~60%' },
  { swatch: 'bg-primary-fill', label: '60~90%' },
  { swatch: 'bg-status-warning', label: '90%+ 가득' },
]

/** 재생 초 → m:ss */
function clock(t: number) {
  const seconds = Math.max(0, Math.floor(t))

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** 슬롯 인덱스 → "4단 R" */
function slotName(slot: number) {
  const { level, column } = RACK_SLOTS[slot]

  return `${level}단 ${column}`
}

/** L·R 프롭 랙 (목업). 높이는 10px. R 은 같은 폭을 9칸으로 나눔 */
function LaneRow({ label, count, hotIndex }: { label: string; count: number; hotIndex?: number }) {
  return (
    <div className={cn('grid items-center', count === 9 ? WIDE_BAYS : BAYS)}>
      <span className="text-center text-[9px] font-semibold text-text-tertiary">{label}</span>

      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          title={`${label} · 프롭 랙`}
          className={cn('h-2.5 rounded-sm', index === hotIndex ? 'bg-status-warning' : 'bg-primary-fill')}
        />
      ))}
    </div>
  )
}

/** 랙 적재 현황. 위 L1·L2(10px), 가운데 A~D(20px, 재생 데이터), 아래 R1·R2(10px, 9칸) */
export default function RackMapPanel({ grid, loading, summary, recent }: Props) {
  const { selectedId } = useUi()

  return (
    <div className="pointer-events-auto flex w-84 flex-col gap-2 rounded border border-border-default bg-bg-surface/95 p-3">
      <div className="flex items-center gap-2">
        <Boxes size={14} className="text-text-secondary" />

        <h3 className="text-label font-semibold text-text-primary">랙 적재 현황</h3>

        <span className="ml-auto text-caption text-text-secondary tabular-nums">
          {summary ? `${summary.used}/${summary.capacity} · ${summary.percent}% · 가득 ${summary.full}칸` : '—'}
        </span>
      </div>

      <div className="flex flex-col gap-[3px]">
        <LaneRow label="L1" count={7} />

        <LaneRow label="L2" count={7} hotIndex={6} />
      </div>

      <div className={cn('grid', BAYS)}>
        <span />

        {COLUMNS.map((column) => (
          <span key={column} className="text-center text-[10px] text-text-tertiary tabular-nums">
            {column}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {grid.map((row) => (
          <div key={row[0]?.id ?? 'row'} className={cn('grid', row.length > COLUMNS.length ? WIDE_BAYS : BAYS)}>
            <span className="flex items-center justify-center text-[11px] font-semibold text-text-secondary">
              {row[0]?.name.split('-')[0]}
            </span>

            {row.map((cell) => {
              const busy = loading.get(cell.id)

              return <RackCellButton key={cell.id} cell={cell} busy={busy} selected={selectedId === cell.id} />
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[3px]">
        <LaneRow label="R1" count={9} />

        <LaneRow label="R2" count={9} hotIndex={5} />
      </div>

      {recent.length > 0 && (
        <div className="flex flex-col gap-0.5 border-t border-border-default pt-1.5 text-[10px] text-text-secondary tabular-nums">
          {recent.map((change) => (
            <span key={`${change.t}-${change.palletId}`} className="flex gap-2">
              <span className="text-text-tertiary">{clock(change.t)}</span>

              <span className={change.kind === 'store' ? 'text-primary-on-dark' : 'text-status-warning'}>
                {change.kind === 'store' ? '입고' : '출고'}
              </span>

              <span>
                {change.rackName} {slotName(change.slot)} · {change.palletId}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-text-tertiary">
        <div className="flex items-center gap-2">
          {SCALE.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <span className={cn('size-2 rounded-sm', item.swatch)} />

              {item.label}
            </span>
          ))}
        </div>

        <span>L·R 프롭 랙</span>
      </div>
    </div>
  )
}
