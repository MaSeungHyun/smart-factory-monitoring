const { contextBridge, ipcRenderer } = require('electron')

/** electron/main.cjs 의 READY_CHANNEL 과 같아야 한다 */
const READY_CHANNEL = 'monitor:renderer-ready'

contextBridge.exposeInMainWorld('electronApp', {
  /** 첫 화면 준비 완료를 알린다. 메인 창이 실제로 보이면 resolve 된다 */
  ready: () => ipcRenderer.invoke(READY_CHANNEL).then(() => undefined),
})
