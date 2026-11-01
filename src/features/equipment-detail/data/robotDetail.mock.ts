/** 재생 데이터에 없는 값 (로봇 시뮬레이터가 내보내지 않음) — 디자인 시안 값 */
export const ROBOT_TARGET = 12

export const MOTOR_TEMP = { value: 42, limit: 60 }

export const MOTOR_CURRENT = { value: 3.8, label: '정상' }

export const SUCCESS_TARGET = 99

export const CAMERA_INSET = {
  title: '3D 카메라 뷰 (비전 인식)',
  meta: 'CAM-02 · 30fps',
  boxes: [
    { label: 'BOX 96%', left: 6, top: 22, width: 60, height: 44, warn: false },
    { label: 'BOX 98%', left: 78, top: 14, width: 72, height: 48, warn: false },
    { label: 'BOX 95%', left: 168, top: 22, width: 56, height: 40, warn: false },
    { label: 'BOX 96%', left: 30, top: 92, width: 64, height: 48, warn: false },
    { label: '제한 필요', left: 112, top: 100, width: 58, height: 44, warn: true },
    { label: 'BOX 97%', left: 190, top: 92, width: 62, height: 46, warn: false },
  ],
}
