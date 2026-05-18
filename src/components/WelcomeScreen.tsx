import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppProvider';

type WelcomeScreenProps = {
  onDismiss: () => void;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss }) => {
  const { t } = useAppContext();
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 4 + 4,
    }))
  );

  return (
    <AnimatePresence>
      <motion.div
        style={overlayStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: 'var(--accent-color)',
              opacity: 0.3,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.5, 0.1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Central content */}
        <motion.div
          style={cardStyle}
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          {/* Logo / Icon */}
          <motion.div
            style={logoCircleStyle}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <span style={{ fontSize: '2.5rem' }}>⚡</span>
          </motion.div>

          <motion.h1
            className="text-hero text-gradient"
            style={titleStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Quantum Play
          </motion.h1>

          <motion.p
            style={subtitleStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            {t('WELCOME_SUB')}
          </motion.p>

          <motion.div
            style={versionTagStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            v1.0.0
          </motion.div>

          <motion.button
            style={ctaButtonStyle}
            className="welcome-cta"
            onClick={onDismiss}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.05, filter: 'brightness(1.15)' }}
            whileTap={{ scale: 0.97 }}
          >
            {t('OPEN_LIBRARY')} →
          </motion.button>
        </motion.div>

        <style>{`
          .welcome-cta {
            background: var(--accent-gradient);
            border: none;
            border-radius: 50px;
            padding: 18px 50px;
            color: white;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'var(--bg-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  overflow: 'hidden',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  padding: '60px 80px',
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(30px)',
  border: '1px solid var(--border-color)',
  borderRadius: '32px',
  boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
  maxWidth: '560px',
  textAlign: 'center',
};



const logoCircleStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'var(--accent-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 40px rgba(102,192,244,0.4)',
  marginBottom: '10px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 800,
  lineHeight: 1,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  maxWidth: '380px',
};

const versionTagStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  padding: '4px 14px',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
};

const ctaButtonStyle: React.CSSProperties = {
  marginTop: '10px',
};
