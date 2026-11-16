const { app, BrowserWindow, protocol } = require('electron')
const path = require('node:path')

protocol.registerSchemesAsPrivileged([
  { scheme: 'monitor', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

async function createWindow() {
  const isMac = process.platform === 'darwin'
  const window = new BrowserWindow({
    width: 1600,
    height: 1000,
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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  await window.loadURL('monitor://app/')
}

function openWindow() {
  createWindow().catch((error) => {
    console.error('Failed to open the monitoring window:', error)
    app.exit(1)
  })
}

app.whenReady().then(() => {
  protocol.registerSource('monitor', {
    routes: [{
      match: { host: 'app' },
      source: { type: 'directory', root: path.join(app.getAppPath(), 'dist'), index: 'index.html' },
    }],
  })

  openWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindow()
  })
}).catch((error) => {
  console.error('Failed to initialize the monitoring app:', error)
  app.exit(1)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
