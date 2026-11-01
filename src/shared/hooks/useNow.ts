import { useEffect, useState } from 'react'

/** 현재 시각 (Date). intervalMs 마다 갱신, 경계(정초)에 맞춰 tick */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer = 0

    const tick = () => {
      setNow(new Date())

      timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs))
    }

    timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs))

    return () => window.clearTimeout(timer)
  }, [intervalMs])

  return now
}
