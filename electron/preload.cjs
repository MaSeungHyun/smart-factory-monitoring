const { contextBridge, ipcRenderer } = require('electron')

/** electron/main.cjs 의 READY_CHANNEL 과 같아야 한다 */
const READY_CHANNEL = 'monitor:renderer-ready'

/** electron/main.cjs 의 PROGRESS_CHANNEL 과 같아야 한다 */
const PROGRESS_CHANNEL = 'monitor:loading-progress'

contextBridge.exposeInMainWorld('electronApp', {
  /** 첫 화면 준비 완료를 알린다. 메인 창이 실제로 보이면 resolve 된다 */
  ready: () => ipcRenderer.invoke(READY_CHANNEL).then(() => undefined),

  /** 숨은 메인 창의 실제 로딩 진행률(0~100)을 스플래시 창에 전달한다 */
  progress: (value) => ipcRenderer.send(PROGRESS_CHANNEL, Number(value)),
})
