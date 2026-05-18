import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppProvider';
import { FaCog, FaPlus, FaFolder, FaTrash, FaChevronDown, FaChevronRight } from 'react-icons/fa';

// Helper to generate a colorful fallback gradient
function getGradientByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 75%, 45%), hsl(${h2}, 85%, 25%))`;
}

type GameLinkProps = {
  game: any;
  onDragStart?: (e: React.DragEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
};

const GameLink: React.FC<GameLinkProps> = ({ game, onDragStart, onContextMenu }) => {
  const [imgError, setImgError] = useState(!game.cover || game.cover.includes('via.placeholder'));

  return (
    <NavLink
      to={`/game/${game.id}`}
      draggable
      onDragStart={onDragStart}
      onContextMenu={onContextMenu}
      style={({ isActive }) => ({
        ...linkStyle,
        background: isActive ? 'var(--card-hover)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
      })}
    >
      {imgError ? (
        <div style={{ ...iconStyle, background: getGradientByName(game.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>
          {game.name.substring(0, 2).toUpperCase()}
        </div>
      ) : (
        <img
          src={game.cover}
          alt={game.name}
          style={iconStyle}
          onError={() => setImgError(true)}
        />
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {game.name} {game.favorite && ' ⭐'}
      </span>
      {game.running && (
        <span style={runningBadgeStyle}>●</span>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { games, t } = useAppContext();

  // Categories list
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('qp_categories');
    return saved ? JSON.parse(saved) : [];
  });

  // Expanded/collapsed states
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('qp_categories');
    const list = saved ? JSON.parse(saved) : [];
    const defaults: Record<string, boolean> = { '_uncategorized': true };
    list.forEach((c: string) => { defaults[c] = true; });
    return defaults;
  });

  // UI state for creating category inline
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Drag over states to highlight the active target category
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  const toggleExpand = (cat: string) => {
    setExpandedCategories(prev => {
      const next = { ...prev, [cat]: !prev[cat] };
      return next;
    });
  };

  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newCatName.trim();
    if (name) {
      if (!categories.includes(name)) {
        const updated = [...categories, name];
        setCategories(updated);
        localStorage.setItem('qp_categories', JSON.stringify(updated));
        setExpandedCategories(prev => ({ ...prev, [name]: true }));
      }
      setNewCatName('');
      setShowNewCatInput(false);
    }
  };

  const handleDeleteCategory = (catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Vuoi davvero eliminare la categoria "${catName}"?\nI giochi al suo interno non verranno eliminati.`)) return;

    // 1. Remove category from the list
    const updated = categories.filter(c => c !== catName);
    setCategories(updated);
    localStorage.setItem('qp_categories', JSON.stringify(updated));

    // 2. Remove category field from any games belonging to it
    games.forEach(async (game) => {
      if (game.category === catName && window.electronAPI) {
        await window.electronAPI.updateGame(game.id, { category: null });
      }
    });
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, gameId: string) => {
    e.dataTransfer.setData('text/plain', gameId);
  };

  const handleDragOver = (e: React.DragEvent, catName: string | null) => {
    e.preventDefault();
    setDragOverCategory(catName === null ? '_uncategorized' : catName);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, catName: string | null) => {
    e.preventDefault();
    setDragOverCategory(null);
    const gameId = e.dataTransfer.getData('text/plain');
    if (gameId && window.electronAPI) {
      await window.electronAPI.updateGame(gameId, { category: catName });
    }
  };

  const handleRemoveFromCategory = async (gameId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.electronAPI) {
      await window.electronAPI.updateGame(gameId, { category: null });
    }
  };

  // Group games
  const gamesByCategory: Record<string, typeof games> = {};
  categories.forEach(c => { gamesByCategory[c] = []; });
  const uncategorizedGames: typeof games = [];

  games.forEach(game => {
    if (game.category && categories.includes(game.category)) {
      gamesByCategory[game.category].push(game);
    } else {
      uncategorizedGames.push(game);
    }
  });

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>
        <span className="text-hero text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          Quantum Play
        </span>
      </div>

      <nav style={navStyle}>
        <div style={categoryStyle}>
          <h3 style={categoryHeaderStyle}>{t('LIBRARY')}</h3>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              ...linkStyle,
              background: isActive ? 'var(--card-hover)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
            })}
          >
            Home
          </NavLink>
        </div>

        {/* Categories Section */}
        <div style={categoryStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '10px', marginBottom: '8px' }}>
            <h3 style={categoryHeaderStyle}>{t('CATEGORIES')}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={iconBtnStyle} title="Nuova Categoria" onClick={() => setShowNewCatInput(!showNewCatInput)}>
                <FaPlus size={12} />
              </button>
              <button style={iconBtnStyle} title="Aggiungi Gioco" onClick={() => navigate('/add-game')}>
                <FaPlus size={12} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
          </div>

          {/* New Category Input Row */}
          {showNewCatInput && (
            <form
              onSubmit={handleCreateCategory}
              style={newCatFormStyle}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                placeholder="Nome categoria..."
                style={newCatInputStyle}
                autoFocus
              />
              <button type="submit" style={newCatSubmitBtnStyle}>+</button>
            </form>
          )}

          {/* Render User Categories */}
          {categories.map(cat => {
            const catGames = gamesByCategory[cat] || [];
            const isDragOver = dragOverCategory === cat;
            const isExpanded = !!expandedCategories[cat];

            return (
              <div
                key={cat}
                onDragOver={e => handleDragOver(e, cat)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, cat)}
                style={{
                  ...catContainerStyle,
                  borderColor: isDragOver ? 'var(--accent-color)' : 'transparent',
                  background: isDragOver ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                <div className="sidebar-category-header" style={catHeaderStyle} onClick={() => toggleExpand(cat)}>
                  {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaFolder size={12} style={{ color: 'var(--accent-color)' }} />
                  <span style={catNameStyle}>{cat} ({catGames.length})</span>
                  <button className="sidebar-category-delete" style={catDeleteBtnStyle} onClick={e => handleDeleteCategory(cat, e)}>
                    <FaTrash size={10} />
                  </button>
                </div>

                {isExpanded && (
                  <div style={catListStyle}>
                    {catGames.length === 0 ? (
                      <div style={emptyDropIndicatorStyle}>Trascina qui un gioco</div>
                    ) : (
                      catGames.map(game => (
                        <GameLink
                          key={game.id}
                          game={game}
                          onDragStart={e => handleDragStart(e, game.id)}
                          onContextMenu={e => handleRemoveFromCategory(game.id, e)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Uncategorized / All other Games */}
          {(() => {
            const isDragOver = dragOverCategory === '_uncategorized';
            const isExpanded = !!expandedCategories['_uncategorized'];

            return (
              <div
                onDragOver={e => handleDragOver(e, null)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, null)}
                style={{
                  ...catContainerStyle,
                  borderColor: isDragOver ? 'var(--accent-color)' : 'transparent',
                  background: isDragOver ? 'rgba(255,255,255,0.05)' : 'transparent',
                  marginTop: '15px'
                }}
              >
                <div style={catHeaderStyle} onClick={() => toggleExpand('_uncategorized')}>
                  {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <span style={catNameStyle}>{t('GAMES')} ({uncategorizedGames.length})</span>
                </div>

                {isExpanded && (
                  <div style={catListStyle}>
                    {uncategorizedGames.map(game => (
                      <GameLink
                        key={game.id}
                        game={game}
                        onDragStart={e => handleDragStart(e, game.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </nav>

      <div style={bottomActionsStyle}>
        <button style={settingsButtonStyle} onClick={() => navigate('/settings')}>
          <FaCog size={18} />
          <span>{t('SETTINGS')}</span>
        </button>
      </div>
    </aside>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  transition: 'color 0.2s',
};

const sidebarStyle: React.CSSProperties = {
  width: '280px',
  background: 'var(--bg-sidebar)',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid var(--border-color)',
  paddingTop: '20px',
  height: '100%',
  backdropFilter: 'blur(10px)',
};

const logoStyle: React.CSSProperties = {
  padding: '0 20px',
  marginBottom: '30px',
  display: 'flex',
  alignItems: 'center',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  overflowY: 'auto',
  padding: '0 10px',
};

const categoryStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  padding: '0 10px',
  marginBottom: '4px',
  letterSpacing: '1px',
  textTransform: 'uppercase',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 10px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
};

const iconStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  objectFit: 'cover',
};

const bottomActionsStyle: React.CSSProperties = {
  marginTop: 'auto',
  padding: '20px',
  borderTop: '1px solid var(--border-color)',
};

const settingsButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  borderRadius: '6px',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
};

const runningBadgeStyle: React.CSSProperties = {
  color: '#47b04b',
  fontSize: '0.8rem',
  marginLeft: 'auto',
  textShadow: '0 0 5px rgba(71,176,75,0.6)',
};

const newCatFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  padding: '0 10px',
  marginBottom: '10px',
};

const newCatInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  padding: '6px 10px',
  fontSize: '0.85rem',
  outline: 'none',
};

const newCatSubmitBtnStyle: React.CSSProperties = {
  background: 'var(--accent-color)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  width: '28px',
  height: '28px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const catContainerStyle: React.CSSProperties = {
  border: '1px dashed transparent',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
};

const catHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  cursor: 'pointer',
  borderRadius: '6px',
  fontSize: '0.88rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  transition: 'background 0.2s',
  position: 'relative',
};

const catNameStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
};

const catDeleteBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.15)',
  cursor: 'pointer',
  padding: '4px',
  transition: 'color 0.2s',
  opacity: 0, // hidden by default, visible on hover!
};

// Add standard hover visibility via a global style or inline hover effect. Let's make it show on hover cleanly.
const catListStyle: React.CSSProperties = {
  paddingLeft: '15px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginTop: '2px',
};

const emptyDropIndicatorStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'rgba(255,255,255,0.15)',
  padding: '10px',
  textAlign: 'center',
  border: '1px dashed rgba(255,255,255,0.05)',
  borderRadius: '6px',
};
