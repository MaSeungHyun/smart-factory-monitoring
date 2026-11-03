import { useEffect, useLayoutEffect, useRef } from 'react'

import {
  COUNT_INTRO_DELAY_S,
  COUNT_INTRO_DURATION_S,
  SMOOTH_MAX_FRAME_MS,
  SMOOTH_MOUNT_TAU_MS,
  SMOOTH_SETTLE_EPSILON,
  SMOOTH_UPDATE_TAU_MS,
} from '@/shared/constants/animation'
import { introClock } from '@/shared/stores/introClock'

/** 고정 목표값, 또는 프레임마다 읽는 연속 목표 (재생 시각에 따라 움직이는 값) */
export type SmoothTarget = number | (() => number)

/** 인트로 카운트업 곡선 (ease-out quart, 오버슈트 없음) */
const easeOut = (k: number) => 1 - (1 - k) ** 4

/** 인트로 카운트업이 끝나는 시각 (ms). 인트로 전이면 Infinity */
function introEnd() {
  const startedAt = introClock.getState().startedAt

  return startedAt === null ? Infinity : startedAt + (COUNT_INTRO_DELAY_S + COUNT_INTRO_DURATION_S) * 1000
}

/**
 * 인트로 중 첫 마운트: T=0 + COUNT_INTRO_DELAY_S 부터 COUNT_INTRO_DURATION_S 동안 0 → 목표.
 * 반환 null = 인트로가 이미 끝나 일반 스무딩으로
 */
function introValue(goal: number, now: number) {
  const startedAt = introClock.getState().startedAt

  if (startedAt === null) return 0

  const k = (now - startedAt - COUNT_INTRO_DELAY_S * 1000) / (COUNT_INTRO_DURATION_S * 1000)

  if (k >= 1) return null

  return goal * easeOut(Math.max(k, 0))
}

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

  const state = useRef({ value: 0, mounting: true, intro: performance.now() < introEnd(), raf: 0, last: 0 })

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

      // 인트로 카운트업: 모든 숫자 · 막대가 같은 시각에 출발해 같은 시각에 끝난다
      if (s.intro) {
        const value = introValue(goal, now)

        if (value !== null) {
          s.value = value

          frameRef.current(s.value)

          s.raf = requestAnimationFrame(step)

          return
        }

        s.intro = false

        s.mounting = false

        s.value = goal
      }

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