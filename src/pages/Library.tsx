import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppProvider';
import { ContextMenu } from '../components/ContextMenu';

// Helper to generate a vibrant gradient based on a seed string
function getGradientByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 75%, 45%) 0%, hsl(${h2}, 85%, 20%) 100%)`;
}

type GameCardProps = {
  game: any;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

const GameCard: React.FC<GameCardProps> = ({ game, onClick, onContextMenu }) => {
  const [imgError, setImgError] = useState(!game.cover || game.cover.includes('via.placeholder'));

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.04) translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      {game.favorite && (
        <div style={starBadgeStyle} title="Preferito">⭐</div>
      )}
      {imgError ? (
        <div style={{ ...fallbackCardStyle, background: getGradientByName(game.name) }}>
          <div style={fallbackGlassOverlay}>
            <div style={fallbackBadge}>
              {game.id.split('-')[0].toUpperCase()}
            </div>
            <span style={fallbackIcon}>🎮</span>
            <span style={fallbackTitle}>
              {game.name} {game.favorite && ' ⭐'}
            </span>
          </div>
        </div>
      ) : (
        <img
          src={game.cover}
          alt={game.name}
          style={coverStyle}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

const starBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,215,0,0.4)',
  borderRadius: '50%',
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.85rem',
  zIndex: 10,
  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
};

export const Library: React.FC = () => {
  const { games, t, refreshGames } = useAppContext();
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, gameId: string } | null>(null);

  const handleDelete = async (gameId: string) => {
    if (!window.electronAPI) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    if (window.confirm(`Rimuovere "${game.name}" dalla libreria?`)) {
      await window.electronAPI.deleteGame(gameId);
      await refreshGames();
    }
  };

  return (
    <div style={containerStyle}>
      <h1 className="text-hero text-gradient" style={headerStyle}>{t('ALL_GAMES')}</h1>

      {games.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎮</div>
          <div>{t('NO_GAMES')}</div>
        </div>
      ) : (
        <div style={gridStyle}>
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => navigate(`/game/${game.id}`)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, gameId: game.id });
              }}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={[
            { label: t('PLAY'), onClick: () => navigate(`/game/${contextMenu.gameId}`) },
            { label: t('REMOVE'), onClick: () => handleDelete(contextMenu.gameId) },
          ]}
        />
      )}
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  padding: '40px',
  height: '100%',
  overflowY: 'auto',
  background: 'var(--bg-primary)',
};

const headerStyle: React.CSSProperties = {
  fontSize: '2.8rem',
  fontWeight: 800,
  marginBottom: '30px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
  gap: '24px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  aspectRatio: '2 / 3',
  position: 'relative',
};

const coverStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const fallbackCardStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
};

const fallbackGlassOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.15)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: '16px',
  gap: '8px',
};

const fallbackBadge: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '20px',
  padding: '4px 10px',
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: 'white',
};

const fallbackIcon: React.CSSProperties = {
  fontSize: '2.5rem',
  opacity: 0.8,
  marginBottom: 'auto',
  marginTop: '45px',
};

const fallbackTitle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'white',
  textShadow: '0 2px 10px rgba(0,0,0,0.4)',
  wordBreak: 'break-word',
  lineHeight: 1.25,
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 20px',
  color: 'var(--text-secondary)',
  fontSize: '1.1rem',
  textAlign: 'center',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '24px',
  border: '1px dashed var(--border-color)',
};
