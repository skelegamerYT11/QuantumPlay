import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppProvider';
import { FaPlay, FaCog, FaFolderOpen, FaHeart, FaTrash, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { EditGameModal } from '../components/EditGameModal';

export const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { games, refreshGames, t } = useAppContext();
  const [playError, setPlayError] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const game = games.find(g => g.id === id);

  useEffect(() => {
    if (!game) navigate('/');
  }, [game, navigate]);

  if (!game) return null;

  const isPlaying = !!game.running;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatPlayTime = (seconds: number): string => {
    if (!seconds) return '0 min';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    const h = (seconds / 3600).toFixed(1);
    return `${h} ore`;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePlayOrStop = async () => {
    if (!window.electronAPI) {
      setPlayError('Funzione disponibile solo nell\'app Electron');
      return;
    }

    if (isPlaying) {
      setPlayError('');
      const ok = await window.electronAPI.stopGame(game.id);
      if (!ok) {
        setPlayError('Impossibile arrestare il gioco.');
      }
      return;
    }

    if (!game.exePath) {
      setPlayError('Nessun eseguibile impostato. Modifica il gioco per aggiungerne uno.');
      return;
    }
    setPlayError('');
    const result = await window.electronAPI.playGame(game.id);
    if (!result.ok) {
      if (result.reason === 'already_running') {
        setPlayError('Il gioco è già in esecuzione.');
      } else {
        setPlayError(`Errore avvio: ${result.reason}`);
      }
    }
  };

  const handleOpenFolder = async () => {
    const folder = game.folderPath || (game.exePath ? game.exePath.substring(0, game.exePath.lastIndexOf('\\')) : '');
    if (folder && window.electronAPI) {
      await window.electronAPI.openFolder(folder);
    }
  };

  const handleDelete = async () => {
    if (!window.electronAPI) return;
    if (!window.confirm(`Rimuovere "${game.name}" dalla libreria?`)) return;
    await window.electronAPI.deleteGame(game.id);
    await refreshGames();
    navigate('/');
  };

  const handleToggleFavorite = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.updateGame(game.id, { favorite: !game.favorite });
    await refreshGames();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      {/* Blurred background */}
      <div style={{ ...bgBlurStyle, backgroundImage: `url(${game.banner || game.cover})` }} />
      <div style={bgOverlayStyle} />

      <div style={scrollWrapper}>
        {/* Header floating card */}
        <div style={floatingCardStyle}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <img
              src={game.cover}
              alt={game.name}
              style={coverThumbStyle}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x160/1b2838/c7d5e0?text=?'; }}
            />
            <div style={{ minWidth: 0 }}>
              <h1 className="text-hero text-gradient" style={gameNameStyle}>
                {game.name} {game.favorite && ' ⭐'}
              </h1>
              <div style={statsRow}>
                <div style={statBox}>
                  <span style={statLabel}><FaCalendarAlt size={10} /> {t('LAST_PLAYED')}</span>
                  <span style={statValue}>{game.lastPlayed || t('NEVER')}</span>
                </div>
                <div style={statBox}>
                  <span style={statLabel}><FaClock size={10} /> {t('PLAY_TIME')}</span>
                  <span style={statValue}>{formatPlayTime(game.playTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Play/Stop button */}
          <button
            className="play-button"
            style={isPlaying ? playBtnRunning : playBtnStyle}
            onClick={handlePlayOrStop}
          >
            <FaPlay size={18} />
            <span>{isPlaying ? 'CHIUDI GIOCO' : t('PLAY')}</span>
          </button>
        </div>

        {/* Error banner */}
        {playError && (
          <div style={errorBannerStyle}>
            ⚠️ {playError}
            <button style={closeScanBtn} onClick={() => setPlayError('')}>×</button>
          </div>
        )}

        {/* Details + Actions */}
        <div style={detailsAreaStyle}>
          {/* Main info panel */}
          <div style={glassPanelStyle}>
            <h3 style={panelTitle}>{t('DETAILS')}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
              {game.name} {t('DETAILS_DESC')}
            </p>

            <div style={infoRowStyle}>
              <span style={infoLabel}>Percorso eseguibile</span>
              <span style={infoValue}>{game.exePath || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabel}>Cartella di installazione</span>
              <span style={infoValue}>{game.folderPath || '—'}</span>
            </div>
          </div>

          {/* Actions panel */}
          <div style={glassPanelStyle}>
            <h3 style={panelTitle}>{t('ACTIONS')}</h3>
            <div style={actionsGrid}>
              <button style={actionBtn} onClick={() => setShowEdit(true)}>
                <FaCog size={15} /> {t('EDIT')}
              </button>
              <button style={actionBtn} onClick={handleOpenFolder} disabled={!game.folderPath && !game.exePath}>
                <FaFolderOpen size={15} /> {t('FOLDER')}
              </button>
              <button
                style={{
                  ...actionBtn,
                  color: game.favorite ? '#ff2a85' : 'var(--text-primary)',
                  borderColor: game.favorite ? 'rgba(255,42,133,0.5)' : 'var(--border-color)',
                  background: game.favorite ? 'rgba(255,42,133,0.1)' : 'transparent',
                }}
                onClick={handleToggleFavorite}
              >
                {game.favorite ? (
                  <>
                    <span style={{ marginRight: '6px' }}>❤️</span> {t('FAVORITES')}
                  </>
                ) : (
                  <>
                    <FaHeart size={15} /> {t('FAVORITES')}
                  </>
                )}
              </button>
              <button style={{ ...actionBtn, color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }} onClick={handleDelete}>
                <FaTrash size={15} /> {t('REMOVE')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && <EditGameModal game={game} onClose={() => setShowEdit(false)} />}

      <style>{`
        .play-button {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 40px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          flex-shrink: 0;
        }
        .play-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          filter: brightness(1.15);
        }
        .play-button:active:not(:disabled) { transform: translateY(0); }
      `}</style>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
};

const bgBlurStyle: React.CSSProperties = {
  position: 'absolute',
  inset: '-20px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: 'blur(40px) brightness(0.4) saturate(1.5)',
};

const bgOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 60%, var(--bg-primary) 100%)',
  opacity: 0.75,
};

