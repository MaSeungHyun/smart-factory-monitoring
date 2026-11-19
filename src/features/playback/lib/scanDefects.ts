import type { KpiSample, KpiTrack } from '@/shared/types/kpi'
import type { BoxTrack } from '@/shared/types/playback'
import type { RunManifestEquipment } from '@/shared/types/runChunk'

/**
 * 스캐너 불량 판정 -> 박스 불량 표시.
 * 녹화 박스 필드에는 판정 결과가 없고 KPI 스트림(scan.byScanner.<id>.defect, 1Hz 누계)만 있다.
 * 누계가 늘어난 초에 그 스캐너 벨트 위, 스캐너 중심에 가장 가까운 박스를 불량으로 본다.
 * (판독 중 박스가 스캐너 아래에 멈춰 있어 0.3m 안에 하나만 있다. t10 8h 녹화 156건 전부 1:1 매칭, 불량 팔레트 적재 박스와 일치)
 */

/** 판정 순간 박스 중심이 스캐너 중심에서 이 거리 안이어야 한다 (m) */
const SCAN_REACH = 1.5

/** 한 행에서 한 스캐너 누계가 이보다 많이 뛰면 (청크 경계 등) 무시한다 */
const MAX_STEP = 4

const defectOf = (sample: KpiSample | undefined, id: string) => sample?.scan?.byScanner?.[id]?.defect

/** time 의 박스 x, z (m). 키프레임 사이 선형 보간, 구간 밖이면 null */
function boxXZAt(box: BoxTrack, frameTimes: number[], time: number): [number, number] | null {
  if (time < box.t0 || (box.t1 !== null && time >= box.t1) || box.k.length === 0 || frameTimes.length === 0) return null

  const last = frameTimes.length - 1

  let frame = box.f0

  let prevT = -Infinity

  let prevX = 0

  let prevZ = 0

  for (let index = 0; index < box.k.length; index++) {
    frame += box.k[index]

    const t = frameTimes[Math.min(frame, last)]

    const x = box.p[index * 4] / 100

    const z = box.p[index * 4 + 2] / 100

    if (t >= time) {
      if (!Number.isFinite(prevT) || t === prevT) return [x, z]

      const k = (time - prevT) / (t - prevT)

      return [prevX + (x - prevX) * k, prevZ + (z - prevZ) * k]
    }

    prevT = t

    prevX = x

    prevZ = z
  }

  return [prevX, prevZ]
}

/** time 에 박스를 맡은 장비 id */
function ownerAt(box: BoxTrack, time: number) {
  let owner: string | null = null

  for (const [t, , id] of box.own) {
    if (t > time) break

    owner = id
  }

  return owner
}

/** KPI 스캐너 불량 누계로 박스에 defect 를 채운다. KPI 가 없거나 이미 판정이 있으면 그대로 */
export function markScanDefects(boxes: BoxTrack[], kpi: KpiTrack | undefined, equipment: RunManifestEquipment[], frameTimes: number[]): BoxTrack[] {
  if (!kpi || kpi.samples.length < 2 || boxes.some((box) => box.defect)) return boxes

  const scanners = equipment.filter((entry) => entry.kind === 'scanner' && entry.pos)

  if (!scanners.length) return boxes

  const marked = new Map<string, BoxTrack['defect']>()

  for (let index = 1; index < kpi.samples.length; index++) {
    const time = kpi.t[index]

    for (const scanner of scanners) {
      const before = defectOf(kpi.samples[index - 1], scanner.id)

      const after = defectOf(kpi.samples[index], scanner.id)

      if (before === undefined || after === undefined) continue

      const step = Math.round(after - before)

      if (step <= 0 || step > MAX_STEP) continue

      const belt = `scanbelt:${scanner.id}`

      const [sx, sz] = scanner.pos

      const near: [number, BoxTrack][] = []

      for (const box of boxes) {
        if (marked.has(box.id)) continue

        const owner = ownerAt(box, time)

        if (owner !== null && owner !== belt) continue

        const at = boxXZAt(box, frameTimes, time)

        if (!at) continue

        const distance = Math.hypot(at[0] - sx, at[1] - sz)

        if (distance <= SCAN_REACH) near.push([distance, box])
      }

      near.sort((a, b) => a[0] - b[0])

      for (const [, box] of near.slice(0, step)) marked.set(box.id, { t: time, by: scanner.id, src: 'sim' })
    }
  }

  if (!marked.size) return boxes

  return boxes.map((box): BoxTrack => {
    const defect = marked.get(box.id)

    return defect ? { ...box, state: 'defect', defect } : box
  })
}
