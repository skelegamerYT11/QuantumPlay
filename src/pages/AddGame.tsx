import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppProvider';
import { FaGamepad, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const AddGame: React.FC = () => {
  const navigate = useNavigate();
  const { refreshGames, t } = useAppContext();

  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [cover, setCover] = useState('');
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Il nome del gioco è obbligatorio.'); return; }
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
    navigate('/');
  };

  return (
    <div style={containerStyle}>
      {/* Header bar */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={() => navigate('/')}>
          <FaArrowLeft /> Torna alla Libreria
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Aggiungi Gioco</h1>
      </div>

      <div style={mainContentStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={iconBadgeStyle}>
              <FaGamepad size={36} style={{ color: 'var(--accent-color)' }} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '12px 0 0 0' }}>Nuovo Gioco Personalizzato</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>
              Inserisci i dettagli e carica le immagini dal disco per salvarlo nella tua libreria premium.
            </p>
          </div>

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <form onSubmit={handleSave} style={formStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nome del Gioco</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Es. Grand Theft Auto V, Red Dead Redemption 2"
                style={inputStyle}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>File Eseguibile (.exe, collegamento o file batch)</label>
              <div style={pickerRowStyle}>
                <input
                  type="text"
                  value={exePath}
                  onChange={e => setExePath(e.target.value)}
                  placeholder="Seleziona il percorso del file di gioco..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button" onClick={pickExe} style={pickerBtnStyle}>
                  📂 Sfoglia...
                </button>
              </div>
            </div>

            <div style={imagesRowStyle}>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>Copertina Verticale (2:3)</label>
                <div style={pickerRowStyle}>
                  <button type="button" onClick={() => pickImage(setCover)} style={{ ...pickerBtnStyle, flex: 1 }}>
                    🖼️ Carica Copertina
                  </button>
                </div>
                {cover ? (
                  <div style={previewBoxStyle}>
                    <img src={cover} alt="Cover Preview" style={coverPreviewStyle} />
                    <button type="button" onClick={() => setCover('')} style={removeImgBtnStyle}>Rimuovi</button>
                  </div>
                ) : (
                  <div style={emptyPreviewStyle}>Nessuna copertina caricata</div>
                )}
              </div>

              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>Banner Orizzontale (16:9)</label>
                <div style={pickerRowStyle}>
                  <button type="button" onClick={() => pickImage(setBanner)} style={{ ...pickerBtnStyle, flex: 1 }}>
                    🎨 Carica Banner
                  </button>
                </div>
                {banner ? (
                  <div style={previewBoxStyle}>
                    <img src={banner} alt="Banner Preview" style={bannerPreviewStyle} />
                    <button type="button" onClick={() => setBanner('')} style={removeImgBtnStyle}>Rimuovi</button>
                  </div>
                ) : (
                  <div style={emptyPreviewStyle}>Nessun banner caricato</div>
                )}
              </div>
            </div>

            <div style={buttonGroupStyle}>
              <button
                type="button"
                style={cancelBtnStyle}
                onClick={() => navigate('/')}
                disabled={saving}
              >
                Annulla
              </button>
              <button type="submit" style={saveBtnStyle} disabled={saving}>
                {saving ? 'Aggiunta in corso...' : 'Aggiungi Gioco alla Libreria'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  background: 'var(--bg-primary)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '24px 35px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(0,0,0,0.15)',
};

const backBtnStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '10px 18px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  padding: '40px 20px',
  overflowY: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid var(--border-color)',
  borderRadius: '24px',
  padding: '40px',
  boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(20px)',
};

const iconBadgeStyle: React.CSSProperties = {
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  padding: '12px 16px',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const pickerRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const pickerBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '12px 20px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  transition: 'background 0.2s',
};

const imagesRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
};

const previewBoxStyle: React.CSSProperties = {
  marginTop: '10px',
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(0,0,0,0.4)',
};

const coverPreviewStyle: React.CSSProperties = {
  width: '120px',
  height: '180px',
  objectFit: 'cover',
  margin: '15px 0',
  borderRadius: '6px',
};

const bannerPreviewStyle: React.CSSProperties = {
  width: '260px',
  height: '100px',
  objectFit: 'cover',
  margin: '15px 0',
  borderRadius: '6px',
};

const removeImgBtnStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,107,107,0.15)',
  border: 'none',
  borderTop: '1px solid rgba(255,107,107,0.3)',
  color: '#ff8888',
  padding: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.82rem',
  transition: 'background 0.2s',
};

const emptyPreviewStyle: React.CSSProperties = {
  marginTop: '10px',
  border: '1px dashed var(--border-color)',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center',
  color: 'rgba(255,255,255,0.15)',
  fontSize: '0.82rem',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '15px',
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '12px 24px',
  fontWeight: 600,
  fontSize: '0.95rem',
  borderRadius: '10px',
};

const saveBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  padding: '14px 30px',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.98rem',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(255,107,107,0.15)',
  border: '1px solid rgba(255,107,107,0.4)',
  borderRadius: '12px',
  padding: '12px 16px',
  color: '#ff9999',
  fontSize: '0.9rem',
  marginBottom: '20px',
};
