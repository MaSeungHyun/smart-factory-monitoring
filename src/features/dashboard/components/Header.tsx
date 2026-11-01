import { Clock } from 'lucide-react'

import { useNow } from '@/shared/hooks/useNow'

import AlarmBell from './AlarmBell'
import EquipmentSearch from './EquipmentSearch'

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

  return `${day} ${time}`
}

export default function Header() {
  const now = useNow(1000)

  return (
    <header className="flex h-full items-center border-b border-border-default bg-bg-base pr-6 pl-3">
      <span className="w-[478px] shrink-0 text-h1 font-black tracking-wide text-text-primary">GRAPICAR</span>

      <EquipmentSearch />

      <div className="ml-auto flex items-center gap-2 text-body text-text-secondary tabular-nums">
        <Clock size={14} />

        {formatDateTime(now)}
      </div>

      <AlarmBell />
    </header>
  )
}
