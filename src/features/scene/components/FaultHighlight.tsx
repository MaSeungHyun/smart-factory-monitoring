import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from 'three'

import { useDashboardView } from '@/features/playback'

import { faultedIds } from '../lib/faultTargets'

const RED = new Color('#ff2b2b')

interface Applied {
  meshes: { mesh: Mesh; original: Material | Material[] }[]
  materials: MeshStandardMaterial[]
}

const redden = (material: Material) => {
  if (!(material instanceof MeshStandardMaterial)) return material

  const clone = material.clone()

  clone.emissive = RED.clone()

  return clone
}

function highlight(root: Object3D): Applied {
  const applied: Applied = { meshes: [], materials: [] }

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return

    applied.meshes.push({ mesh: object, original: object.material })

    object.material = Array.isArray(object.material) ? object.material.map(redden) : redden(object.material)

    const list = Array.isArray(object.material) ? object.material : [object.material]

    applied.materials.push(...list.filter((material): material is MeshStandardMaterial => material instanceof MeshStandardMaterial))
  })

  return applied
}

function restore(applied: Applied) {
  applied.meshes.forEach(({ mesh, original }) => {
    mesh.material = original
  })

  applied.materials.forEach((material) => material.dispose())
}

/** 미확인 고장 알람 장비의 재질을 붉게 발광(맥동). 확인하면 원래 재질로 복구 */
export default function FaultHighlight() {
  const view = useDashboardView()

  const scene = useThree((state) => state.scene)

  const ids = useMemo(() => faultedIds(view?.alarms ?? []), [view])

  const active = useRef(new Map<string, Applied>())

  useFrame(({ clock }) => {
    const current = active.current

    for (const [id, applied] of current) {
      if (ids.has(id)) continue

      restore(applied)

      current.delete(id)
    }

    for (const id of ids) {
      if (current.has(id)) continue

      const root = scene.getObjectByName(id)

      if (root) current.set(id, highlight(root))
    }

    const intensity = 0.6 + 0.4 * Math.sin(clock.elapsedTime * 5)

    current.forEach(({ materials }) => materials.forEach((material) => (material.emissiveIntensity = intensity)))
  })

  return null
}
