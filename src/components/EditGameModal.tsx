import React, { useState } from 'react';
import { BaseModal, FieldRow, TextInput, FilePickRow } from './BaseModal';
import { useAppContext } from '../contexts/AppProvider';
import type { Game } from '../contexts/AppProvider';

type EditGameModalProps = {
  game: Game;
  onClose: () => void;
};

export const EditGameModal: React.FC<EditGameModalProps> = ({ game, onClose }) => {
  const { refreshGames, t } = useAppContext();

  const [name, setName] = useState(game.name);
  const [exePath, setExePath] = useState(game.exePath);
  const [folderPath, setFolderPath] = useState(game.folderPath);
  const [cover, setCover] = useState(game.cover);
  const [banner, setBanner] = useState(game.banner);
  const [saving, setSaving] = useState(false);

  const pickExe = async () => {
    if (!window.electronAPI) return;
    const file = await window.electronAPI.pickFile([
      { name: 'Eseguibili', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
      { name: 'Tutti i file', extensions: ['*'] },
    ]);
    if (file) setExePath(file);
  };

  const pickImage = async (setter: (v: string) => void) => {
    if (!window.electronAPI) return;
    const base64 = await window.electronAPI.pickImage();
    if (base64) {
      setter(base64);
    }
  };

  const handleSave = async () => {
    if (!window.electronAPI) return;
    setSaving(true);
    await window.electronAPI.updateGame(game.id, {
      name,
      exePath,
      folderPath: folderPath || (exePath ? exePath.substring(0, exePath.lastIndexOf('\\')) : ''),
      cover,
      banner,
    });
    await refreshGames();
    setSaving(false);
    onClose();
  };

  const footer = (
    <>
      <button style={cancelBtn} onClick={onClose} disabled={saving}>{t('CANCEL')}</button>
      <button style={saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Salvando...' : 'Salva Modifiche'}
      </button>
    </>
  );

  return (
    <BaseModal isOpen={true} onClose={onClose} title={`${t('EDIT')} — ${game.name}`} footer={footer}>
      <FieldRow label={t('GAME_NAME')}>
        <TextInput value={name} onChange={e => setName(e.target.value)} />
      </FieldRow>

      <FieldRow label={t('EXE_FILE')}>
        <FilePickRow value={exePath} onPick={pickExe} placeholder="Percorso .exe" icon="📂" />
      </FieldRow>

      <FieldRow label="Cartella installazione (opzionale)">
        <TextInput value={folderPath} onChange={e => setFolderPath(e.target.value)} placeholder="Auto dalla cartella del .exe" />
      </FieldRow>

      <FieldRow label={t('COVER_IMG')}>
        <FilePickRow value={cover} onPick={() => pickImage(setCover)} placeholder="Immagine verticale" icon="🖼️" />
        {cover && (
          <img src={cover} style={{ height: '80px', borderRadius: '6px', objectFit: 'cover', marginTop: '4px' }} />
        )}
      </FieldRow>

      <FieldRow label={t('BANNER_IMG')}>
        <FilePickRow value={banner} onPick={() => pickImage(setBanner)} placeholder="Immagine orizzontale" icon="🎨" />
        {banner && (
          <img src={banner} style={{ height: '50px', borderRadius: '6px', objectFit: 'cover', width: '100%', marginTop: '4px' }} />
        )}
      </FieldRow>
    </BaseModal>
  );
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
  cursor: 'pointer', padding: '10px 20px', fontWeight: 600, borderRadius: '10px',
};
const saveBtn: React.CSSProperties = {
  background: 'var(--accent-gradient)', border: 'none', color: 'white',
  cursor: 'pointer', padding: '12px 28px', borderRadius: '10px',
  fontWeight: 700, fontSize: '0.95rem',
};
