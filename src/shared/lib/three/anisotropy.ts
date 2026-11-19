import { Texture, WebGLRenderer, type Material } from 'three'

/** 바닥 · 벽처럼 비스듬히 보이는 면의 이방성 필터 목표값. 실제 값은 GPU 최대값으로 자른다 */
export const TEXTURE_ANISOTROPY = 8

const SLOTS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'alphaMap',
  'specularColorMap',
  'specularIntensityMap',
  'anisotropyMap',
] as const

/** WebGL 은 capabilities, WebGPU 는 renderer.getMaxAnisotropy() */
export function maxAnisotropy(gl: unknown) {
  if (gl instanceof WebGLRenderer) return gl.capabilities.getMaxAnisotropy()

  const renderer = gl as { getMaxAnisotropy?: () => number }

  return renderer.getMaxAnisotropy?.() ?? 1
}

/**
 * 재질의 텍스처에 이방성 필터를 건다. GPU 업로드 전에 불러야 다시 올리지 않는다
 * (업로드 뒤에 바꾸면 three 가 값을 다시 적용하지 않는다).
 */
export function applyAnisotropy(material: Material, level: number) {
  if (level <= 1) return

  const slots = material as unknown as Record<string, unknown>

  for (const slot of SLOTS) {
    const texture = slots[slot]

    if (texture instanceof Texture && texture.anisotropy < level) texture.anisotropy = level
  }
}
