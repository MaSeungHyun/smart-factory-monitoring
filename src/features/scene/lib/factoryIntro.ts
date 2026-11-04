import { Color, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Material, type Object3D } from 'three'

import { FACTORY_INTRO_DURATION_S, FACTORY_INTRO_SURFACE, FACTORY_INTRO_WIRE } from '@/shared/constants/animation'

/** 로딩 창이 닫힌 뒤에만 재생한다 */
let armed = false

/** 인트로가 한 번 끝났는지. 다시 만들어진 노드는 바로 실제 재질로 둔다 */
let finished = false

const DURATION = FACTORY_INTRO_DURATION_S

const LINE = new Color('#d5dde4')

const GLOW = new Color('#4fa8d4')

const HOT = new Color('#f4fbff')

export interface IntroWire {
  mesh: Mesh
  material: MeshBasicMaterial
}

const scratch = new Color()

interface Snapshot {
  color: Color
  emissive: Color
  emissiveIntensity: number
  map: MeshStandardMaterial['map']
  emissiveMap: MeshStandardMaterial['emissiveMap']
  roughness: number
  metalness: number
  envMapIntensity: number
  opacity: number
  transparent: boolean
  depthWrite: boolean
}

const snapshots = new WeakMap<MeshStandardMaterial, Snapshot>()

const introOf = new WeakMap<Material, MeshStandardMaterial>()

const smooth = (edge0: number, edge1: number, value: number) => {
  const span = edge1 - edge0

  const k = span <= 0 ? 1 : Math.min(1, Math.max(0, (value - edge0) / span))

  return k * k * (3 - 2 * k)
}

function take(material: MeshStandardMaterial): Snapshot {
  return {
    color: material.color.clone(),
    emissive: material.emissive.clone(),
    emissiveIntensity: material.emissiveIntensity,
    map: material.map,
    emissiveMap: material.emissiveMap,
    roughness: material.roughness,
    metalness: material.metalness,
    envMapIntensity: material.envMapIntensity,
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
  }
}

function restore(material: MeshStandardMaterial) {
  const snap = snapshots.get(material)

  if (!snap) return

  const transparent = material.transparent

  material.wireframe = false

  material.color.copy(snap.color)

  material.map = snap.map

  material.emissiveMap = snap.emissiveMap

  material.emissive.copy(snap.emissive)

  material.emissiveIntensity = snap.emissiveIntensity

  material.roughness = snap.roughness

  material.metalness = snap.metalness

  material.envMapIntensity = snap.envMapIntensity

  material.opacity = snap.opacity

  material.transparent = snap.transparent

  material.depthWrite = snap.depthWrite

  if (material.transparent !== transparent) material.needsUpdate = true
}

/** 면은 빛으로 채워지고, 선은 그 위에서 사라진다 */
export function paintFactorySurface(material: MeshStandardMaterial, t: number) {
  const snap = snapshots.get(material)

  if (!snap) return

  if (t >= 1) {
    restore(material)

    return
  }

  const appear = smooth(FACTORY_INTRO_SURFACE.appearStart, FACTORY_INTRO_SURFACE.appearEnd, t)

  const settle = smooth(FACTORY_INTRO_SURFACE.settleStart, 1, t)

  material.wireframe = false

  material.transparent = true

  material.opacity = snap.opacity * appear

  material.depthWrite = snap.depthWrite && appear > 0.22

  material.color.copy(GLOW).lerp(snap.color, settle)

  scratch.copy(GLOW).lerp(snap.emissive, settle)

  material.emissive.copy(scratch)

  material.emissiveIntensity = 3.4 * (1 - settle) + snap.emissiveIntensity * settle

  material.roughness = 1 + (snap.roughness - 1) * settle

  material.metalness = snap.metalness * settle

  material.envMapIntensity = snap.envMapIntensity * settle
}

/** 선이 하얗게 달아올랐다가 면 뒤로 걷힌다 */
export function paintFactoryWire(wire: IntroWire, t: number) {
  if (t >= 1) {
    wire.mesh.visible = false

    return
  }

  const glowK = smooth(FACTORY_INTRO_WIRE.glowStart, FACTORY_INTRO_WIRE.glowEnd, t)

  const hot = smooth(FACTORY_INTRO_WIRE.hotStart, FACTORY_INTRO_WIRE.hotEnd, t)

  wire.material.color.copy(LINE).lerp(GLOW, glowK)

  wire.material.color.lerp(HOT, hot * 0.85)

  wire.material.opacity = 1 - smooth(FACTORY_INTRO_WIRE.fadeStart, FACTORY_INTRO_WIRE.fadeEnd, t)

  wire.mesh.visible = wire.material.opacity > 0.02
}

function introMaterial(source: Material, into: MeshStandardMaterial[]) {
  if (!(source instanceof MeshStandardMaterial)) return source

  const existing = introOf.get(source)

  if (existing) {
    // 다시 만들어진 노드도 같은 재질을 쓰므로 새 인트로 목록에 다시 넣어 끝 상태까지 칠해지게 한다
    if (!into.includes(existing)) into.push(existing)

    return existing
  }

  const clone = source.clone()

  snapshots.set(clone, take(clone))

  clone.wireframe = false

  clone.transparent = true

  clone.opacity = 0

  clone.depthWrite = false

  clone.color.copy(GLOW)

  clone.emissive.copy(GLOW)

  clone.emissiveIntensity = 3.4

  clone.needsUpdate = true

  introOf.set(source, clone)

  into.push(clone)

  return clone
}

/** 인트로가 끝난 뒤의 불투명 재질. 프로그램이 버려지지 않게 컴파일만 하고 유지한다 */
export function restMaterial(material: MeshStandardMaterial) {
  const snap = snapshots.get(material)

  const clone = material.clone()

  if (!snap) return clone

  clone.wireframe = false

  clone.color.copy(snap.color)

  clone.map = snap.map

  clone.emissiveMap = snap.emissiveMap

  clone.roughness = snap.roughness

  clone.metalness = snap.metalness

  clone.envMapIntensity = snap.envMapIntensity

  clone.emissive.copy(snap.emissive)

  clone.emissiveIntensity = snap.emissiveIntensity

  clone.opacity = snap.opacity

  clone.transparent = snap.transparent

  clone.depthWrite = snap.depthWrite

  return clone
}

function addWire(mesh: Mesh, into: IntroWire[]) {
  const material = new MeshBasicMaterial({
    color: LINE.clone(),
    wireframe: true,
    transparent: true,
    opacity: 1,
    toneMapped: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })

  const overlay = new Mesh(mesh.geometry, material)

  overlay.name = 'factory-intro-wire'

  overlay.renderOrder = 2

  overlay.raycast = () => {}

  mesh.add(overlay)

  into.push({ mesh: overlay, material })
}

/** 면은 투명하게 두고, 그 위에 와이어프레임을 한 장 겹친다 */
export function collectFactoryIntro(node: Object3D, into: MeshStandardMaterial[], wires: IntroWire[]) {
  node.traverse((object) => {
    if (!(object instanceof Mesh) || object.name === 'factory-intro-wire') return

    const materials = Array.isArray(object.material) ? object.material : [object.material]

    const next = materials.map((material) => introMaterial(material, into))

    object.material = Array.isArray(object.material) ? next : next[0]

    addWire(object, wires)
  })
}

export function armFactoryIntro() {
  armed = true
}

export function factoryIntroArmed() {
  return armed
}

export function finishFactoryIntro() {
  finished = true
}

export function factoryIntroDone() {
  return finished
}

export const FACTORY_INTRO_DURATION = DURATION
