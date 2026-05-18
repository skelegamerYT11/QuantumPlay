import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

export type ScannedGame = {
  id: string
  name: string
  exePath: string
  folderPath: string
  cover: string
  banner: string
  lastPlayed: string
  playTime: number
  favorite?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


function readRegistryValue(key: string, valueName: string): string {
  try {
    const output = execSync(`reg query "${key}" /v "${valueName}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
    const match = output.match(/REG_(?:SZ|DWORD|EXPAND_SZ)\s+(.+)/)
    return match ? match[1].trim() : ''
  } catch {
    return ''
  }
}

function safeReadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function slugId(source: string, name: string): string {
  return `${source}-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
}

// ─── Steam ────────────────────────────────────────────────────────────────────

function findSteamPath(): string {
  const regPath = readRegistryValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath')
  if (regPath && fs.existsSync(regPath)) return regPath

  const regPath2 = readRegistryValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\Valve\\Steam', 'InstallPath')
  if (regPath2 && fs.existsSync(regPath2)) return regPath2

  // Common default locations
  const defaults = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
  ]
  for (const d of defaults) {
    if (fs.existsSync(d)) return d
  }
  return ''
}

function parseSteamLibraryFolders(steamPath: string): string[] {
  const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
  const content = safeReadFile(vdfPath)
  
  const librariesSet = new Set<string>()
  librariesSet.add(path.normalize(path.join(steamPath, 'steamapps')).toLowerCase())

  // Match all "path" entries in the VDF
  const regex = /"path"\s+"([^"]+)"/gi
  let match
  while ((match = regex.exec(content)) !== null) {
    const cleanPath = match[1].replace(/\\\\/g, '\\')
    const lib = path.normalize(path.join(cleanPath, 'steamapps')).toLowerCase()
    if (fs.existsSync(lib)) {
      librariesSet.add(lib)
    }
  }

  // Map normalized paths to actual paths, filtering casing
  const result: string[] = []
  for (const lib of librariesSet) {
    // Just find standard filesystem matching casing or keep normalized
    result.push(lib)
  }
  return result
}

function parseSteamAcf(acfPath: string): { appId: string; name: string; installDir: string } | null {
  const content = safeReadFile(acfPath)
  const appId = content.match(/"appid"\s+"(\d+)"/)?.[1]
  const name = content.match(/"name"\s+"([^"]+)"/)?.[1]
  const installDir = content.match(/"installdir"\s+"([^"]+)"/)?.[1]
  if (!appId || !name || !installDir) return null
  return { appId, name, installDir }
}

