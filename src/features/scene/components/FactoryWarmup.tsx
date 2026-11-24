import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect } from 'react'
import { type Camera, Group, Mesh, type Object3D, MeshStandardMaterial, type Scene, Texture, WebGLRenderer } from 'three'

import { applyAnisotropy, maxAnisotropy, TEXTURE_ANISOTROPY } from '@/shared/lib/three/anisotropy'
import { initTexturesInBatches } from '@/shared/lib/three/compileInBatches'

import { restMaterial } from '../lib/factoryIntro'
import { sceneWarm } from '../lib/sceneWarm'

/**
 * WebGPU 파이프라인 준비를 이 시간(ms)까지만 기다린다. 넘으면 준비와 상관없이 로딩 화면을 닫는다
 * (남은 파이프라인은 첫 프레임들에서 마저 만든다)
 */
const WEBGPU_WARM_TIMEOUT_MS = 20_000

const keptMaterials: MeshStandardMaterial[] = []

type Frameloop = 'always' | 'demand' | 'never'

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true
}

function collectMeshes(scene: Object3D) {
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
 * 인트로가 끝난 뒤의 불투명 재질(factory-props)을 미리 컴파일할 묶음.
 * anisotropy 가 있으면 GPU 업로드 전에 이방성 필터를 건다 (WebGL 만. WebGPU 는 지금 보이는 그대로 둔다)
 */
function restStand(scene: Object3D, anisotropy: number | null) {
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

      if (anisotropy !== null) {
        applyAnisotropy(material, anisotropy)

        applyAnisotropy(rest, anisotropy)
      }

      keptMaterials.push(rest)

      const holder = new Mesh(object.geometry, rest)

      holder.frustumCulled = false

      stand.add(holder)

      if (rest.map) textures.add(rest.map)

      if (rest.emissiveMap) textures.add(rest.emissiveMap)
    }
  })

  return { stand, textures }
}

/**
 * WebGPU: 실제 씬을 그대로 compileAsync 한다.
 * - 노드 재질 빌드 · 파이프라인 생성을 비동기(병렬)로 로딩 화면 뒤에서 끝낸다. 하지 않으면 첫 프레임들이
 *   모든 파이프라인을 하나씩 동기로 만들며 멈춘다.
 * - 대상이 실제 메시라 InstancedMesh · 그림자 패스(그림자 조명의 updateBefore)까지 같은 키로 준비된다.
 * - 준비하는 동안 프레임 루프를 멈춘다. 중간에 렌더가 끼면 아직 안 된 메시를 동기로 컴파일하기 때문이다.
 * - 화면 밖 메시도 준비되도록 프러스텀 컬링은 씬을 훑는 순간(compileAsync 호출 직후 동기 구간)만 끈다.
 */
function warmWebGPU(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  meshes: Mesh[],
  setFrameloop: (loop: Frameloop) => void,
  invalidate: () => void,
) {
  let cancelled = false

  let paused = true

  const resume = () => {
    if (!paused) return

    paused = false

    setFrameloop('always')

    invalidate()
  }

  setFrameloop('never')

  for (const mesh of meshes) mesh.visible = true

  const culled = meshes.filter((mesh) => mesh.frustumCulled)

  const { stand } = restStand(scene, null)

  const compile = async () => {
    let sceneCompile: Promise<unknown>

    try {
      sceneCompile = gl.compileAsync(scene, camera)
    } finally {
      for (const mesh of culled) mesh.frustumCulled = true
    }

    await sceneCompile

    if (cancelled) return

    await gl.compileAsync(stand, camera, scene)
  }

  for (const mesh of culled) mesh.frustumCulled = false

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, WEBGPU_WARM_TIMEOUT_MS))

  void (async () => {
    try {
      await Promise.race([compile(), timeout])
    } finally {
      if (!cancelled) {
        resume()

        sceneWarm.getState().mark()
      }
    }
  })()

  return () => {
    cancelled = true

    resume()
  }
}

/**
 * 첫 화면과 와이어프레임이 꺼지는 순간의 셰이더·텍스처·지오메트리 업로드를
 * 로딩 화면 뒤에서 끝낸다.
 */
export default function FactoryWarmup() {
  const gl = useThree((state) => state.gl)

  const scene = useThree((state) => state.scene)

  const camera = useThree((state) => state.camera)

  const setFrameloop = useThree((state) => state.setFrameloop)

  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    if (sceneWarm.getState().ready) return

    scene.traverse((object) => {
      if (isMesh(object)) object.visible = false
    })
  }, [scene])

  useEffect(() => {
    if (sceneWarm.getState().ready) {
      sceneWarm.getState().mark()

      return
    }

    const meshes = collectMeshes(scene)

    if (!(gl instanceof WebGLRenderer)) return warmWebGPU(gl, scene, camera, meshes, setFrameloop, invalidate)

    const wire = uniqueMaterialGroup(meshes)

    // 바닥 · 벽 텍스처는 비스듬히 보이므로 이방성 필터를 GPU 업로드 전에 건다 (GPU 최대값으로 자름)
    const { stand, textures } = restStand(scene, Math.min(TEXTURE_ANISOTROPY, maxAnisotropy(gl)))

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
  }, [gl, scene, camera, setFrameloop, invalidate])

  return null
}