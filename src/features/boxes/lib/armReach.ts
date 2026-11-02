import { Matrix4, Object3D } from 'three'

import { indexAt } from '@/features/playback/lib/frameAt'
import { createJointControl, setJointDegrees } from '@/features/playback/lib/robotJoints'
import { sampleJoint } from '@/features/playback/lib/samplePose'
import { findGripPoint } from '@/shared/lib/three/findGripPoint'
import type { PlaybackRun } from '@/shared/types/playback'

export type TipAt = (robot: Object3D, robotId: string, time: number, out: Matrix4, grounded: boolean) => boolean

/**
 * 원본 RobotArm 복제본으로 임의 시각의 그리퍼 월드 행렬을 구한다 (시크·과거 시각 FK).
 * grounded: 기존 캡처는 팔을 y=0 에 두고 관절을 기록했으므로 로봇 그룹 높이를 0 으로 둔다.
 */
export function createArmReach(template: Object3D, run: PlaybackRun): TipAt {
  const holder = new Object3D()

  const arm = template.clone(true)

  holder.add(arm)

  holder.matrixAutoUpdate = false

  const names = run.meta.jointNames

  const controls = names
    .map((name) => arm.getObjectByName(name))
    .filter((node): node is Object3D => !!node)
    .map(createJointControl)

  const tip = findGripPoint(arm)

  const ready = !!tip && controls.length === names.length

  return (robot, robotId, time, out, grounded) => {
    const track = run.tracks.joints[robotId]

    if (!ready || !tip || !track?.length) return false

    const times = run.tracks.t

    const index = indexAt(times, time)

    const next = Math.min(index + 1, times.length - 1)

    const span = times[next] - times[index]

    const k = span > 0 ? Math.min(Math.max((time - times[index]) / span, 0), 1) : 0

    controls.forEach((control, joint) => setJointDegrees(control, sampleJoint(track, index, next, k, joint)))

    robot.updateWorldMatrix(true, false)

    holder.matrix.copy(robot.matrixWorld)

    if (grounded) holder.matrix.elements[13] = 0

    holder.updateMatrixWorld(true)

    out.copy(tip.matrixWorld)

    return true
  }
}
