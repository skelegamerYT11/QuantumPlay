import { contextBridge, ipcRenderer } from 'electron'

// Expose a typed IPC bridge to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Games
  getGames: () => ipcRenderer.invoke('get-games'),
  addGame: (game: unknown) => ipcRenderer.invoke('add-game', game),
  updateGame: (id: string, updates: unknown) => ipcRenderer.invoke('update-game', id, updates),
  deleteGame: (id: string) => ipcRenderer.invoke('delete-game', id),
  scanGames: () => ipcRenderer.invoke('scan-games'),

  // Play
  playGame: (id: string) => ipcRenderer.invoke('play-game', id),

  // File system
  pickFile: (filters: unknown) => ipcRenderer.invoke('pick-file', filters),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),

  // System
  setLoginItem: (enabled: boolean) => ipcRenderer.invoke('set-login-item', enabled),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: unknown) => ipcRenderer.invoke('update-settings', settings),
  uninstallApp: (deleteData: boolean) => ipcRenderer.invoke('uninstall-app', deleteData),

  // Listeners
  onGameUpdated: (cb: () => void) => {
    ipcRenderer.on('game-updated', cb)
    return () => ipcRenderer.off('game-updated', cb)
  },
})
