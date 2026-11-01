import { samplePose } from '@/features/playback/lib/samplePose'
import { playbackStore } from '@/features/playback/lib/usePlaybackStore'

/** 박스·팔레트 중심이 이 거리 안이면 그 AMR 위에 실린 것으로 본다 */
const REACH = 1.05

/**
 * 입하 컨베이어 위 박스 각.
 * 받을 때 기록에는 AMR 쪽으로 90° 돌아가는 값이 들어 있다.
 * 화면에서는 그 회전을 빼고, AMR이 이후 돈 각도만 더한다.
 */
const INBOUND_YAW = -Math.PI / 2

interface AmrPose {
  x: number
  z: number
  yaw: number
}

let cachedRun: object | null = null

let cachedTime = Number.NaN

let cachedPoses: AmrPose[] = []

/** 같은 재생 시각의 AMR 보간은 한 번만 한다. 박스·팔레트가 같은 프레임에 여러 번 묻는다 */
function amrPoses(time: number) {
  const run = playbackStore.getState().run

  if (run === cachedRun && time === cachedTime) return cachedPoses

  cachedRun = run

  cachedTime = time

  cachedPoses = []

  if (!run) return cachedPoses

  const { t, poses } = run.tracks

  for (const [id, track] of Object.entries(poses)) {
    if (!id.startsWith('amr-')) continue

    const pose = samplePose(track, t, time)

    if (pose) cachedPoses.push(pose)
  }

  return cachedPoses
}

/** 가장 가까운 AMR의 yaw. 실려 있지 않으면 null */
export function nearestAmrYaw(x: number, z: number, time: number) {
  let best = REACH

  let yaw: number | null = null

  for (const pose of amrPoses(time)) {
    const distance = Math.hypot(x - pose.x, z - pose.z)

    if (distance < best) {
      best = distance

      yaw = pose.yaw
    }
  }

  return yaw
}

/** 한 팔레트로 묶는 거리. RailPallets 와 같다 */
const CLUSTER_REACH = 0.6

const CLUSTER_MAX = 8

/** 바닥층과 그 위 층을 나누는 높이 */
const LAYER = 0.2

export interface CarryPoint {
  x: number
  y: number
  z: number
  yaw: number
}

interface Cluster {
  x: number
  z: number
  n: number
  index: number[]
}

const clusters: Cluster[] = []

function wrap(angle: number) {
  const turn = Math.PI * 2

  let value = angle % turn

  if (value > Math.PI) value -= turn

  if (value < -Math.PI) value += turn

  return value
}

/** yaw 회전. three.js Y 축과 같다 */
function rotateY(x: number, z: number, angle: number) {
  const c = Math.cos(angle)

  const s = Math.sin(angle)

  return [x * c + z * s, -x * s + z * c] as const
}

/**
 * 팔레트 위 박스는 팔레트에 고정돼 있다.
 * 기록에는 입하에서 받을 때와 레일에 올릴 때 더미가 90°씩 돈 값이 들어 있다.
 * 팔레트는 그 회전을 하지 않으므로, 박스 위치·각도에서도 빼고
 * 팔레트가 AMR 과 같이 돈 각도만 남긴다.
 */
export function holdBoxesOnPallet(points: CarryPoint[], count: number, time: number) {
  let used = 0

  for (let i = 0; i < count; i++) {
    const point = points[i]

    let best: Cluster | null = null

    let bestD = CLUSTER_REACH

    for (let c = 0; c < used; c++) {
      const cluster = clusters[c]

      const distance = Math.hypot(point.x - cluster.x / cluster.n, point.z - cluster.z / cluster.n)

      if (distance < bestD) {
        best = cluster

        bestD = distance
      }
    }

    if (best && best.n < CLUSTER_MAX) {
      best.x += point.x

      best.z += point.z

      best.n += 1

      best.index.push(i)
    } else {
      const cluster = clusters[used] ?? (clusters[used] = { x: 0, z: 0, n: 0, index: [] })

      cluster.x = point.x

      cluster.z = point.z

      cluster.n = 1

      cluster.index.length = 0

      cluster.index.push(i)

      used += 1
    }
  }

  for (let c = 0; c < used; c++) {
    const cluster = clusters[c]

    if (cluster.n < 2) continue

    const cx = cluster.x / cluster.n

    const cz = cluster.z / cluster.n

    const palletYaw = nearestAmrYaw(cx, cz, time) ?? 0

    let minY = Infinity

    for (const index of cluster.index) minY = Math.min(minY, points[index].y)

    let deckN = 0

    let deckY = 0

    for (const index of cluster.index) {
      const point = points[index]

      if (point.y > minY + LAYER) continue

      deckN += 1

      deckY += point.y
    }

    const deck = deckN > 0 ? deckY / deckN : minY

    let szz = 0

    let syz = 0

    for (const index of cluster.index) {
      const point = points[index]

      if (point.y > minY + LAYER) continue

      const dz = point.z - cz

      szz += dz * dz

      syz += (point.y - deck) * dz
    }

    const slope = szz > 1e-6 ? syz / szz : 0

    for (const index of cluster.index) {
      const point = points[index]

      const spun = wrap(point.yaw - INBOUND_YAW)

      const [lx, lz] = rotateY(point.x - cx, point.z - cz, -spun)

      const lift = point.y - (deck + slope * (point.z - cz))

      const [wx, wz] = rotateY(lx, lz, palletYaw)

      point.x = cx + wx

      point.z = cz + wz

      point.y = deck + slope * wz + lift

      point.yaw = INBOUND_YAW + palletYaw
    }
  }
}
