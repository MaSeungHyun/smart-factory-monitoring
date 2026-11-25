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

/** 공정 흐름 카드 id 에 해당하는 카메라 시점 번호. 없으면 undefined */
export function processStageCameraBookmark(stageId: string) {
  if (stageId in PROCESS_STAGE_CAMERA_BOOKMARK) {
    return PROCESS_STAGE_CAMERA_BOOKMARK[stageId as ProcessStageCameraBookmarkId]
  }
}
