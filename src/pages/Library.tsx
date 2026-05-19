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
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
};

const GameCard: React.FC<GameCardProps> = ({
  game,
  onClick,
  onContextMenu,
  draggable,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}) => {
  const [imgError, setImgError] = useState(!game.cover || game.cover.includes('via.placeholder'));

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        ...cardStyle,
        opacity: isDragging ? 0.4 : 1,
        borderColor: isDragOver ? 'var(--accent-color)' : 'var(--border-color)',
        transform: isDragOver ? 'scale(1.02)' : 'none',
        boxShadow: isDragOver ? '0 0 15px var(--accent-color)' : 'none',
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => {
        if (!isDragOver) {
          e.currentTarget.style.transform = 'scale(1.04) translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragOver) {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }
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
  const { games, setGames, sortOrder, setSortOrder, t, refreshGames } = useAppContext();
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, gameId: string } | null>(null);

  const [draggedGameId, setDraggedGameId] = useState<string | null>(null);
  const [dragOverGameId, setDragOverGameId] = useState<string | null>(null);

  const handleDelete = async (gameId: string) => {
    if (!window.electronAPI) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    if (window.confirm(`Rimuovere "${game.name}" dalla libreria?`)) {
      await window.electronAPI.deleteGame(gameId);
      await refreshGames();
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (sortOrder !== 'custom') return;
    setDraggedGameId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (sortOrder !== 'custom') return;
    e.preventDefault();
    setDragOverGameId(id);
  };

  const handleDragLeave = () => {
    setDragOverGameId(null);
  };

  const handleDragEnd = () => {
    setDraggedGameId(null);
    setDragOverGameId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    if (sortOrder !== 'custom') return;
    e.preventDefault();
    if (!draggedGameId || draggedGameId === targetId) return;

    // Verify they are within the same favorite/regular group to avoid visual glitches
    const draggedGame = games.find(g => g.id === draggedGameId);
    const targetGame = games.find(g => g.id === targetId);
    if (!draggedGame || !targetGame) return;

    if (draggedGame.favorite !== targetGame.favorite) {
      setDragOverGameId(null);
      setDraggedGameId(null);
      return;
    }

    const indexDragged = games.findIndex(g => g.id === draggedGameId);
    const indexTarget = games.findIndex(g => g.id === targetId);
    if (indexDragged === -1 || indexTarget === -1) return;

    const newGames = [...games];
    const [draggedItem] = newGames.splice(indexDragged, 1);
    newGames.splice(indexTarget, 0, draggedItem);

    setGames(newGames);
    if (window.electronAPI) {
      await window.electronAPI.setGamesOrder(newGames.map(g => g.id));
    }

    setDragOverGameId(null);
    setDraggedGameId(null);
  };

  const getSortedGames = () => {
    if (sortOrder === 'az') {
      return [...games].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'favorites') {
      const favorites = [...games].filter(g => g.favorite).sort((a, b) => a.name.localeCompare(b.name));
      const regular = [...games].filter(g => !g.favorite).sort((a, b) => a.name.localeCompare(b.name));
      return [...favorites, ...regular];
    } else {
      // custom sorting
      // favorites always on top, regular games below, preserving their DB order
      const favorites = [...games].filter(g => g.favorite);
      const regular = [...games].filter(g => !g.favorite);
      return [...favorites, ...regular];
    }
  };

  const sortedGames = getSortedGames();

  return (
    <div style={containerStyle}>
      <div style={headerContainerStyle}>
        <h1 className="text-hero text-gradient" style={headerStyle}>{t('ALL_GAMES')}</h1>
        
        <div style={sortContainerStyle}>
          <span style={sortLabelStyle}>{t('SORT_BY')}:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={sortSelectStyle}
          >
            <option value="az" style={sortOptionStyle}>{t('SORT_AZ')}</option>
            <option value="favorites" style={sortOptionStyle}>{t('SORT_FAVORITES')}</option>
            <option value="custom" style={sortOptionStyle}>{t('SORT_CUSTOM')}</option>
          </select>
        </div>
      </div>

      {sortedGames.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎮</div>
          <div>{t('NO_GAMES')}</div>
        </div>
      ) : (
        <div style={gridStyle}>
          {sortedGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              draggable={sortOrder === 'custom'}
              onDragStart={(e) => handleDragStart(e, game.id)}
              onDragOver={(e) => handleDragOver(e, game.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, game.id)}
              onDragEnd={handleDragEnd}
              isDragging={draggedGameId === game.id}
              isDragOver={dragOverGameId === game.id}
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

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
  flexWrap: 'wrap',
  gap: '15px',
};

const headerStyle: React.CSSProperties = {
  fontSize: '2.8rem',
  fontWeight: 800,
  margin: 0,
};

const sortContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--border-color)',
  padding: '8px 16px',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
};

const sortLabelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  fontWeight: 600,
};

const sortSelectStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
  paddingRight: '5px',
};

const sortOptionStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
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
