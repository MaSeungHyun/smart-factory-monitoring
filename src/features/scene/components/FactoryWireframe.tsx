import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BufferGeometry,
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  type Material,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import {
  WIREFRAME_FADE_TAU_S,
  WIREFRAME_RESCAN_S,
  WIREFRAME_SURFACE_OPACITY,
} from '@/shared/constants/animation'
import { uiStore } from '@/shared/stores/useUiStore'

import { dashboardAt, playbackStore } from '@/features/playback'
import type { DashboardView } from '@/features/playback/lib/dashboardView'
import type { EquipmentKind } from '@/shared/types'

import {
  WIRE_BUILDING_GROUP,
  WIRE_EDGE_THRESHOLD_DEG,
  WIRE_KIND_CATEGORY,
  WIRE_STATIC_CATEGORIES,
  WIRE_STYLE,
  type WireCategory,
} from '../constants/wireframe'
import { factoryIntroArmed } from '../lib/factoryIntro'
import { faultedIds } from '../lib/faultTargets'
import { wireState } from '../lib/wireframeBypass'

/*
 * 성능 메모
 * - 예전: 메쉬마다 wireframe:true 메쉬를 하나씩 겹침 -> 그리기 호출 x2, 삼각형 모든 변(대각선 포함)을 선으로 그림
 * - 지금: 지오메트리마다 EdgesGeometry 를 한 번만 만들어 캐시(WeakMap, 껐다 켜도 재사용)
 *         움직이지 않는 분류는 장비별로 월드 좌표를 구워 하나의 LineSegments 로 합침 -> 정적 설비 선은 장비 수만큼만 호출
 *         움직이는 것(로봇 팔 · AMR · 박스)만 메쉬에 선을 붙이고 캐시된 지오메트리를 공유
 * - 페이드가 끝나면 매 프레임 재질 값을 건드리지 않는다. 끄면 선을 모두 떼서 일반 보기 비용은 0
 */

const OVERLAY_NAME = 'factory-view-wire'

interface Saved {
  opacity: number
  transparent: boolean
  depthWrite: boolean
}

interface Info {
  category: WireCategory
  id: string | null
}

/** 조상을 올라가며 장비 그룹(userData.equipmentId)이나 구조물 그룹을 찾아 분류한다 */
function classify(mesh: Object3D): Info {
  for (let node: Object3D | null = mesh; node; node = node.parent) {
    const id = node.userData?.equipmentId as string | undefined

    if (id) return { category: WIRE_KIND_CATEGORY[node.userData.kind as EquipmentKind] ?? 'other', id }

    if (node.name === WIRE_BUILDING_GROUP) return { category: 'building', id: null }
  }

  return { category: 'other', id: null }
}

const CATEGORIES = Object.keys(WIRE_STYLE) as WireCategory[]

// 지오메트리 -> 모서리 선 (모듈 전역 캐시: 토글할 때마다 다시 만들지 않는다)
const edgesCache = new WeakMap<BufferGeometry, BufferGeometry>()

function edgesOf(geometry: BufferGeometry): BufferGeometry {
  let edges = edgesCache.get(geometry)

  if (!edges) {
    edges = new EdgesGeometry(geometry, WIRE_EDGE_THRESHOLD_DEG)

    edgesCache.set(geometry, edges)
  }

  return edges
}

function standardOf(mesh: Mesh): MeshStandardMaterial[] {
  const list: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

  return list.filter((material): material is MeshStandardMaterial => material instanceof MeshStandardMaterial)
}

function noRaycast() {}

