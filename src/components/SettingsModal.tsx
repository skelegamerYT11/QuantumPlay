import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppProvider';
import { BaseModal } from './BaseModal';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, language, setLanguage, t, refreshGames } = useAppContext();
  const [loginItem, setLoginItem] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    if (!window.electronAPI) return;
    setScanning(true);
    try {
      const result = await window.electronAPI.scanGames();
      alert(`Scansione completata!\nGiochi scansionati: ${result.total}\nNuovi giochi aggiunti alla libreria: ${result.added}`);
      await refreshGames();
    } catch (e) {
      alert('Scansione fallita: ' + e);
    } finally {
      setScanning(false);
    }
  };

  const themes = [
    { id: 'blue', label: '🔵 Azzurro (Steam)' },
    { id: 'black', label: '⚫ Nero Premium' },
    { id: 'gray', label: '⚪ Grigio Elegante' },
    { id: 'white', label: '🌕 Bianco Luminoso' },
    { id: 'pink', label: '🌸 Rosa Pastello' },
  ];

  const languages = [
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'it', label: 'Italiano', flag: '🇮🇹' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'pt', label: 'Português', flag: '🇵🇹' },
  ];

  const handleLoginItem = async (enabled: boolean) => {
    setLoginItem(enabled);
    if (window.electronAPI) {
      await window.electronAPI.setLoginItem(enabled);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('SETTINGS')} width={580}>
      {/* Theme */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>{t('THEME')}</h3>
        <div style={themeGrid}>
          {themes.map(th => (
            <button
              key={th.id}
              style={{
                ...themeBtn,
                border: theme === th.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: theme === th.id ? 'var(--card-hover)' : 'var(--card-bg)',
              }}
              onClick={() => setTheme(th.id)}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>{t('LANGUAGE')}</h3>
        <div style={langGrid}>
          {languages.map(l => (
            <button
              key={l.id}
              style={{
                ...langBtn,
                border: language === l.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: language === l.id ? 'var(--card-hover)' : 'var(--card-bg)',
              }}
              onClick={() => setLanguage(l.id)}
            >
              <span style={{ fontSize: '1.4rem' }}>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Maintenance / Scan */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Scansione Libreria</h3>
        <button
          style={scanBtnStyle}
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? 'Ricerca in corso...' : '🔍 Cerca Giochi Installati (Steam, Epic, EA, GOG)'}
        </button>
      </div>

      {/* System */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Avvio e Sistema</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={toggleRow}>
            <input
              type="checkbox"
              checked={loginItem}
              onChange={e => handleLoginItem(e.target.checked)}
            />
            <span style={toggleLabel}>{t('BOOT_START')}</span>
          </label>
          <label style={toggleRow}>
            <input type="checkbox" defaultChecked />
            <span style={toggleLabel}>{t('TRAY_CLOSE')}</span>
          </label>
        </div>
      </div>
    </BaseModal>
  );
};

const scanBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  border: 'none',
  color: 'white',
  padding: '14px 18px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.92rem',
  transition: 'all 0.2s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '0.8rem',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  fontWeight: 700,
};

const themeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const langGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '8px',
};

const themeBtn: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  transition: 'all 0.2s',
  fontWeight: 500,
};

const langBtn: React.CSSProperties = {
  padding: '12px',
  borderRadius: '12px',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  transition: 'all 0.2s',
  fontWeight: 500,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.85rem',
};

const toggleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  padding: '12px 16px',
  background: 'var(--card-bg)',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
};

const toggleLabel: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
};
