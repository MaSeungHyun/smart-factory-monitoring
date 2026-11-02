import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'

import { sceneReady } from '@/shared/stores/sceneReady'

import { FACTORY_INTRO_DURATION, armFactoryIntro, factoryIntroArmed, paintFactorySurface, paintFactoryWire, type IntroWire } from '../lib/factoryIntro'
import { sceneWarm } from '../lib/sceneWarm'

/** 로딩 창이 닫힌 뒤 선이 달아오르고, 그 빛 사이로 원래 면이 들어온다 */
export default function FactoryIntro({ materials, wires }: { materials: MeshStandardMaterial[]; wires: IntroWire[] }) {
  const elapsed = useRef(0)

  const done = useRef(false)

  useFrame((_, delta) => {
    if (done.current) return

    if (!factoryIntroArmed()) {
      if (!sceneReady.getState().ready || document.querySelector('[data-factory-loader]')) return

      armFactoryIntro()
    }

    elapsed.current += Math.min(delta, 0.05)

    if (!sceneWarm.getState().ready) {
      elapsed.current = Math.min(elapsed.current, FACTORY_INTRO_DURATION * 0.32)
    }

    const t = Math.min(elapsed.current / FACTORY_INTRO_DURATION, 1)

    for (const material of materials) paintFactorySurface(material, t)

    for (const wire of wires) paintFactoryWire(wire, t)

    if (t >= 1) done.current = true
  })

  return null
}
