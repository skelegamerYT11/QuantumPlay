/// <reference types="vite/client" />

interface ElectronAPI {
  getGames: () => Promise<unknown[]>
  addGame: (game: unknown) => Promise<boolean>
  updateGame: (id: string, updates: unknown) => Promise<boolean>
  setGamesOrder: (orderedIds: string[]) => Promise<boolean>
  deleteGame: (id: string) => Promise<boolean>
  scanGames: () => Promise<{ total: number; added: number }>
  playGame: (id: string) => Promise<{ ok: boolean; reason?: string }>
  stopGame: (id: string) => Promise<boolean>
  pickFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  pickImage: () => Promise<string | null>
  openFolder: (folderPath: string) => Promise<void>
  setLoginItem: (enabled: boolean) => Promise<boolean>
  getSettings: () => Promise<any>
  updateSettings: (settings: any) => Promise<boolean>
  uninstallApp: (deleteData: boolean) => Promise<boolean>
  onGameUpdated: (cb: () => void) => () => void
}

interface Window {
  electronAPI?: ElectronAPI
  // legacy ipcRenderer kept for compat
  ipcRenderer?: import('electron').IpcRenderer
}
