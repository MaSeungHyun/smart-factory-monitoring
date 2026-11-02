import type { PlaybackRun } from '@/shared/types/playback'

/**
 * The recorded grip start is when the robot claims the box (PRE_GRASP), about 4 s before the
 * suction cup touches it. robot_IK attaches at ATTACH, so the contact time is the first status
 * frame of that robot after GRASP (ATTACH, LIFT, ...).
 */
const APPROACH_PHASES = new Set(['PRE_GRASP', 'GRASP'])

const phaseOf = (label: string) => label.split(' ')[0]

export function createContactFinder(run: PlaybackRun) {
  const frames = run.status

  return function contactAfter(robot: string, start: number, end: number) {
    let approached = false

    for (const frame of frames) {
      if (frame.t < start) continue

      if (frame.t >= end) break

      const sample = frame.equipment[robot]

      if (!sample) continue

      const phase = phaseOf(sample.label)

      if (APPROACH_PHASES.has(phase)) {
        approached = true

        continue
      }

      if (approached && sample.state !== 'idle') return frame.t
    }

    return start
  }
}