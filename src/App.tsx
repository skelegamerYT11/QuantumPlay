import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppProvider';
import { Sidebar } from './components/Sidebar';
import { Library } from './pages/Library';
import { GameDetail } from './pages/GameDetail';
import { Settings } from './pages/Settings';
import { AddGame } from './pages/AddGame';
import { WelcomeScreen } from './components/WelcomeScreen';

function AppInner() {
  const { isElectron, refreshGames } = useAppContext();
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('qp_welcomed'));
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ total: number; added: number } | null>(null);

  const handleDismiss = () => {
    localStorage.setItem('qp_welcomed', '1');
    setShowWelcome(false);
  };

  useEffect(() => {
    const runStartupScan = async () => {
      if (isElectron && !showWelcome && !localStorage.getItem('qp_scanned')) {
        setScanning(true);
        try {
          const result = await window.electronAPI!.scanGames();
          setScanResult(result);
          localStorage.setItem('qp_scanned', '1');
          await refreshGames();
        } catch (e) {
          console.error('Scan failed:', e);
        } finally {
          setScanning(false);
        }
      }
    };
    runStartupScan();
  }, [isElectron, showWelcome, refreshGames]);

  if (showWelcome) {
    return <WelcomeScreen onDismiss={handleDismiss} />;
  }

  return (
    <div style={appStyle}>
      <Sidebar />
      <main style={mainStyle}>
        {scanning && (
          <div style={scanBannerStyle}>
            🔍 Scansione giochi in corso...
          </div>
        )}
        {scanResult && !scanning && (
          <div style={{ ...scanBannerStyle, background: 'rgba(71,176,75,0.15)', borderColor: '#47b04b' }}>
            ✅ Scansione completata: trovati {scanResult.total} giochi, aggiunti {scanResult.added} nuovi.
            <button style={closeScanBtn} onClick={() => setScanResult(null)}>×</button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/add-game" element={<AddGame />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppInner />
      </HashRouter>
    </AppProvider>
  );
}

const appStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const scanBannerStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: 'rgba(102,192,244,0.15)',
  borderBottom: '1px solid var(--accent-color)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  zIndex: 100,
};

const closeScanBtn: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  fontSize: '1.2rem',
  cursor: 'pointer',
};

export default App;
