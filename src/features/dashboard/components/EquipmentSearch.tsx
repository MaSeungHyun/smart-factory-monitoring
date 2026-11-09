import { useMemo, useState, type KeyboardEvent } from 'react'

import { Search } from 'lucide-react'

import { useDashboardView } from '@/features/playback'
import { sceneEquipment } from '@/features/scene/lib/sceneEquipment'
import { cn } from '@/shared/lib/cn'
import { flyToEquipment } from '@/shared/lib/equipmentActions'

import { filterEntries, searchEntries } from '../lib/searchEquipment'

/** 헤더 검색: id · 이름으로 장비를 찾아 선택 + 카메라 이동 */
export default function EquipmentSearch() {
  const view = useDashboardView()

  const [query, setQuery] = useState('')

  const [open, setOpen] = useState(false)

  const [active, setActive] = useState(0)

  const entries = useMemo(() => searchEntries(view?.equipment ?? [], sceneEquipment), [view?.equipment])

  const results = filterEntries(entries, query)

  const pick = (id: string) => {
    flyToEquipment(id)

    setQuery('')

    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') setActive((index) => Math.min(index + 1, results.length - 1))

    if (event.key === 'ArrowUp') setActive((index) => Math.max(index - 1, 0))

    if (event.key === 'Enter' && results[active]) pick(results[active].id)

    if (event.key === 'Escape') {
      setQuery('')

      event.currentTarget.blur()
    }
  }

  return (
    <div className="relative w-[596px]">
      <label className="flex h-11 items-center gap-2 rounded border border-border-default bg-bg-surface px-3 transition-colors duration-150 focus-within:border-primary-on-dark hover:border-text-tertiary">
        <Search size={16} className="text-text-tertiary" />

        <input
          value={query}
          data-equipment-search
          onChange={(event) => {
            setQuery(event.target.value)

            setActive(0)

            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="장비, 주문 번호, AMR 검색"
          className="w-full bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary focus-visible:outline-none"
        />
      </label>

      {open && query.trim() && (
        <ul role="listbox" className="absolute top-12 right-0 left-0 z-50 overflow-hidden rounded border border-border-default bg-bg-surface shadow-xl">
          {results.map((entry, index) => (
            <li
              key={entry.id}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault()

                pick(entry.id)
              }}
              onMouseEnter={() => setActive(index)}
              className={cn('flex cursor-pointer items-center gap-3 px-3 py-2 text-body', index === active ? 'bg-primary-fill/24 text-text-primary' : 'text-text-secondary')}
            >
              <span className="font-semibold text-text-primary">{entry.name}</span>

              <span className="text-caption text-text-tertiary">{entry.id}</span>

              <span className="ml-auto text-caption text-text-tertiary">{entry.detail}</span>
            </li>
          ))}

          {results.length === 0 && <li className="px-3 py-2 text-caption text-text-tertiary">일치하는 장비가 없습니다</li>}
        </ul>
      )}
    </div>
  )
}
