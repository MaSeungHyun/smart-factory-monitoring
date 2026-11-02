import type { Camera, Material, Object3D, Scene, Texture, WebGLRenderer } from 'three'

/** 한 프레임에 워밍업이 쓸 수 있는 시간(ms). 나머지는 렌더에 남긴다 */
export const WARMUP_BUDGET_MS = 12

export const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

export interface CompileJob {
  scene: Object3D
  target?: Scene | null
}

/**
 * gl.compile 을 노드마다 나누고, 예산이 차면 다음 프레임으로 넘긴다.
 * 프로그램 키는 통째로 compile 할 때와 같다.
 */
export async function compileInBatches(
  gl: WebGLRenderer,
  camera: Camera,
  jobs: CompileJob[],
) {
  const materials = new Set<Material>()

  await nextFrame()

  let sliceStart = performance.now()

  for (const job of jobs) {
    const nodes: Object3D[] = []

    job.scene.traverse((node) => nodes.push(node))

    for (const node of nodes) {
      const own = Object.getOwnPropertyDescriptor(job.scene, 'traverse')

      Object.defineProperty(job.scene, 'traverse', {
        value: (callback: (object: Object3D) => void) => callback(node),
        configurable: true,
        writable: true,
      })

      try {
        for (const material of gl.compile(job.scene, camera, job.target ?? null) as Set<Material>) materials.add(material)
      } finally {
        if (own) Object.defineProperty(job.scene, 'traverse', own)
        else delete (job.scene as { traverse?: unknown }).traverse
      }

      if (performance.now() - sliceStart > WARMUP_BUDGET_MS) {
        await nextFrame()

        sliceStart = performance.now()
      }
    }
  }

  while (materials.size) {
    for (const material of materials) {
      const program = (gl.properties.get(material) as { currentProgram?: { isReady: () => boolean } }).currentProgram

      if (program === undefined || program.isReady()) materials.delete(material)
    }

    if (materials.size) await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

/** 텍스처 GPU 업로드를 프레임 예산으로 나눈다 */
export async function initTexturesInBatches(gl: WebGLRenderer, textures: Iterable<Texture>) {
  let sliceStart = performance.now()

  for (const texture of textures) {
    gl.initTexture(texture)

    if (performance.now() - sliceStart > WARMUP_BUDGET_MS) {
      await nextFrame()

      sliceStart = performance.now()
    }
  }
}
