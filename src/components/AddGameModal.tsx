import React, { useState } from 'react';
import { BaseModal, FieldRow, TextInput, FilePickRow } from './BaseModal';
import { useAppContext } from '../contexts/AppProvider';
import { FaGamepad } from 'react-icons/fa';

type AddGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose }) => {
  const { refreshGames, t } = useAppContext();

  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [cover, setCover] = useState('');
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName(''); setExePath(''); setCover(''); setBanner(''); setError('');
  };

  const pickExe = async () => {
    if (!window.electronAPI) return;
    const file = await window.electronAPI.pickFile([
      { name: 'Eseguibili', extensions: ['exe', 'bat', 'cmd', 'lnk', 'url'] },
      { name: 'Tutti i file', extensions: ['*'] },
    ]);
    if (file) {
      setExePath(file);
      if (!name) {
        const parts = file.replace(/\\/g, '/').split('/');
        const fname = parts[parts.length - 1];
        setName(fname.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const pickImage = async (setter: (v: string) => void) => {
    if (!window.electronAPI) return;
    const base64 = await window.electronAPI.pickImage();
    if (base64) {
      setter(base64);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Il nome è obbligatorio.'); return; }
    setSaving(true);
    setError('');

    const newGame = {
      id: `manual-${Date.now()}`,
      name: name.trim(),
      exePath,
      folderPath: exePath ? exePath.substring(0, exePath.lastIndexOf('\\')) : '',
      cover: cover || 'https://via.placeholder.com/300x400/1b2838/c7d5e0?text=' + encodeURIComponent(name),
      banner: banner || 'https://via.placeholder.com/1920x620/1b2838/c7d5e0?text=' + encodeURIComponent(name),
      lastPlayed: t('NEVER'),
      playTime: 0,
    };

    if (window.electronAPI) {
      await window.electronAPI.addGame(newGame);
      await refreshGames();
    }

    setSaving(false);
    reset();
    onClose();
  };

  const footer = (
    <>
      <button
        style={cancelBtn}
        onClick={() => { reset(); onClose(); }}
        disabled={saving}
      >
        {t('CANCEL')}
      </button>
      <button style={saveBtn} onClick={handleSave} disabled={saving}>
        <FaGamepad /> {saving ? 'Salvando...' : t('SAVE_GAME')}
      </button>
    </>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('ADD_GAME')} footer={footer}>
      {error && <div style={errorStyle}>⚠️ {error}</div>}

      <FieldRow label={t('GAME_NAME')}>
        <TextInput
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Es. Cyberpunk 2077"
          autoFocus
        />
      </FieldRow>

      <FieldRow label={t('EXE_FILE')}>
        <FilePickRow
          value={exePath}
          onPick={pickExe}
          placeholder={window.electronAPI ? "Clicca 📂 per selezionare..." : "Solo nell'app Electron"}
          icon="📂"
        />
      </FieldRow>

      <FieldRow label={t('COVER_IMG') + ' (opzionale)'}>
        <FilePickRow
          value={cover}
          onPick={() => pickImage(setCover)}
          placeholder="Immagine verticale (2:3)"
          icon="🖼️"
        />
      </FieldRow>

      <FieldRow label={t('BANNER_IMG') + ' (opzionale)'}>
        <FilePickRow
          value={banner}
          onPick={() => pickImage(setBanner)}
          placeholder="Immagine orizzontale (16:9)"
          icon="🎨"
        />
      </FieldRow>
    </BaseModal>
  );
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '10px 20px',
  fontWeight: 600,
  borderRadius: '10px',
};

const saveBtn: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  padding: '12px 28px',
  borderRadius: '10px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '0.95rem',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(255,107,107,0.15)',
  border: '1px solid rgba(255,107,107,0.4)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: '#ff9999',
  fontSize: '0.9rem',
};
