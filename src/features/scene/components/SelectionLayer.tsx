import { useMonitorState } from '@/shared/stores/useMonitorViewStore'
import { useUi } from '@/shared/stores/useUiStore'

import HoverCallout3D from './HoverCallout3D'
import SelectionCallout3D from './SelectionCallout3D'
import SelectionHighlight from './SelectionHighlight'
import StatusVisibility from './StatusVisibility'

/** 장비 상세 리더 카드 / 스캔 콜아웃이 같은 장비를 보여 주면 선택 콜아웃은 겹치지 않는다 */
function detailCardOwns(view: string, id: string, detailId: string, scannerId: string) {
  if (view === 'scan') return id === scannerId

  return view === 'robot' && id === detailId && (id.startsWith('robot-') || id.startsWith('amr-'))
}

/** Canvas 안: 선택/호버 외곽 + 콜아웃 + 상태 필터. 호버는 한 줄, 클릭은 더 자세한 카드 */
export default function SelectionLayer() {
  const { selectedId } = useUi()

  const { view, robotId, scannerId } = useMonitorState()

  const showSelection = selectedId !== null && !detailCardOwns(view, selectedId, robotId, scannerId)

  return (
    <>
      <SelectionHighlight />

      <StatusVisibility />

      <HoverCallout3D />

      {showSelection && <SelectionCallout3D id={selectedId} />}
    </>
  )
}
