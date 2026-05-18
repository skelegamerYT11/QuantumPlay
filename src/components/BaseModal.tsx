import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
};

export const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children, footer, width = 520 }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={overlayStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={{ ...modalStyle, width }}
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            <button style={closeBtn} onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div style={contentStyle}>{children}</div>

          {/* Footer */}
          {footer && <div style={footerStyle}>{footer}</div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Form Helpers ──────────────────────────────────────────────────────────────
export const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input style={inputStyle} {...props} />
);

export const FilePickRow: React.FC<{
  value: string;
  onPick: () => void;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ value, onPick, placeholder, icon }) => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <input style={{ ...inputStyle, flex: 1 }} value={value} readOnly placeholder={placeholder || 'Seleziona...'} />
    <button style={pickBtnStyle} onClick={onPick} type="button">{icon || '📂'}</button>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
};

const modalStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '85vh',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '22px 28px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
};

const closeBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  fontSize: '1rem',
};

const contentStyle: React.CSSProperties = {
  padding: '24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  overflowY: 'auto',
};

const footerStyle: React.CSSProperties = {
  padding: '18px 28px',
  borderTop: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '12px 14px',
  borderRadius: '10px',
  outline: 'none',
  fontSize: '0.95rem',
  width: '100%',
};

const pickBtnStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '0 16px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '1rem',
  flexShrink: 0,
};
