import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppProvider';
import { FaPalette, FaDesktop, FaDatabase, FaInfoCircle, FaArrowLeft, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    games,
    refreshGames,
    customBg,
    setCustomBg,
    customText,
    setCustomText,
    customAccent,
    setCustomAccent,
    minimizeToTray,
    setMinimizeToTray
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'interface' | 'custom_theme' | 'library' | 'system' | 'info'>('interface');
  const [scanning, setScanning] = useState(false);
  const [loginItem, setLoginItem] = useState(false);
  const [showUninstallModal, setShowUninstallModal] = useState(false);
  const [deleteUserData, setDeleteUserData] = useState(true);

  const themes = [
    { id: 'blue', label: '🔵 Azzurro (Steam)', desc: 'Il classico blu profondo con dettagli azzurri.' },
    { id: 'black', label: '⚫ Nero Premium', desc: 'Tema oscurato per sessioni di gioco notturne.' },
    { id: 'gray', label: '⚪ Grigio Elegante', desc: 'Un aspetto pulito, neutro e professionale.' },
    { id: 'white', label: '🌕 Bianco Luminoso', desc: 'Stile moderno e pulito a sfondo chiaro.' },
    { id: 'pink', label: '🌸 Rosa Pastello', desc: 'Una palette morbida e accattivante dai toni rosa.' },
    { id: 'custom', label: '🎨 Custom (Personalizzato)', desc: 'Crea il tuo stile unico impostando i tuoi colori RGB.' },
  ];

  const languages = [
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'it', label: 'Italiano', flag: '🇮🇹' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'pt', label: 'Português', flag: '🇵🇹' },
  ];

  const handleScan = async () => {
    if (!window.electronAPI) return;
    setScanning(true);
    try {
      const result = await window.electronAPI.scanGames();
      alert(`Scansione completata!\nGiochi scansionati: ${result.total}\nNuovi giochi aggiunti alla libreria: ${result.added}`);
      await refreshGames();
    } catch (e) {
      alert('Scansione fallita: ' + e);
    } finally {
      setScanning(false);
    }
  };

  const handleLoginItem = async (enabled: boolean) => {
    setLoginItem(enabled);
    if (window.electronAPI) {
      await window.electronAPI.setLoginItem(enabled);
    }
  };

  const resetCustomTheme = () => {
    setCustomBg('#0f172a');
    setCustomText('#f8fafc');
    setCustomAccent('#3b82f6');
  };

  return (
    <div style={containerStyle}>
      {/* Header bar */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={() => navigate('/')}>
          <FaArrowLeft /> Torna alla Libreria
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Impostazioni</h1>
      </div>

      <div style={contentLayout}>
        {/* Left side tabs */}
        <aside style={tabListStyle}>
          <button
            style={{ ...tabBtnStyle, background: activeTab === 'interface' ? 'var(--card-hover)' : 'transparent', color: activeTab === 'interface' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('interface')}
          >
            <FaPalette /> Interfaccia & Lingua
          </button>
          <button
            style={{ ...tabBtnStyle, background: activeTab === 'custom_theme' ? 'var(--card-hover)' : 'transparent', color: activeTab === 'custom_theme' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('custom_theme')}
          >
            <FaPalette /> Tema Personalizzato
          </button>
          <button
            style={{ ...tabBtnStyle, background: activeTab === 'library' ? 'var(--card-hover)' : 'transparent', color: activeTab === 'library' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('library')}
          >
            <FaDatabase /> Gestione Libreria
          </button>
          <button
            style={{ ...tabBtnStyle, background: activeTab === 'system' ? 'var(--card-hover)' : 'transparent', color: activeTab === 'system' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('system')}
          >
            <FaDesktop /> Avvio e Sistema
          </button>
          <button
            style={{ ...tabBtnStyle, background: activeTab === 'info' ? 'var(--card-hover)' : 'transparent', color: activeTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('info')}
          >
            <FaInfoCircle /> Info Launcher
          </button>
        </aside>

        {/* Right side settings fields */}
        <main style={settingsPanelStyle}>
          {/* Tab: Interface */}
          {activeTab === 'interface' && (
            <div style={sectionFlow}>
              <h2 style={sectionTitle}>Tema dell'applicazione</h2>
              <p style={sectionDesc}>Scegli tra gli stili predefiniti o crea la tua combinazione personale.</p>
              <div style={themeGrid}>
                {themes.map(tOption => (
                  <button
                    key={tOption.id}
                    onClick={() => setTheme(tOption.id)}
                    style={{
                      ...themeCardStyle,
                      borderColor: theme === tOption.id ? 'var(--accent-color)' : 'var(--border-color)',
                      background: theme === tOption.id ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>{tOption.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tOption.desc}</div>
                  </button>
                ))}
              </div>

              <div style={separatorStyle} />

              <h2 style={sectionTitle}>Lingua di visualizzazione</h2>
              <div style={langGrid}>
                {languages.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    style={{
                      ...langCardStyle,
                      borderColor: language === l.id ? 'var(--accent-color)' : 'var(--border-color)',
                      background: language === l.id ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Custom Theme Editor */}
          {activeTab === 'custom_theme' && (
            <div style={sectionFlow}>
              <h2 style={sectionTitle}>Editor Tema Personalizzato</h2>
              <p style={sectionDesc}>Seleziona i tuoi colori preferiti. Le sfumature e i contrasti secondari verranno calcolati automaticamente per un aspetto premium.</p>

              {theme !== 'custom' && (
                <div style={warningBannerStyle}>
                  ⚠️ Attiva il tema <strong>"Custom (Personalizzato)"</strong> nella tab Interfaccia per utilizzare e visualizzare queste modifiche.
                </div>
              )}

              <div style={colorPickersContainer}>
                <div style={colorPickerRow}>
                  <div>
                    <div style={colorPickerLabel}>Sfondo Principale (Background RGB)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Colore di base delle schermate dell'app.</div>
                  </div>
                  <input
                    type="color"
                    value={customBg}
                    onChange={e => setCustomBg(e.target.value)}
                    style={colorInputStyle}
                    disabled={theme !== 'custom'}
                  />
                </div>

                <div style={colorPickerRow}>
                  <div>
                    <div style={colorPickerLabel}>Colore dei Testi (Text RGB)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Colore primario dei titoli e delle scritte.</div>
                  </div>
                  <input
                    type="color"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    style={colorInputStyle}
                    disabled={theme !== 'custom'}
                  />
                </div>

                <div style={colorPickerRow}>
                  <div>
                    <div style={colorPickerLabel}>Colore di Accento (Accent & Gradients RGB)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Colore primario per i pulsanti, i gradienti e i bordi attivi.</div>
                  </div>
                  <input
                    type="color"
                    value={customAccent}
                    onChange={e => setCustomAccent(e.target.value)}
                    style={colorInputStyle}
                    disabled={theme !== 'custom'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button style={resetBtnStyle} onClick={resetCustomTheme} disabled={theme !== 'custom'}>
                  <FaUndo /> Ripristina Default Custom
                </button>
              </div>
            </div>
          )}

          {/* Tab: Library Management */}
          {activeTab === 'library' && (
            <div style={sectionFlow}>
              <h2 style={sectionTitle}>Scansione automatica ed elenchi</h2>
              <p style={sectionDesc}>Quantum Play esegue la scansione delle cartelle di Steam, GOG, EA, Epic e Ubisoft installati sul tuo PC per popolare la libreria in tempo reale.</p>

              <div style={statRowStyle}>
                <div style={statBoxStyle}>
                  <div style={statValStyle}>{games.length}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giochi Totali in Libreria</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statValStyle}>
                    {games.filter(g => g.id.startsWith('manual')).length}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giochi Aggiunti Manualmente</div>
                </div>
              </div>

              <div style={separatorStyle} />

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Scansiona ora la libreria</h3>
              <button
                style={{ ...scanBtnStyle, cursor: scanning ? 'wait' : 'pointer' }}
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? 'Ricerca in corso...' : '🔍 Avvia Scansione Completa (Steam, Epic, EA, GOG)'}
              </button>
            </div>
          )}

          {/* Tab: System Options */}
          {activeTab === 'system' && (
            <div style={sectionFlow}>
              <h2 style={sectionTitle}>Avvio dell'applicazione</h2>
              <div style={toggleRowList}>
                <label style={toggleCardStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Avvia all'accensione del PC</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Esegui automaticamente Quantum Play all'avvio di Windows.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={loginItem}
                    onChange={e => handleLoginItem(e.target.checked)}
                    style={checkboxStyle}
                  />
                </label>

                <label style={toggleCardStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Riduci ad icona alla chiusura</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quando fai clic sulla "X", riduci l'app nella barra di sistema vicino all'orologio anziché chiuderla.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={minimizeToTray}
                    onChange={e => {
                      const val = e.target.checked;
                      setMinimizeToTray(val);
                      if (window.electronAPI) {
                        window.electronAPI.updateSettings({ minimizeToTray: val });
                      }
                    }}
                    style={checkboxStyle}
                  />
                </label>

                <label style={toggleCardStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Accelerazione Hardware GPU</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sfrutta la scheda video per rendere le animazioni grafiche incredibilmente fluide.</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    style={checkboxStyle}
                  />
                </label>
              </div>

              <div style={separatorStyle} />

              <div style={{ marginTop: '10px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#ef4444' }}>Disinstallazione</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Rimuovi completamente Quantum Play ed avvia la procedura di disinstallazione dal sistema operativo.
                </p>
                <button
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => setShowUninstallModal(true)}
                >
                  🗑️ Disinstalla Applicazione
                </button>
              </div>
            </div>
          )}

          {/* Tab: Info Launcher */}
          {activeTab === 'info' && (
            <div style={sectionFlow}>
              <h2 style={sectionTitle}>Info su Quantum Play Launcher</h2>
              <div style={aboutCardStyle}>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }} className="text-gradient">
                  Quantum Play
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Versione 1.0.0 (Stable Build)
                </div>
                <p style={{ lineHeight: 1.7, marginBottom: '16px' }}>
                  Un client universale premium ideato per raccogliere in un'unica ed elegantissima libreria tutti i tuoi videogiochi PC sparsi tra launcher commerciali (Steam, EA, Epic, Ubisoft, GOG) ed eseguibili locali.
                </p>
                <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  Sviluppato con dedizione da <strong>Antigravity AI</strong> per offrire fluidità estrema, glassmorphism accattivante e supporto alle statistiche di gioco in tempo reale.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Uninstall Modal Overlay with Red Outline */}
      {showUninstallModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            border: '2px solid #ef4444', // Red border outline requested!
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.2), 0 0 45px rgba(0, 0, 0, 0.6)',
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Disinstallazione
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '22px', lineHeight: '1.5' }}>
              Sei sicuro di voler disinstallare <strong>Quantum Play</strong> dal tuo sistema?
            </p>

            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={deleteUserData}
                onChange={e => setDeleteUserData(e.target.checked)}
                style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  Elimina file di configurazione
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Rimuove i temi salvati, le statistiche di gioco, le cartelle e i giochi aggiunti manualmente (%AppData%/QuantumPlay).
                </div>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setShowUninstallModal(false)}
              >
                Annulla
              </button>
              <button
                style={{
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '2px solid #ef4444', // Red border outline requested!
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onClick={async () => {
                  if (window.electronAPI && window.electronAPI.uninstallApp) {
                    await window.electronAPI.uninstallApp(deleteUserData);
                  }
                  setShowUninstallModal(false);
                }}
              >
                Conferma Disinstallazione
              </button>
            </div>
          </div>
        </div>
      )}
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

const contentLayout: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

const tabListStyle: React.CSSProperties = {
  width: '260px',
  borderRight: '1px solid var(--border-color)',
  padding: '20px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  background: 'rgba(0,0,0,0.1)',
};

const tabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '8px',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '0.92rem',
  fontWeight: 600,
  width: '100%',
  transition: 'all 0.2s',
};

const settingsPanelStyle: React.CSSProperties = {
  flex: 1,
  padding: '40px',
  overflowY: 'auto',
};

const sectionFlow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  maxWidth: '800px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
};

const sectionDesc: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.9rem',
  marginTop: '-12px',
  lineHeight: 1.6,
};

const separatorStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--border-color)',
  margin: '20px 0',
};

const themeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const themeCardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid',
  textAlign: 'left',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  transition: 'all 0.2s',
};

const langGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
};

const langCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  transition: 'all 0.2s',
  fontWeight: 600,
  fontSize: '0.9rem',
};

const colorPickersContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  background: 'rgba(0,0,0,0.15)',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid var(--border-color)',
};

const colorPickerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '14px',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

const colorPickerLabel: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  marginBottom: '2px',
};

const colorInputStyle: React.CSSProperties = {
  width: '50px',
  height: '40px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  background: 'transparent',
};

const resetBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '12px 20px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
};

const warningBannerStyle: React.CSSProperties = {
  background: 'rgba(235,178,54,0.12)',
  border: '1px solid rgba(235,178,54,0.4)',
  borderRadius: '12px',
  padding: '14px 18px',
  color: '#ffd066',
  fontSize: '0.9rem',
  lineHeight: 1.5,
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
};

const statBoxStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(0,0,0,0.2)',
  padding: '24px',
  borderRadius: '14px',
  border: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const statValStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  color: 'var(--accent-color)',
  marginBottom: '4px',
};

const scanBtnStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  border: 'none',
  color: 'white',
  padding: '16px 24px',
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '0.98rem',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
};

const toggleRowList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const toggleCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 24px',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '14px',
  border: '1px solid var(--border-color)',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  accentColor: 'var(--accent-color)',
};

const aboutCardStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '20px',
  padding: '35px',
  border: '1px solid var(--border-color)',
};
