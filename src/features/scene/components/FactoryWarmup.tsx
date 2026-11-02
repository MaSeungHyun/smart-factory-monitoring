import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect } from 'react'
import { Group, Mesh, MeshStandardMaterial, Texture, WebGLRenderer } from 'three'

import { initTexturesInBatches } from '@/shared/lib/three/compileInBatches'

import { restMaterial } from '../lib/factoryIntro'
import { sceneWarm } from '../lib/sceneWarm'

const keptMaterials: MeshStandardMaterial[] = []

function isMesh(object: { isMesh?: boolean }): object is Mesh {
  return object.isMesh === true
}

function collectMeshes(scene: { traverse: (callback: (object: Mesh) => void) => void }) {
  const meshes: Mesh[] = []

  scene.traverse((object) => {
    if (isMesh(object)) meshes.push(object)
  })

  return meshes
}

/** 재질 프로그램은 한 번만 만든다. 노드마다 compile 하면 조명 수집이 반복된다 */
function uniqueMaterialGroup(meshes: Mesh[]) {
  const group = new Group()

  const seen = new Set<string>()

  for (const mesh of meshes) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

    for (const material of materials) {
      if (seen.has(material.uuid)) continue

      seen.add(material.uuid)

      const holder = new Mesh(mesh.geometry, material)

      holder.frustumCulled = false

      group.add(holder)
    }
  }

  return group
}

/**
 * 첫 화면과 와이어프레임이 꺼지는 순간의 셰이더·텍스처·지오메트리 업로드를
 * 로딩 화면 뒤에서 끝낸다.
 */
export default function FactoryWarmup() {
  const gl = useThree((state) => state.gl)

  const scene = useThree((state) => state.scene)

  const camera = useThree((state) => state.camera)

  useLayoutEffect(() => {
    if (sceneWarm.getState().ready) return

    scene.traverse((object) => {
      if (isMesh(object)) object.visible = false
    })
  }, [scene])

  useEffect(() => {
    if (sceneWarm.getState().ready || !(gl instanceof WebGLRenderer)) {
      sceneWarm.getState().mark()

      return
    }

    const meshes = collectMeshes(scene)

    const wire = uniqueMaterialGroup(meshes)

    const stand = new Group()

    const textures = new Set<Texture>()

    const seen = new Set<string>()

    scene.getObjectByName('factory-props')?.traverse((object) => {
      if (!isMesh(object)) return

      const materials = Array.isArray(object.material) ? object.material : [object.material]

      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial) || seen.has(material.uuid)) continue

        seen.add(material.uuid)

        const rest = restMaterial(material)

        keptMaterials.push(rest)

        const holder = new Mesh(object.geometry, rest)

        holder.frustumCulled = false

        stand.add(holder)

        if (rest.map) textures.add(rest.map)

        if (rest.emissiveMap) textures.add(rest.emissiveMap)
      }
    })

    let cancelled = false

    void (async () => {
      try {
        await gl.compileAsync(wire, camera, scene)

        if (cancelled) return

        await gl.compileAsync(stand, camera, scene)

        if (cancelled) return

        await initTexturesInBatches(gl, textures)
      } finally {
        if (!cancelled) {
          for (const mesh of meshes) mesh.visible = true

          sceneWarm.getState().mark()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gl, scene, camera])

  return null
}
