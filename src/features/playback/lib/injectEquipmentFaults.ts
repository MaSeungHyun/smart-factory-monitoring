import type { EquipmentStateSample, PlaybackRun, RunAlarm, StatusFrame } from '@/shared/types/playback'

/** 로봇 모터 과열 · AMR 배터리 부족 — 각 1대 */
const ROBOT_FAULT = {
  id: 'robot-5',
  t: 48,
  hold: 28,
  message: '로봇 5 — 모터 과열 (J2 82°C)',
} as const

const AMR_FAULT = {
  id: 'amr-3',
  t: 72,
  hold: 40,
  message: 'AMR 3 — 배터리 부족 (18%)',
  /** 창 시작 시(이미 가동 수 시간 지난 상태) 잔량 */
  startBattery: 58,
  lowBattery: 18,
  /** 알람 종료 후 회복 목표 */
  recoverBattery: 28,
  recoverSec: 90,
} as const

function hasEquipment(run: PlaybackRun, id: string) {
  return run.equipment.some((entry) => entry.id === id) || run.status.some((frame) => frame.equipment[id])
}

/** 상태 행이 드문 녹화에서도 start~until 동안 patch 가 statusAt 에 잡히도록 시작 프레임을 끼운다 */
function withFaultWindow(
  status: StatusFrame[],
  start: number,
  until: number,
  apply: (equipment: StatusFrame['equipment']) => StatusFrame['equipment'],
): StatusFrame[] {
  const frames = status.map((frame) => ({ ...frame, equipment: { ...frame.equipment } }))

  const before = [...frames].reverse().find((frame) => frame.t <= start)

  if (before && !frames.some((frame) => Math.abs(frame.t - start) < 1e-3)) {
    frames.push({
      t: start,
      counts: { ...before.counts },
      equipment: apply({ ...before.equipment }),
    })
  }

  for (const frame of frames) {
    if (frame.t < start || frame.t >= until) continue

    frame.equipment = apply(frame.equipment)
  }

  // 구간이 끝나면 직전 정상 값을 다시 박아 statusAt 이 고장 값을 붙잡지 않게 한다
  const during = frames.filter((frame) => frame.t >= start && frame.t < until)

  const lastFault = during[during.length - 1]

  const after = frames.find((frame) => frame.t >= until)

  if (lastFault && !after) {
    const restore = status.find((frame) => frame.t <= start) ?? lastFault

    frames.push({
      t: until,
      counts: { ...lastFault.counts },
      equipment: { ...restore.equipment },
    })
  }

  return frames.sort((a, b) => a.t - b.t)
}

function ensureSample(equipment: StatusFrame['equipment'], id: string, fallback: EquipmentStateSample): EquipmentStateSample {
  return equipment[id] ?? fallback
}

/** 창 전체에서 배터리를 점진 소모·회복 (녹화값 100% → 18% 스냅 방지) */
function batteryAt(t: number) {
  const { t: lowAt, hold, startBattery, lowBattery, recoverBattery, recoverSec } = AMR_FAULT

  if (t <= 0) return startBattery

  if (t < lowAt) return startBattery + (lowBattery - startBattery) * (t / lowAt)

  if (t < lowAt + hold) return lowBattery

  const recover = Math.min(1, (t - lowAt - hold) / recoverSec)

  return lowBattery + (recoverBattery - lowBattery) * recover
}

function withAmrBatteryCurve(status: StatusFrame[], id: string): StatusFrame[] {
  let last: EquipmentStateSample | undefined

  return status.map((frame) => {
    const sample = frame.equipment[id] ?? last

    if (!sample) return frame

    last = sample

    const battery = Math.round(batteryAt(frame.t))

    const warn = battery <= AMR_FAULT.lowBattery + 2

    return {
      ...frame,
      equipment: {
        ...frame.equipment,
        [id]: {
          ...sample,
          battery,
          label: warn && sample.state !== 'error' ? 'WARN · 배터리 부족' : sample.label,
        },
      },
    }
  })
}

/** 시연용 장비 고장 알람 1건씩 — 상태 샘플(배터리·에러)과 알람 시각을 같이 맞춘다 */
export function injectEquipmentFaults(run: PlaybackRun): PlaybackRun {
  if (!run.status.length) return run

  const alarms: RunAlarm[] = [...run.alarms]

  const robotOk = hasEquipment(run, ROBOT_FAULT.id)

  const amrOk = hasEquipment(run, AMR_FAULT.id)

  if (robotOk) {
    alarms.push({
      id: 'F-motor-1',
      t: ROBOT_FAULT.t,
      until: ROBOT_FAULT.t + ROBOT_FAULT.hold,
      equipmentId: ROBOT_FAULT.id,
      severity: 'error',
      message: ROBOT_FAULT.message,
      source: 'random',
    })
  }

  if (amrOk) {
    alarms.push({
      id: 'F-battery-1',
      t: AMR_FAULT.t,
      until: AMR_FAULT.t + AMR_FAULT.hold,
      equipmentId: AMR_FAULT.id,
      severity: 'warning',
      message: AMR_FAULT.message,
      source: 'random',
    })
  }

  if (!robotOk && !amrOk) return run

  let status = run.status

  if (robotOk) {
    const end = ROBOT_FAULT.t + ROBOT_FAULT.hold

    status = withFaultWindow(status, ROBOT_FAULT.t, end, (equipment) => {
      const sample = ensureSample(equipment, ROBOT_FAULT.id, {
        state: 'error',
        label: 'FAULT · 모터 과열',
        count: 0,
      })

      return {
        ...equipment,
        [ROBOT_FAULT.id]: {
          ...sample,
          state: 'error',
          label: 'FAULT · 모터 과열',
        },
      }
    })
  }

  if (amrOk) {
    const end = AMR_FAULT.t + AMR_FAULT.hold

    status = withFaultWindow(status, AMR_FAULT.t, end, (equipment) => {
      const sample = ensureSample(equipment, AMR_FAULT.id, {
        state: 'moving',
        label: 'WARN · 배터리 부족',
        count: 0,
        battery: AMR_FAULT.lowBattery,
      })

      return {
        ...equipment,
        [AMR_FAULT.id]: {
          ...sample,
          battery: AMR_FAULT.lowBattery,
          label: 'WARN · 배터리 부족',
        },
      }
    })

    // 고장 구간 밖(복원 프레임 포함)도 같은 곡선으로 덮어 100% 스냅을 없앤다
    status = withAmrBatteryCurve(status, AMR_FAULT.id)
  }

  return {
    ...run,
    alarms: alarms.sort((a, b) => a.t - b.t),
    status,
  }
}
