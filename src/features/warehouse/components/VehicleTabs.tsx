import { cn } from '@/shared/lib/cn'

export type VehicleFilter = 'all' | 'vehicle' | 'forkRack'

interface Props {
  value: VehicleFilter
  counts: Record<VehicleFilter, number>
  onChange: (value: VehicleFilter) => void
}

const TABS: Array<{ id: VehicleFilter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'vehicle', label: 'AMR · AGV' },
  { id: 'forkRack', label: '지게차 · 랙' },
]

export default function VehicleTabs({ value, counts, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-0.5 rounded border border-border-default p-0.5">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'h-9 rounded text-label',
            id === value ? 'bg-primary-fill font-semibold text-text-primary' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {label} {counts[id]}
        </button>
      ))}
    </div>
  )
}
