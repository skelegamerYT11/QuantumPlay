import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export type Game = {
  id: string;
  name: string;
  exePath: string;
  folderPath: string;
  cover: string;
  banner: string;
  lastPlayed: string;
  playTime: number; // in seconds
};

export type AppSettings = {
  theme?: string;
  customBg?: string;
  customText?: string;
  customAccent?: string;
  loginItem?: boolean;
  minimizeToTray?: boolean;
  sortOrder?: string;
};

export class Database {
  private dbPath: string;
  private data: { games: Game[]; settings?: AppSettings };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'games.json');
    this.data = { games: [], settings: {} };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (!this.data.games) this.data.games = [];
        if (!this.data.settings) this.data.settings = {};

        // Deduplicate games on load
        const seen = new Set<string>();
        const uniqueGames: Game[] = [];
        for (const g of this.data.games) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            uniqueGames.push(g);
          }
        }
        if (uniqueGames.length !== this.data.games.length) {
          this.data.games = uniqueGames;
          this.save();
        }
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Error loading DB:', error);
      this.data = { games: [], settings: {} };
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving DB:', error);
    }
  }

  public getGames(): Game[] {
    return this.data.games;
  }

  public setGamesOrder(orderedIds: string[]) {
    const gameMap = new Map(this.data.games.map(g => [g.id, g]));
    const orderedGames: Game[] = [];
    for (const id of orderedIds) {
      const game = gameMap.get(id);
      if (game) {
        orderedGames.push(game);
        gameMap.delete(id);
      }
    }
    for (const game of gameMap.values()) {
      orderedGames.push(game);
    }
    this.data.games = orderedGames;
    this.save();
  }

  public addGame(game: Game) {
    this.data.games.push(game);
    this.save();
  }

  public updateGame(id: string, updates: Partial<Game>) {
    const index = this.data.games.findIndex(g => g.id === id);
    if (index !== -1) {
      this.data.games[index] = { ...this.data.games[index], ...updates };
      this.save();
    }
  }

  public deleteGame(id: string) {
    this.data.games = this.data.games.filter(g => g.id !== id);
    this.save();
  }

  public getSettings(): AppSettings {
    if (!this.data.settings) {
      this.data.settings = {};
    }
    return this.data.settings;
  }

  public updateSettings(settings: AppSettings) {
    if (!this.data.settings) {
      this.data.settings = {};
    }
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }
}

export const db = new Database();
