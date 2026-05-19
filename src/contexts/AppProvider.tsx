import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../i18n';

// ─── Types ───────────────────────────────────────────────────────────────────
export type Game = {
  id: string;
  name: string;
  exePath: string;
  folderPath: string;
  cover: string;
  banner: string;
  lastPlayed: string;
  playTime: number; // seconds
  running?: boolean;
  category?: string | null;
  favorite?: boolean;
};

type AppContextType = {
  theme: string;
  setTheme: (t: string) => void;
  games: Game[];
  setGames: (g: Game[]) => void;
  language: string;
  setLanguage: (l: string) => void;
  t: (key: string) => string;
  isElectron: boolean;
  refreshGames: () => Promise<void>;
  customBg: string;
  setCustomBg: (v: string) => void;
  customText: string;
  setCustomText: (v: string) => void;
  customAccent: string;
  setCustomAccent: (v: string) => void;
  minimizeToTray: boolean;
  setMinimizeToTray: (v: boolean) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function adjustBrightness(hex: string, percent: number): string {
  let R = parseInt(hex.substring(1, 3), 16) || 0;
  let G = parseInt(hex.substring(3, 5), 16) || 0;
  let B = parseInt(hex.substring(5, 7), 16) || 0;

  R = Math.max(0, Math.min(255, R + percent));
  G = Math.max(0, Math.min(255, G + percent));
  B = Math.max(0, Math.min(255, B + percent));

  const rHex = Math.round(R).toString(16).padStart(2, '0');
  const gHex = Math.round(G).toString(16).padStart(2, '0');
  const bHex = Math.round(B).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// ─── Provider ────────────────────────────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('qp_theme') || 'blue');
  const [language, setLanguage] = useState(() => localStorage.getItem('qp_lang') || 'en');
  const [games, setGames] = useState<Game[]>([]);

  const [customBg, setCustomBg] = useState(() => localStorage.getItem('qp_custom_bg') || '#0f172a');
  const [customText, setCustomText] = useState(() => localStorage.getItem('qp_custom_text') || '#f8fafc');
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('qp_custom_accent') || '#3b82f6');
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>(() => localStorage.getItem('qp_sort_order') || 'az');

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  // Initial settings load from Electron DB
  useEffect(() => {
    if (!isElectron) return;
    window.electronAPI!.getSettings().then((savedSettings: any) => {
      if (savedSettings) {
        if (savedSettings.theme) setTheme(savedSettings.theme);
        if (savedSettings.customBg) setCustomBg(savedSettings.customBg);
        if (savedSettings.customText) setCustomText(savedSettings.customText);
        if (savedSettings.customAccent) setCustomAccent(savedSettings.customAccent);
        if (savedSettings.minimizeToTray !== undefined) setMinimizeToTray(savedSettings.minimizeToTray);
        if (savedSettings.sortOrder) setSortOrder(savedSettings.sortOrder);
      }
    }).catch((err: any) => console.error('Failed to load settings:', err));
  }, [isElectron]);

  // Persist theme
  useEffect(() => {
    if (theme === 'custom') {
      document.documentElement.setAttribute('data-theme', 'custom');
      const root = document.documentElement;
      root.style.setProperty('--bg-primary', customBg);
      root.style.setProperty('--bg-secondary', adjustBrightness(customBg, -15));
      root.style.setProperty('--bg-sidebar', customBg + 'ee');
      root.style.setProperty('--text-primary', customText);
      root.style.setProperty('--text-secondary', adjustBrightness(customText, -30));
      root.style.setProperty('--accent-color', customAccent);
      root.style.setProperty('--accent-gradient', `linear-gradient(90deg, ${customAccent} 0%, ${adjustBrightness(customAccent, 35)} 100%)`);
      root.style.setProperty('--play-button', `linear-gradient(to right, ${customAccent} 0%, ${adjustBrightness(customAccent, 35)} 100%)`);
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.04)');
      root.style.setProperty('--card-hover', 'rgba(255, 255, 255, 0.1)');

      localStorage.setItem('qp_custom_bg', customBg);
      localStorage.setItem('qp_custom_text', customText);
      localStorage.setItem('qp_custom_accent', customAccent);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      const root = document.documentElement;
      root.style.removeProperty('--bg-primary');
      root.style.removeProperty('--bg-secondary');
      root.style.removeProperty('--bg-sidebar');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-secondary');
      root.style.removeProperty('--accent-color');
      root.style.removeProperty('--accent-gradient');
      root.style.removeProperty('--play-button');
      root.style.removeProperty('--border-color');
      root.style.removeProperty('--card-bg');
      root.style.removeProperty('--card-hover');
    }
    localStorage.setItem('qp_theme', theme);
    if (isElectron) {
      window.electronAPI!.updateSettings({
        theme,
        customBg,
        customText,
        customAccent
      }).catch((err: any) => console.error('Failed to save settings:', err));
    }
  }, [theme, customBg, customText, customAccent, isElectron]);

  // Persist language
  useEffect(() => {
    localStorage.setItem('qp_lang', language);
  }, [language]);

  // Persist sortOrder
  useEffect(() => {
    localStorage.setItem('qp_sort_order', sortOrder);
    if (isElectron) {
      window.electronAPI!.updateSettings({
        sortOrder
      }).catch((err: any) => console.error('Failed to save sortOrder:', err));
    }
  }, [sortOrder, isElectron]);

  // Translation helper
  const t = useCallback((key: string): string => {
    const dict = (translations[language] ?? translations['en']) as Record<string, string>;
    return dict[key] ?? (translations['en'] as Record<string, string>)[key] ?? key;
  }, [language]);

  // Load games from Electron DB
  const refreshGames = useCallback(async () => {
    if (isElectron) {
      const data = await window.electronAPI!.getGames();
      setGames(data as Game[]);
    }
  }, [isElectron]);

  useEffect(() => {
    if (!isElectron) return;

    // Initial load
    refreshGames();

    // Listen for updates from main process
    const unsub = window.electronAPI!.onGameUpdated(refreshGames);
    return unsub;
  }, [isElectron, refreshGames]);

  // Automatic background refresh / sync every 30 seconds
  useEffect(() => {
    if (!isElectron) return;
    const interval = setInterval(async () => {
      try {
        await window.electronAPI!.scanGames();
      } catch (err) {
        console.error('Background auto-scan failed:', err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isElectron]);

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      games,
      setGames,
      language,
      setLanguage,
      t,
      isElectron,
      refreshGames,
      customBg,
      setCustomBg,
      customText,
      setCustomText,
      customAccent,
      setCustomAccent,
      minimizeToTray,
      setMinimizeToTray,
      sortOrder,
      setSortOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
