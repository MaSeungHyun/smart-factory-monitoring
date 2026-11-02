import type { PalletEvent } from '@/shared/types/runEvents'

/** 이벤트 팔레트 그룹 이름. 템플릿 장비 id 와 겹치지 않게 접두어를 붙인다 */
export const palletNodeName = (id: string) => `pallet:${id}`

/** 팔레트 id -> 시간순 이벤트 */
export function palletTracks(events: PalletEvent[]) {
  const tracks = new Map<string, PalletEvent[]>()

  for (const event of [...events].sort((a, b) => a.t - b.t)) {
    const list = tracks.get(event.id) ?? []

    list.push(event)

    tracks.set(event.id, list)
  }

  return tracks
}

/** t 이하 마지막 이벤트 index (없으면 -1) */
export function palletEventAt(events: PalletEvent[], time: number) {
  let low = -1

  let high = events.length - 1

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (events[mid].t <= time) low = mid
    else high = mid - 1
  }

  return low
}