const scrollWrapper: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  height: '100%',
  overflowY: 'auto',
  padding: '35px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const floatingCardStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  padding: '24px 30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
};

const coverThumbStyle: React.CSSProperties = {
  width: '100px',
  height: '140px',
  borderRadius: '10px',
  objectFit: 'cover',
  flexShrink: 0,
  boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
};

const gameNameStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  marginBottom: '16px',
  lineHeight: 1,
};

const statsRow: React.CSSProperties = {
  display: 'flex',
  gap: '30px',
};

const statBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const statLabel: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-secondary)',
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const statValue: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const playBtnStyle: React.CSSProperties = {
  background: 'var(--play-button)',
  color: '#fff',
};

const playBtnRunning: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  color: '#fff',
  boxShadow: '0 4px 15px rgba(255, 75, 43, 0.4)',
  cursor: 'pointer',
};

const errorBannerStyle: React.CSSProperties = {
  background: 'rgba(255,107,107,0.15)',
  border: '1px solid rgba(255,107,107,0.4)',
  borderRadius: '12px',
  padding: '12px 20px',
  color: '#ff9999',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const closeScanBtn: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  fontSize: '1.2rem',
  cursor: 'pointer',
};

const detailsAreaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  flex: 1,
};

const glassPanelStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(0,0,0,0.35)',
  backdropFilter: 'blur(15px)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  padding: '24px',
};

const panelTitle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.85rem',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '18px',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '14px',
  padding: '12px',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '8px',
};

const infoLabel: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-secondary)',
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
};

const infoValue: React.CSSProperties = {
  color: 'var(--accent-color)',
  fontFamily: 'monospace',
  fontSize: '0.88rem',
  wordBreak: 'break-all',
};

const actionsGrid: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const actionBtn: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '14px 18px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '0.95rem',
  fontWeight: 500,
  textAlign: 'left',
};