/** Wireframe 버튼: 면을 걷어내고 종류별 색 모서리 선을 겹친다. 재질은 복제하지 않고 원래 값을 되돌린다 */
export default function FactoryWireframe() {
  const scene = useThree((state) => state.scene)

  // 분류마다 공유 선 재질 하나
  const lines = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          new LineBasicMaterial({
            color: new Color(WIRE_STYLE[category].color),
            transparent: true,
            opacity: 0,
            toneMapped: false,
            depthWrite: false,
          }),
        ]),
      ) as Record<WireCategory, LineBasicMaterial>,
    [],
  )

  // 선이 붙은(또는 합쳐진) 원본 메쉬
  const seen = useRef(new Set<Mesh>())

  // 움직이는 메쉬 -> 붙인 선
  const attached = useRef(new Map<Mesh, LineSegments>())

  // 선 -> 분류 · 장비 id (고장 빨강 전환용)
  const meta = useRef(new Map<LineSegments, Info>())

  // 정적 묶음 키 -> 월드 좌표로 구운 조각들 / 합친 선
  const parts = useRef(new Map<string, { info: Info; geometries: BufferGeometry[] }>())

  const merged = useRef(new Map<string, LineSegments>())

  const faulted = useRef(new Set<string>())

  const viewSeen = useRef<DashboardView | null | undefined>(undefined)

  const saved = useRef(new Map<MeshStandardMaterial, Saved>())

  const k = useRef(0)

  const kApplied = useRef(-1)

  const sinceScan = useRef(Infinity)

  const materialFor = (info: Info) => lines[info.id && faulted.current.has(info.id) ? 'fault' : info.category]

  // 끝낼 때 선을 떼고 재질을 원래대로 돌린다 (캐시된 모서리 지오메트리는 남겨 다음에 재사용)

  const clear = () => {
    for (const [, line] of attached.current) line.removeFromParent()

    for (const [, line] of merged.current) {
      line.removeFromParent()

      line.geometry.dispose()
    }

    for (const [, part] of parts.current) for (const geometry of part.geometries) geometry.dispose()

    attached.current.clear()

    merged.current.clear()

    parts.current.clear()

    meta.current.clear()

    seen.current.clear()

    for (const [material, snap] of saved.current) {
      const changed = material.transparent !== snap.transparent

      material.opacity = snap.opacity

      material.transparent = snap.transparent

      material.depthWrite = snap.depthWrite

      if (changed) material.needsUpdate = true
    }

    saved.current.clear()

    kApplied.current = -1
  }

  useEffect(
    () => () => {
      wireState.active = false

      clear()

      for (const material of Object.values(lines)) material.dispose()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines],
  )

  // 새 메쉬만 처리: 정적이면 묶음에 넣고, 움직이면 선을 붙인다

  const scan = () => {
    const dirty = new Set<string>()

    let added = false

    scene.traverse((object) => {
      if (!(object instanceof Mesh) || seen.current.has(object) || object.name === 'factory-intro-wire') return

      const materials = standardOf(object)

      if (materials.length === 0) return

      seen.current.add(object)

      added = true

      for (const material of materials) {
        if (!saved.current.has(material)) {
          saved.current.set(material, {
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite,
          })
        }
      }

      const info = classify(object)

      const edges = edgesOf(object.geometry)

      if (WIRE_STATIC_CATEGORIES.has(info.category)) {
        const key = `${info.category}|${info.id ?? ''}`

        object.updateWorldMatrix(true, false)

        const part = parts.current.get(key) ?? { info, geometries: [] }

        part.geometries.push(edges.clone().applyMatrix4(object.matrixWorld))

        parts.current.set(key, part)

        dirty.add(key)

        return
      }

      const line = new LineSegments(edges, materialFor(info))

      line.name = OVERLAY_NAME

      line.renderOrder = 3

      line.raycast = noRaycast

      object.add(line)

      attached.current.set(object, line)

      meta.current.set(line, info)
    })

    // 바뀐 정적 묶음만 다시 합친다
    for (const key of dirty) {
      const part = parts.current.get(key)!

      const old = merged.current.get(key)

      if (old) {
        old.removeFromParent()

        old.geometry.dispose()

        meta.current.delete(old)
      }

      const geometry = mergeGeometries(part.geometries, false)

      if (!geometry) continue

      const line = new LineSegments(geometry, materialFor(part.info))

      line.name = OVERLAY_NAME

      line.renderOrder = 3

      line.raycast = noRaycast

      line.matrixAutoUpdate = false

      scene.add(line)

      merged.current.set(key, line)

      meta.current.set(line, part.info)
    }

    // 사라진 메쉬의 선은 정리
    for (const [mesh, line] of attached.current) {
      if (!mesh.parent) {
        line.removeFromParent()

        attached.current.delete(mesh)

        meta.current.delete(line)

        seen.current.delete(mesh)
      }
    }

    if (added) kApplied.current = -1
  }

  useFrame((_, delta) => {
    const target = uiStore.getState().wireframe && factoryIntroArmed() ? 1 : 0

    if (target === 0 && k.current === 0) return

    k.current += (target - k.current) * (1 - Math.exp(-Math.min(delta, 0.1) / WIREFRAME_FADE_TAU_S))

    if (Math.abs(target - k.current) < 0.002) k.current = target

    if (k.current === 0) {
      wireState.active = false

      clear()

      return
    }

    // 비전 인셋이 실제 모델로 그릴 수 있게 현재 재질 · 선을 알려 둔다
    wireState.active = true

    wireState.saved = saved.current

    wireState.lines = [[...attached.current.values()], [...merged.current.values()]]

    sinceScan.current += delta

    if (sinceScan.current >= WIREFRAME_RESCAN_S) {
      sinceScan.current = 0

      scan()
    }

    // 고장 장비가 바뀌면 해당 선만 빨강 / 원래 분류 재질로 바꿔 끼운다
    const view = dashboardAt(playbackStore.getState())

    if (view !== viewSeen.current) {
      viewSeen.current = view

      faulted.current = faultedIds(view?.alarms ?? [])

      for (const [line, info] of meta.current) {
        const next = materialFor(info)

        if (line.material !== next) line.material = next
      }
    }

    // 페이드 중이거나 새 재질이 생겼을 때만 값을 갱신
    if (k.current === kApplied.current) return

    kApplied.current = k.current

    for (const category of CATEGORIES) lines[category].opacity = k.current * WIRE_STYLE[category].opacity

    const keep = 1 - k.current * (1 - WIREFRAME_SURFACE_OPACITY)

    for (const [material, snap] of saved.current) {
      if (!material.transparent) {
        material.transparent = true

        material.needsUpdate = true
      }

      material.opacity = snap.opacity * keep

      material.depthWrite = snap.depthWrite && k.current < 0.5
    }
  })

  useEffect(() => {
    // 켤 때 첫 프레임에 바로 훑도록
    return uiStore.subscribe((state, prev) => {
      if (state.wireframe && !prev.wireframe) sinceScan.current = Infinity
    })
  }, [])

  return null
}