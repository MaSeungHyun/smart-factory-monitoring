const { app, BrowserWindow, ipcMain, protocol } = require('electron')
const path = require('node:path')

const { createSplashWindow } = require('./splashWindow.cjs')

protocol.registerSchemesAsPrivileged([
  // fetch · 워커 · wasm(basis transcoder) · 데이터 청크가 배포 exe 안의 dist 에서 그대로 읽히도록 권한을 연다
  { scheme: 'monitor', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
])

/**
 * 렌더러가 준비 신호를 보내지 않아도(로딩 오류 등) 첫 페인트 뒤 이 시간(ms)이 지나면 메인 창을 띄운다.
 * 개발 모드에서 3D 준비까지 약 10~12초 걸려서 여유를 둔다
 */
const MAIN_READY_TIMEOUT_MS = 20_000

/** 렌더러가 첫 화면 준비를 알리는 IPC 채널 (electron/preload.cjs 와 같아야 한다) */
const READY_CHANNEL = 'monitor:renderer-ready'

/** 메인 창이 실제 로딩 진행률(0~100)을 보내는 IPC 채널 (electron/preload.cjs 와 같아야 한다) */
const PROGRESS_CHANNEL = 'monitor:loading-progress'

/** 스플래시가 100% 를 채우고 알려 오기를 기다리는 최대 시간 (ms). 응답이 없어도 이 시간이 지나면 메인 창을 띄운다 */
const SPLASH_FINISH_TIMEOUT_MS = 1500

/** 배포 exe 의 userData 폴더 이름 (%APPDATA% 아래). 개발용 `electron .` 과 캐시 폴더를 나눠 같은 PC 에서 함께 켜도 캐시 잠금이 충돌하지 않는다 */
const PACKAGED_USER_DATA_DIR = 'GRAPICAR Smart Factory Monitoring'

if (app.isPackaged) app.setPath('userData', path.join(app.getPath('appData'), PACKAGED_USER_DATA_DIR))

let mainWindow = null
let splash = null

// exe 를 두 번 실행하면 창을 새로 띄우지 않고 이미 켜진 창을 앞으로 가져온다
const hasInstanceLock = app.requestSingleInstanceLock()

if (!hasInstanceLock) app.quit()

app.on('second-instance', () => {
  const window = mainWindow && mainWindow.isVisible() ? mainWindow : splash
  if (!window || window.isDestroyed()) return

  if (window.isMinimized()) window.restore()
  window.focus()
})

let painted = false
let rendererReady = false
let revealed = false
let revealWaiters = []

/** 메인 창이 첫 페인트를 마치고 렌더러도 준비를 알렸을 때만 보여 주고 스플래시를 닫는다 */
function revealMainWindow() {
  if (revealed || !painted || !rendererReady || !mainWindow || mainWindow.isDestroyed()) return

  revealed = true

  // 스플래시 진행률을 100% 까지 채운 뒤에 메인 창으로 넘어간다
  finishSplash().then(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    mainWindow.show()
    mainWindow.focus()

    // 숨김 상태 로딩용으로 껐던 백그라운드 스로틀링을 원래대로 되돌린다
    mainWindow.webContents.setBackgroundThrottling(true)

    if (splash && !splash.isDestroyed()) splash.close()

    for (const resolve of revealWaiters) resolve()
    revealWaiters = []
  })
}

/** 스플래시 창에 100% 채우기를 요청하고 끝날 때까지 기다린다. 스플래시가 없거나 응답이 없으면 바로(또는 시간 초과 뒤) 넘어간다 */
function finishSplash() {
  if (!splash || splash.isDestroyed()) return Promise.resolve()

  const finish = splash.webContents
    .executeJavaScript('window.__splashFinish ? window.__splashFinish() : null', true)
    .catch(() => undefined)

  const timeout = new Promise((resolve) => setTimeout(resolve, SPLASH_FINISH_TIMEOUT_MS))

  return Promise.race([finish, timeout])
}

function markRendererReady() {
  if (rendererReady) return

  rendererReady = true
  revealMainWindow()
}

function devServerUrl() {
  if (app.isPackaged || !process.env.MONITOR_DEV_URL) return null

  const url = new URL(process.env.MONITOR_DEV_URL)
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
    throw new Error('The Electron dev server must use HTTP on 127.0.0.1')
  }
  url.searchParams.set('electron', '1')
  return url
}

/** 메인 창과 스플래시 창이 같은 렌더러를 쓴다. 스플래시는 ?splash=1 로 구분한다 */
function loadRenderer(window, isSplash = false) {
  const devUrl = devServerUrl()
  const url = devUrl ?? new URL('monitor://app/')
  if (isSplash) url.searchParams.set('splash', '1')

  return window.loadURL(url.href)
}

function lockNavigation(window) {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
}

async function createMainWindow() {
  const isMac = process.platform === 'darwin'
  const window = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1400,
    minHeight: 771,
    show: false,
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#121417',
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    titleBarOverlay: isMac ? true : {
      color: '#121417',
      symbolColor: '#f2f5f6',
      height: 32,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 숨긴 채로 로딩하는 동안에도 프레임 · 타이머가 돌아야 3D 준비가 끝난다
      backgroundThrottling: false,
    },
  })
  mainWindow = window

  lockNavigation(window)

  window.once('ready-to-show', () => {
    painted = true
    revealMainWindow()

    setTimeout(() => {
      if (mainWindow === window) markRendererReady()
    }, MAIN_READY_TIMEOUT_MS)
  })

  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null
  })

  await loadRenderer(window)
}

ipcMain.handle(READY_CHANNEL, (event) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) {
    throw new Error('Unauthorized renderer-ready request')
  }

  markRendererReady()
  if (revealed) return

  // 창이 실제로 보일 때 응답해서, 렌더러가 인트로를 숨은 창에서 시작하지 않게 한다
  return new Promise((resolve) => revealWaiters.push(resolve))
})

// 메인 창 진행률을 스플래시 창으로 넘긴다. 숫자만 받아 0~100 으로 자른다
ipcMain.on(PROGRESS_CHANNEL, (event, value) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) return

  if (typeof value !== 'number' || !Number.isFinite(value) || !splash || splash.isDestroyed()) return

  const percent = Math.max(0, Math.min(100, value))

  splash.webContents
    .executeJavaScript(`window.__splashProgress && window.__splashProgress(${percent})`, true)
    .catch(() => undefined)
})

function start() {
  painted = false
  rendererReady = false
  revealed = false
  revealWaiters = []

  const window = createSplashWindow(loadRenderer, lockNavigation)
  splash = window
  window.once('closed', () => {
    if (splash === window) splash = null
  })

  // 스플래시 뒤에서 메인 창을 숨긴 채 함께 로딩한다
  createMainWindow().catch((error) => {
    console.error('Failed to open the monitoring window:', error)
    app.exit(1)
  })
}

app.whenReady().then(() => {
  if (!hasInstanceLock) return

  protocol.registerSource('monitor', {
    routes: [{
      match: { host: 'app' },
      source: { type: 'directory', root: path.join(app.getAppPath(), 'dist'), index: 'index.html' },
    }],
  })

  start()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) start()
  })
}).catch((error) => {
  console.error('Failed to initialize the monitoring app:', error)
  app.exit(1)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
