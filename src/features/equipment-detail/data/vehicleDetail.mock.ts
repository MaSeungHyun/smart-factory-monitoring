/** 재생 데이터에 없는 구동 값. AGV 오류 시안(모터 부하 138% · 78°C · 9.6A)을 고장일 때만 쓴다. */

export const AGV_TARGET = 120

export const TEMP_LIMIT = 60

export const LOAD_LIMIT = 100

export function motorLoad(errored: boolean, speed: number) {
  if (errored) return 138

  return Math.min(96, Math.round(32 + speed * 24))
}

export function motorTemp(errored: boolean) {
  return errored ? 78 : 42
}

export function motorCurrent(errored: boolean) {
  return errored ? { value: 9.6, label: '과부하' } : { value: 3.8, label: '정상' }
}
