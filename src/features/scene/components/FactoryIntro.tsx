import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { MeshStandardMaterial } from 'three'

import { FACTORY_INTRO_SAFETY_S, FACTORY_INTRO_WARM_WAIT_S } from '@/shared/constants/animation'
import { sceneReady } from '@/shared/stores/sceneReady'

import { FACTORY_INTRO_DURATION, armFactoryIntro, factoryIntroArmed, factoryIntroDone, finishFactoryIntro, paintFactorySurface, paintFactoryWire, type IntroWire } from '../lib/factoryIntro'
import { sceneWarm } from '../lib/sceneWarm'

/** 실제 모델 상태로 확정 (면 원래 재질 · 선 숨김) */
function settle(materials: MeshStandardMaterial[], wires: IntroWire[]) {
  for (const material of materials) paintFactorySurface(material, 1)

  for (const wire of wires) paintFactoryWire(wire, 1)
}

/**
 * 로딩 창이 닫힌 뒤 선이 달아오르고, 그 빛 사이로 원래 면이 들어온다.
 * 카메라 · 사용자 조작과 무관한 자체 시계로 진행하고, 셰이더 준비가 늦거나 프레임이 멈춰도
 * 실제 시간 안전장치로 반드시 실제 모델로 끝난다. 다시 마운트되면 끝 상태로 바로 맞춘다.
 */
export default function FactoryIntro({ materials, wires }: { materials: MeshStandardMaterial[]; wires: IntroWire[] }) {
  const elapsed = useRef(0)

  const done = useRef(false)

  const startedAt = useRef(0)

  useFrame((_, delta) => {
    if (done.current) return

    if (factoryIntroDone()) {
      settle(materials, wires)

      done.current = true

      return
    }

    if (!factoryIntroArmed()) {
      if (!sceneReady.getState().ready || document.querySelector('[data-factory-loader]')) return

      armFactoryIntro()
    }

    const now = performance.now() / 1000

    if (startedAt.current === 0) startedAt.current = now

    const wall = now - startedAt.current

    elapsed.current += Math.min(delta, 0.05)

    // 셰이더 준비 전에는 앞부분에서 기다리되, 너무 오래면 그냥 진행
    if (!sceneWarm.getState().ready && wall < FACTORY_INTRO_WARM_WAIT_S) {
      elapsed.current = Math.min(elapsed.current, FACTORY_INTRO_DURATION * 0.32)
    }

    const timedOut = wall >= FACTORY_INTRO_WARM_WAIT_S + FACTORY_INTRO_DURATION + FACTORY_INTRO_SAFETY_S

    const t = timedOut ? 1 : Math.min(elapsed.current / FACTORY_INTRO_DURATION, 1)

    for (const material of materials) paintFactorySurface(material, t)

    for (const wire of wires) paintFactoryWire(wire, t)

    if (t >= 1) {
      done.current = true

      finishFactoryIntro()
    }
  })

  // 중간에 언마운트되면(재구성 · Suspense) 반쯤 칠해진 상태가 남지 않게 끝 상태로 정리
  useEffect(() => {
    return () => {
      if (!done.current) settle(materials, wires)
    }
  }, [materials, wires])

  return null
}