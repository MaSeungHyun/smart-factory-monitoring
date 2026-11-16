const { BrowserWindow } = require('electron')

/** 스플래시 창 크기 (px, 16:9) */
const SPLASH_SIZE = { width: 800, height: 450 }

/** 처음 뜰 때 다른 앱 위에 머무는 시간 (ms). 지나거나 다른 창을 누르면 평소처럼 쌓인다 */
const SPLASH_ON_TOP_MS = 1500

/** 메인 창이 숨은 채 로딩하는 동안 보여 주는 프레임 없는 창 */
function createSplashWindow(loadRenderer, lockNavigation) {
  const splash = new BrowserWindow({
    ...SPLASH_SIZE,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#0a0b0d',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  lockNavigation(splash)

  splash.once('ready-to-show', () => {
    splash.setAlwaysOnTop(true)
    splash.show()
    splash.focus()
    splash.moveTop()

    const release = () => {
      clearTimeout(timer)
      if (!splash.isDestroyed()) splash.setAlwaysOnTop(false)
    }
    const timer = setTimeout(release, SPLASH_ON_TOP_MS)
    splash.once('blur', release)
  })

  Promise.resolve().then(() => loadRenderer(splash, true)).catch((error) => {
    console.error('Failed to open the splash window:', error)
    if (!splash.isDestroyed()) splash.close()
  })

  return splash
}

module.exports = { createSplashWindow }
