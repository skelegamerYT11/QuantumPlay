import { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { db } from './db'
import { scanAllGames } from './scanner'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
}

// ─── Window ──────────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC!, 'app_icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('close', (event) => {
    if (!(app as any).isQuitting) {
      const settings = db.getSettings()
      const minimizeToTray = settings.minimizeToTray !== false // default to true
      if (minimizeToTray) {
        event.preventDefault()
        win?.hide()
      } else {
        (app as any).isQuitting = true
        app.quit()
      }
    }
  })
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else {
    win?.show()
  }
})

app.whenReady().then(() => {
  createWindow()

  // System Tray
  const iconPath = path.join(process.env.VITE_PUBLIC!, 'app_icon.png')
  tray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Apri Quantum Play', click: () => win?.show() },
    {
      label: 'Esci', click: () => {
        ;(app as any).isQuitting = true
        app.quit()
      }
    },
  ])
  tray.setToolTip('Quantum Play')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win?.isVisible() ? win.hide() : win?.show()
  })
})

// ─── IPC: Games CRUD ─────────────────────────────────────────────────────────
const activeProcesses: Record<string, { startTime: number; child?: any }> = {}

function isProcessRunning(exeName: string): boolean {
  try {
    const { execSync } = require('node:child_process')
    const output = execSync(`tasklist /FI "IMAGENAME eq ${exeName}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    })
    return output.toLowerCase().includes(exeName.toLowerCase())
  } catch {
    return false
  }
}

ipcMain.handle('get-games', async () => {
  const games = db.getGames()
  let hasChanges = false

  const mapped = games.map(g => {
    let isRunning = !!activeProcesses[g.id]

    if (g.exePath) {
      const exeName = path.basename(g.exePath)
      if (exeName && exeName.endsWith('.exe')) {
        const inTasklist = isProcessRunning(exeName)
        if (inTasklist) {
          isRunning = true
          if (!activeProcesses[g.id]) {
            activeProcesses[g.id] = { startTime: Date.now() }
            hasChanges = true
          }
        } else {
          if (activeProcesses[g.id]) {
            const proc = activeProcesses[g.id]
            const played = Math.floor((Date.now() - proc.startTime) / 1000)
            delete activeProcesses[g.id]
            
            const current = db.getGames().find(game => game.id === g.id)
            if (current) {
              db.updateGame(g.id, {
                playTime: (current.playTime || 0) + played,
                lastPlayed: new Date().toLocaleDateString('it-IT'),
              })
            }
            hasChanges = true
            isRunning = false
          }
        }
      }
    }

    return {
      ...g,
      running: isRunning
    }
  })

  if (hasChanges) {
    setImmediate(() => {
      win?.webContents.send('game-updated')
    })
  }

  return mapped
})

ipcMain.handle('add-game', async (_, game) => {
  db.addGame(game)
  return true
})

ipcMain.handle('update-game', async (_, id, updates) => {
  db.updateGame(id, updates)
  win?.webContents.send('game-updated')
  return true
})

ipcMain.handle('get-settings', async () => {
  return db.getSettings()
})

ipcMain.handle('update-settings', async (_, settings) => {
  db.updateSettings(settings)
  return true
})

ipcMain.handle('delete-game', async (_, id) => {
  db.deleteGame(id)
  return true
})

ipcMain.handle('uninstall-app', async (_, deleteData: boolean) => {
  const userDataPath = app.getPath('userData')
  if (deleteData) {
    try {
      // 1. Delete the database file synchronously (never locked, always unlinks cleanly)
      const dbPath = path.join(userDataPath, 'games.json')
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
      }
      // 2. Spawn a detached cmd script that waits 2 seconds (giving Electron time to close and release locks)
      // and then deletes the entire AppData/Roaming/QuantumPlay directory cleanly
      const cmd = `timeout /t 2 /nobreak && rmdir /s /q "${userDataPath}"`
      spawn('cmd.exe', ['/c', cmd], {
        detached: true,
        stdio: 'ignore',
        shell: true
      }).unref()
    } catch (err) {
      console.error('Errore durante la rimozione dei dati utente:', err)
    }
  }

  const uninstallerName = 'Uninstall QuantumPlay.exe'
  const uninstallerPath = path.join(path.dirname(process.execPath), uninstallerName)
  if (fs.existsSync(uninstallerPath)) {
    spawn(uninstallerPath, [], { detached: true, stdio: 'ignore' }).unref()
    ;(app as any).isQuitting = true
    app.quit()
  } else {
    ;(app as any).isQuitting = true
    app.quit()
  }
  return true
})

// ─── IPC: First-boot Scan ────────────────────────────────────────────────────
ipcMain.handle('scan-games', async () => {
  const scanned = scanAllGames()
  const scannedIds = new Set(scanned.map(g => g.id))
  const existing = db.getGames()
  const existingIds = new Set(existing.map(g => g.id))

  let added = 0
  let removed = 0

  // 1. Add newly detected games
  for (const game of scanned) {
    if (!existingIds.has(game.id)) {
      db.addGame(game)
      added++
    }
  }

  // 2. Remove games that were auto-scanned previously but are no longer present
  for (const game of existing) {
    const isAutoScanned = !game.id.startsWith('manual-')
    if (isAutoScanned && !scannedIds.has(game.id)) {
      db.deleteGame(game.id)
      removed++
    }
  }

  // Notify renderer that the database changed
  if (added > 0 || removed > 0) {
    win?.webContents.send('game-updated')
  }

  return { total: scanned.length, added, removed }
})

// ─── IPC: File / Folder Pickers ──────────────────────────────────────────────
ipcMain.handle('pick-file', async (_, filters) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters || [],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('pick-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Immagini', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
    ]
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    try {
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      let mimeType = 'image/jpeg'
      if (ext === '.png') mimeType = 'image/png'
      if (ext === '.webp') mimeType = 'image/webp'
      if (ext === '.gif') mimeType = 'image/gif'
      return `data:${mimeType};base64,${buffer.toString('base64')}`
    } catch (e) {
      console.error('Failed to read image:', e)
      return null
    }
  }
  return null
})

ipcMain.handle('open-folder', async (_, folderPath: string) => {
  if (folderPath) {
    await shell.openPath(folderPath)
  }
})

// ─── IPC: Play Game & Track Time ─────────────────────────────────────────────
ipcMain.handle('play-game', async (_, id: string) => {
  const game = db.getGames().find(g => g.id === id)
  if (!game?.exePath) return { ok: false, reason: 'no_exe' }
  if (activeProcesses[id]) return { ok: false, reason: 'already_running' }

  try {
    const child = spawn(game.exePath, [], {
      cwd: game.folderPath || path.dirname(game.exePath),
      detached: true,
      stdio: 'ignore',
    })
    child.unref()

    activeProcesses[id] = { startTime: Date.now(), child }
    // Instantly notify renderer that game is now running!
    win?.webContents.send('game-updated')

    child.on('exit', () => {
      const proc = activeProcesses[id]
      if (proc) {
        const played = Math.floor((Date.now() - proc.startTime) / 1000)
        delete activeProcesses[id]

        const current = db.getGames().find(g => g.id === id)
        if (current) {
          db.updateGame(id, {
            playTime: (current.playTime || 0) + played,
            lastPlayed: new Date().toLocaleDateString('it-IT'),
          })
        }
        win?.webContents.send('game-updated')
      }
    })

    return { ok: true }
  } catch (err) {
    console.error('play-game error:', err)
    delete activeProcesses[id]
    return { ok: false, reason: String(err) }
  }
})

ipcMain.handle('stop-game', async (_, id: string) => {
  const game = db.getGames().find(g => g.id === id)
  const proc = activeProcesses[id]
  
  const { exec } = await import('node:child_process')

  // 1. Kill by executable name if present (bulletproof for launcher-spawned games)
  if (game && game.exePath) {
    const exeName = path.basename(game.exePath)
    if (exeName && exeName.endsWith('.exe')) {
      console.log(`Stopping game by image name: ${exeName}`)
      exec(`taskkill /IM "${exeName}" /F /T`, (err) => {
        if (err) console.error(`Failed to kill image ${exeName}:`, err)
      })
    }
  }

  // 2. Kill by process PID if we have it in activeProcesses
  if (proc && proc.child) {
    const pid = proc.child.pid
    if (pid) {
      console.log(`Stopping game by PID: ${pid}`)
      exec(`taskkill /pid ${pid} /F /T`, (err) => {
        if (err) {
          try {
            proc.child.kill('SIGKILL')
          } catch (e) {
            console.error('SIGKILL fallback failed:', e)
          }
        }
      })
    } else {
      try {
        proc.child.kill('SIGKILL')
      } catch (e) {
        console.error('Kill failed:', e)
      }
    }
  }

  // 3. Finalize playtime tracking
  if (activeProcesses[id]) {
    const played = Math.floor((Date.now() - activeProcesses[id].startTime) / 1000)
    delete activeProcesses[id]
    
    if (game) {
      db.updateGame(id, {
        playTime: (game.playTime || 0) + played,
        lastPlayed: new Date().toLocaleDateString('it-IT'),
      })
    }
  }

  win?.webContents.send('game-updated')
  return true
})

// ─── IPC: System Settings ────────────────────────────────────────────────────
ipcMain.handle('set-login-item', async (_, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled })
  return true
})
