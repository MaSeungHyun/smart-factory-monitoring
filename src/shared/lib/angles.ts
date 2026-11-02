/**
 * Continuous joints (robot_IK hand00/02/03/04) are recorded unwrapped, and robot_IK snaps whole turns
 * off the base at rest (SuctionRobotController.wrapBaseAtRest). The pose is identical, but a curve through
 * that 360 deg step spins the arm. Re-adding the turns keeps every frame-to-frame step within +-180 deg.
 */
export function unwrapDegrees(frames: (number[] | null | undefined)[]) {
  let previous: number[] | null = null

  let offsets: number[] = []

  for (const frame of frames) {
    if (!frame) continue

    if (!previous) {
      previous = frame.slice()

      offsets = frame.map(() => 0)

      continue
    }

    for (let joint = 0; joint < frame.length; joint++) {
      const raw = frame[joint]

      const step = raw + offsets[joint] - previous[joint]

      offsets[joint] -= Math.round(step / 360) * 360

      frame[joint] = raw + offsets[joint]

      previous[joint] = frame[joint]
    }
  }

  return frames
}