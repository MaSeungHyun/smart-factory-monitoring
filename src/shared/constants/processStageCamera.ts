/** 공정 흐름 카드(id) → 숫자 키 1~9 카메라 시점 (화면에 보이는 번호와 동일, bookmarks[0] = 1번) */
export const PROCESS_STAGE_CAMERA_BOOKMARK = {
  inbound: 2,
  conveyor: 3,
  scan: 5,
  pallet: 7,
  amr: 8,
  outbound: 9,
} as const

export type ProcessStageCameraBookmarkId = keyof typeof PROCESS_STAGE_CAMERA_BOOKMARK

/** 위치를 먼저 옮긴 뒤 제자리에서 회전하는 시점 번호. 동시 보간이면 벽을 뚫는 것처럼 보일 때 쓴다 */
export const MOVE_THEN_TURN_CAMERA_BOOKMARKS = new Set<number>([
  PROCESS_STAGE_CAMERA_BOOKMARK.inbound,
])

/** 공정 흐름 카드 id 에 해당하는 카메라 시점 번호. 없으면 undefined */
export function processStageCameraBookmark(stageId: string) {
  if (stageId in PROCESS_STAGE_CAMERA_BOOKMARK) {
    return PROCESS_STAGE_CAMERA_BOOKMARK[stageId as ProcessStageCameraBookmarkId]
  }
}

/** 해당 시점 번호가 이동 후 회전인지 */
export function cameraBookmarkMoveThenTurn(slot: number) {
  return MOVE_THEN_TURN_CAMERA_BOOKMARKS.has(slot)
}
