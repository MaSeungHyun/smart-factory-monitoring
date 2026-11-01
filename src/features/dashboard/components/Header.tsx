import { Bell, Clock, Search } from 'lucide-react'

import { useNow } from '@/shared/hooks/useNow'

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

      <label className="flex h-11 w-[596px] items-center gap-2 rounded border border-border-default bg-bg-surface px-3">
        <Search size={16} className="text-text-tertiary" />

        <input
          placeholder="장비, 주문 번호, AMR 검색"
          className="w-full bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </label>

      <div className="ml-auto flex items-center gap-2 text-body text-text-secondary tabular-nums">
        <Clock size={14} />

        {formatDateTime(now)}
      </div>

      <button
        type="button"
        className="relative ml-6 flex size-9 items-center justify-center rounded border border-border-default text-text-secondary"
      >
        <Bell size={16} />

        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-status-error" />
      </button>
    </header>
  )
}
