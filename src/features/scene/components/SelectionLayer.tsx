import { useMonitorView } from '@/shared/hooks/useMonitorView'
import { useUi } from '@/shared/hooks/useUi'

import SelectionCallout3D from './SelectionCallout3D'
import SelectionHighlight from './SelectionHighlight'
import StatusVisibility from './StatusVisibility'

/** Canvas 안: 선택/호버 외곽 + (메인) 선택 콜아웃 + 상태 필터 */
export default function SelectionLayer() {
  const { selectedId, labelsVisible } = useUi()

  const view = useMonitorView()

  return (
    <>
      <SelectionHighlight />

      <StatusVisibility />

      {view === 'main' && labelsVisible && selectedId && <SelectionCallout3D id={selectedId} />}
    </>
  )
}