function getSteamAppStats(steamPath: string, appId: string): { playTime: number; lastPlayed: string } {
  let playTime = 0
  let lastPlayed = 'Mai'

  const userdataPath = path.join(steamPath, 'userdata')
  if (fs.existsSync(userdataPath)) {
    try {
      const users = fs.readdirSync(userdataPath)
      for (const user of users) {
        const localConfig = path.join(userdataPath, user, 'config', 'localconfig.vdf')
        if (fs.existsSync(localConfig)) {
          const content = fs.readFileSync(localConfig, 'utf-8')
          
          const appBlockRegex = new RegExp(`"${appId}"\\s*\\{[^}]*?\\}`, 'gs')
          const blocks = content.match(appBlockRegex)
          if (blocks) {
            for (const block of blocks) {
              const ptMatch = block.match(/"playtime"\s*"(\d+)"/i)
              const lpMatch = block.match(/"lastplayed"\s*"(\d+)"/i)
              if (ptMatch) {
                const minutes = parseInt(ptMatch[1], 10)
                if (minutes * 60 > playTime) {
                  playTime = minutes * 60
                }
              }
              if (lpMatch) {
                const timestamp = parseInt(lpMatch[1], 10)
                if (timestamp > 0) {
                  const dateStr = new Date(timestamp * 1000).toLocaleDateString('it-IT')
                  lastPlayed = dateStr
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse Steam stats:', err)
    }
  }

  return { playTime, lastPlayed }
}

function scanSteam(): ScannedGame[] {
  const steamPath = findSteamPath()
  if (!steamPath) return []

  const games: ScannedGame[] = []
  const libraries = parseSteamLibraryFolders(steamPath)

  for (const lib of libraries) {
    if (!fs.existsSync(lib)) continue
    const acfFiles = fs.readdirSync(lib).filter(f => f.startsWith('appmanifest_') && f.endsWith('.acf'))

    for (const acf of acfFiles) {
      const data = parseSteamAcf(path.join(lib, acf))
      if (!data) continue

      const gameDir = path.join(lib, 'common', data.installDir)
      if (!fs.existsSync(gameDir)) continue

      // Find the exe in the game folder (first .exe found)
      let exePath = ''
      try {
        const exes = fs.readdirSync(gameDir).filter(f => f.endsWith('.exe'))
        if (exes.length > 0) exePath = path.join(gameDir, exes[0])
      } catch { /* empty dir */ }

      const stats = getSteamAppStats(steamPath, data.appId)

      games.push({
        id: `steam-${data.appId}`,
        name: data.name,
        exePath,
        folderPath: gameDir,
        cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${data.appId}/library_600x900_2x.jpg`,
        banner: `https://cdn.cloudflare.steamstatic.com/steam/apps/${data.appId}/library_hero.jpg`,
        lastPlayed: stats.lastPlayed,
        playTime: stats.playTime,
      })
    }
  }
  return games
}

// ─── Epic Games ───────────────────────────────────────────────────────────────

function scanEpic(): ScannedGame[] {
  const epicDataPath = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
  if (!fs.existsSync(epicDataPath)) return []

  const games: ScannedGame[] = []
  const manifestFiles = fs.readdirSync(epicDataPath).filter(f => f.endsWith('.item'))

  for (const file of manifestFiles) {
    try {
      const content = safeReadFile(path.join(epicDataPath, file))
      const data = JSON.parse(content)
      if (!data.DisplayName || !data.InstallLocation) continue

      games.push({
        id: slugId('epic', data.DisplayName),
        name: data.DisplayName,
        exePath: data.LaunchExecutable ? path.join(data.InstallLocation, data.LaunchExecutable) : '',
        folderPath: data.InstallLocation,
        cover: '',
        banner: '',
        lastPlayed: 'Mai',
        playTime: 0,
      })
    } catch { /* skip */ }
  }
  return games
}

// ─── EA App / Origin ──────────────────────────────────────────────────────────

function scanEA(): ScannedGame[] {
  const eaDataPath = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'EA Desktop', 'InstallData')
  const originDataPath = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Origin', 'LocalContent')

  const games: ScannedGame[] = []

  for (const dataPath of [eaDataPath, originDataPath]) {
    if (!fs.existsSync(dataPath)) continue
    try {
      const folders = fs.readdirSync(dataPath, { withFileTypes: true }).filter(d => d.isDirectory())
      for (const folder of folders) {
        const installPath = path.join(dataPath, folder.name)
        
        // Find best .exe inside EA folder
        let exePath = ''
        try {
          const exes = fs.readdirSync(installPath).filter(f => {
            const low = f.toLowerCase()
            return low.endsWith('.exe') && !low.includes('unins') && !low.includes('setup') && !low.includes('cleanup') && !low.includes('touchup')
          })
          if (exes.length > 0) {
            exePath = path.join(installPath, exes[0])
          }
        } catch { /* empty */ }

        games.push({
          id: slugId('ea', folder.name),
          name: folder.name,
          exePath,
          folderPath: installPath,
          cover: '',
          banner: '',
          lastPlayed: 'Mai',
          playTime: 0,
        })
      }
    } catch { /* skip */ }
  }
  return games
}

// ─── GOG Galaxy ───────────────────────────────────────────────────────────────

function scanGOG(): ScannedGame[] {
  const games: ScannedGame[] = []
  const registryKeys = [
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\GOG.com\\Games',
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\GOG.com\\Games',
  ]

  for (const regKey of registryKeys) {
    try {
      const regOutput = execSync(`reg query "${regKey}" /s /v "PATH"`, {
        encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore']
      })
      const pathMatches = regOutput.matchAll(/PATH\s+REG_SZ\s+(.+)/g)
      for (const m of pathMatches) {
        const gameDir = m[1].trim()
        if (!fs.existsSync(gameDir)) continue
        const folderName = path.basename(gameDir)

        // Find best .exe (skipping common non-game files)
        let exePath = ''
        try {
          const exes = fs.readdirSync(gameDir).filter(f => {
            const low = f.toLowerCase()
            return low.endsWith('.exe') && !low.includes('unins') && !low.includes('setup') && !low.includes('config')
          })
          if (exes.length > 0) {
            exePath = path.join(gameDir, exes[0])
          }
        } catch { /* empty */ }

        games.push({
          id: slugId('gog', folderName),
          name: folderName,
          exePath,
          folderPath: gameDir,
          cover: '',
          banner: '',
          lastPlayed: 'Mai',
          playTime: 0,
        })
      }
    } catch { /* skip key */ }
  }
  return games
}

// ─── Rockstar Games Launcher ──────────────────────────────────────────────────

function getCustomCoverUrl(gameName: string): string {
  const low = gameName.toLowerCase()
  if (low.includes('red dead') || low.includes('rdr')) {
    return 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg'
  }
  if (low.includes('grand theft auto') || low.includes('gta')) {
    return 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900_2x.jpg'
  }
  return ''
}

function getCustomBannerUrl(gameName: string): string {
  const low = gameName.toLowerCase()
  if (low.includes('red dead') || low.includes('rdr')) {
    return 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_hero.jpg'
  }
  if (low.includes('grand theft auto') || low.includes('gta')) {
    return 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_hero.jpg'
  }
  return ''
}

function scanRockstar(): ScannedGame[] {
  const games: ScannedGame[] = []
  
  // 1. Scan via Registry
  const registryParents = [
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\Rockstar Games',
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Rockstar Games',
  ]

  for (const parentKey of registryParents) {
    try {
      const subkeysOutput = execSync(`reg query "${parentKey}"`, {
        encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore']
      })
      const subkeys = subkeysOutput.split('\r\n')
        .map(line => line.trim())
        .filter(line => line.startsWith(parentKey) && !line.endsWith('Launcher') && !line.endsWith('Social Club'))

      for (const subkey of subkeys) {
        try {
          const installFolder = readRegistryValue(subkey, 'InstallFolder')
          if (installFolder && fs.existsSync(installFolder)) {
            const gameName = path.basename(subkey)
            let exePath = ''
            
            try {
              const files = fs.readdirSync(installFolder)
              const exes = files.filter(f => {
                const low = f.toLowerCase()
                return low.endsWith('.exe') && !low.includes('unins') && !low.includes('setup') && !low.includes('config') && !low.includes('launcher')
              })
              if (exes.length > 0) {
                exePath = path.join(installFolder, exes[0])
              } else {
                const directExe = path.join(installFolder, `${gameName}.exe`)
                if (fs.existsSync(directExe)) exePath = directExe
              }
            } catch { /* skip */ }

            if (exePath) {
              games.push({
                id: slugId('rockstar', gameName),
                name: gameName,
                exePath,
                folderPath: installFolder,
                cover: getCustomCoverUrl(gameName),
                banner: getCustomBannerUrl(gameName),
                lastPlayed: 'Mai',
                playTime: 0,
              })
            }
          }
        } catch { /* skip subkey */ }
      }
    } catch { /* skip parentKey */ }
  }

  // 2. Scan via common default directories (as a solid fallback)
  const defaultPaths = [
    'C:\\Program Files\\Rockstar Games',
    'C:\\Program Files (x86)\\Rockstar Games',
    'D:\\Rockstar Games',
    'E:\\Rockstar Games',
  ]
  for (const dir of defaultPaths) {
    if (fs.existsSync(dir)) {
      try {
        const folders = fs.readdirSync(dir)
        for (const folder of folders) {
          const gamePath = path.join(dir, folder)
          if (fs.statSync(gamePath).isDirectory() && folder !== 'Launcher' && folder !== 'Social Club') {
            const gameId = slugId('rockstar', folder)
            if (games.some(g => g.id === gameId)) continue

            let exePath = ''
            try {
              const files = fs.readdirSync(gamePath)
              const exes = files.filter(f => {
                const low = f.toLowerCase()
                return low.endsWith('.exe') && !low.includes('unins') && !low.includes('setup') && !low.includes('config') && !low.includes('launcher')
              })
              if (exes.length > 0) {
                exePath = path.join(gamePath, exes[0])
              }
            } catch { /* skip */ }

            if (exePath) {
              games.push({
                id: gameId,
                name: folder,
                exePath,
                folderPath: gamePath,
                cover: getCustomCoverUrl(folder),
                banner: getCustomBannerUrl(folder),
                lastPlayed: 'Mai',
                playTime: 0,
              })
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  return games
}

// ─── Main Scanner ─────────────────────────────────────────────────────────────

export function scanAllGames(): ScannedGame[] {
  const results: ScannedGame[] = []
  results.push(...scanSteam())
  results.push(...scanEpic())
  results.push(...scanEA())
  results.push(...scanGOG())
  results.push(...scanRockstar())
  return results
}
