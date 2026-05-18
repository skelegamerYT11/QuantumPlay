import React, { useEffect } from 'react';

type ContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
  options: { label: string; onClick: () => void }[];
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, options }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div style={{ ...menuStyle, top: y, left: x }} onClick={(e) => e.stopPropagation()}>
      {options.map((opt, i) => (
        <button
          key={i}
          style={menuItemStyle}
          onClick={() => {
            opt.onClick();
            onClose();
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const menuStyle: React.CSSProperties = {
  position: 'fixed',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '5px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  zIndex: 9999,
  minWidth: '200px',
};

const menuItemStyle: React.CSSProperties = {
  padding: '10px 15px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: '4px',
  fontSize: '0.9rem',
  transition: 'background 0.2s',
};
