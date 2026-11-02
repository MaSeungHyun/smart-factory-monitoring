import { samplePose } from '@/features/playback/lib/samplePose'
import { playbackStore } from '@/features/playback/lib/usePlaybackStore'

/** 박스·팔레트 중심이 이 거리 안이면 그 AMR 위에 실린 것으로 본다 */
const REACH = 1.05

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
