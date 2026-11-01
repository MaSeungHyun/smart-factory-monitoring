import { useEffect, type RefObject } from 'react'

/** 선택이 바뀌면 목록 안의 [data-equipment-id] 항목을 보이게 스크롤 */
export function useScrollToSelected(container: RefObject<HTMLElement | null>, selectedId: string | null) {
  useEffect(() => {
    if (!selectedId || !container.current) return

    const item = container.current.querySelector(`[data-equipment-id="${CSS.escape(selectedId)}"]`)

    item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [container, selectedId])
}
