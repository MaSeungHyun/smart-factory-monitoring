import { TriangleAlert, Warehouse } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

import { DOCK_RULE, MOCK_DOCK_NOTICE, MOCK_DOCKS } from '../config/warehouse.config'
import MockBadge from './MockBadge'

/** 출고 도크 3칸 + 안내 (재생 데이터에 도크 기록이 없어 목업) */
export default function DockSection() {
  const busy = MOCK_DOCKS.filter((dock) => dock.state === 'busy').length

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-body font-semibold text-text-primary">출고 도크</h3>

        <MockBadge />

        <span className="ml-auto text-[11px] text-text-tertiary">
          {busy} / {MOCK_DOCKS.length} 사용 중
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {MOCK_DOCKS.map((dock) => (
          <div
            key={dock.id}
            className={cn(
              'flex h-[76px] flex-col justify-center gap-0.5 rounded border px-3',
              dock.state === 'busy' ? 'border-primary-on-dark/60 bg-primary-on-dark/8' : 'border-status-success/60 bg-status-success/8',
            )}
          >
            <span className="flex items-center gap-1.5 text-label font-semibold text-text-primary">
              <Warehouse size={14} />
              {dock.name}
            </span>

            <span className={cn('text-caption', dock.state === 'busy' ? 'text-primary-on-dark' : 'text-status-success')}>
              {dock.state === 'busy' ? '사용 중' : '비어 있음'}
            </span>

            <span className="text-[11px] text-text-tertiary">{dock.note}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 rounded border border-status-warning/60 bg-status-warning/8 px-3 py-2.5">
        <TriangleAlert size={16} className="mt-px shrink-0 text-status-warning" />

        <div className="flex flex-col gap-0.5 text-caption text-text-primary">
          {MOCK_DOCK_NOTICE.map((line) => (
            <span key={line}>{line}</span>
          ))}

          <span className="text-[11px] text-text-tertiary">{DOCK_RULE}</span>
        </div>
      </div>
    </div>
  )
}
