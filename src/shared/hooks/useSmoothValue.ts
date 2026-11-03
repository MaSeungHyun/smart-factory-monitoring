import { useEffect, useLayoutEffect, useRef } from 'react'

import {
  SMOOTH_MAX_FRAME_MS,
  SMOOTH_MOUNT_TAU_MS,
  SMOOTH_SETTLE_EPSILON,
  SMOOTH_UPDATE_TAU_MS,
} from '@/shared/constants/animation'

/** 고정 목표값, 또는 프레임마다 읽는 연속 목표 (재생 시각에 따라 움직이는 값) */
export type SmoothTarget = number | (() => number)

const read = (target: SmoothTarget) => {
  const value = typeof target === 'function' ? target() : target

  return Number.isFinite(value) ? value : 0
}

/**
 * 목표를 지수 스무딩으로 따라가며 onFrame(값)을 rAF 마다 부른다. React state 를 쓰지 않아 리렌더가 없다.
 * - 첫 마운트는 0 에서 출발해 감속하며 차오른다.
 * - 목표가 바뀌어도 애니메이션을 다시 시작하지 않고 현재 값에서 이어진다 (오버슈트 없음).
 * - 함수 목표는 매 프레임 읽어서, 계단처럼 바뀌는 값도 연속으로 따라간다.
 */
export function useSmoothValue(target: SmoothTarget, onFrame: (value: number) => void, scale = 100) {
  const targetRef = useRef(target)

  const frameRef = useRef(onFrame)

  const state = useRef({ value: 0, mounting: true, raf: 0, last: 0 })

  useLayoutEffect(() => {
    targetRef.current = target

    frameRef.current = onFrame
  })

  const start = useRef(() => {})

  start.current = () => {
    const s = state.current

    if (s.raf) return

    s.last = performance.now()

    const step = (now: number) => {
      const dt = Math.min(now - s.last, SMOOTH_MAX_FRAME_MS)

      s.last = now

      const goal = read(targetRef.current)

      const tau = s.mounting ? SMOOTH_MOUNT_TAU_MS : SMOOTH_UPDATE_TAU_MS

      s.value += (goal - s.value) * (1 - Math.exp(-dt / tau))

      const settled = Math.abs(goal - s.value) <= SMOOTH_SETTLE_EPSILON * Math.max(scale, Math.abs(goal))

      if (settled) {
        s.value = goal

        s.mounting = false
      }

      frameRef.current(s.value)

      s.raf = settled && typeof targetRef.current !== 'function' ? 0 : requestAnimationFrame(step)
    }

    s.raf = requestAnimationFrame(step)
  }

  // 목표가 바뀌면 (멈춰 있던) 루프를 다시 돌린다
  useEffect(() => {
    start.current()
  }, [target])

  useEffect(() => {
    const s = state.current

    return () => {
      cancelAnimationFrame(s.raf)

      s.raf = 0
    }
  }, [])

  return state
}