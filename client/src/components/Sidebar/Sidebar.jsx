import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import Logo3D from '../Logo3D/Logo3D';
import SettingsPopup from '../SettingsPopup/SettingsPopup';
import styles from './Sidebar.module.css';

// SVG icons as components
const CompressIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h12M4 14h12M8 2v4M12 2v4M8 14v4M12 14v4"/>
  </svg>
);

const ConvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8l4-4 4 4M8 4v10M16 12l-4 4-4-4M12 16V6"/>
  </svg>
);

const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="3"/>
    <path d="M10 1v2M10 17v2M3.93 3.93l1.41 1.41M14.66 14.66l1.41 1.41M1 10h2M17 10h2M3.93 16.07l1.41-1.41M14.66 5.34l1.41-1.41"/>
  </svg>
);

export default function Sidebar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo3D />
          <span className={styles.brandName}>MediaCrush</span>
        </div>

        <div className={styles.nav}>
          <NavLink to="/compress" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <CompressIcon />
            <span>Compress</span>
          </NavLink>
          <NavLink to="/convert" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <ConvertIcon />
            <span>Convert</span>
          </NavLink>
        </div>

        <div className={styles.footer}>
          <button className={styles.settingsBtn} onClick={() => setShowSettings(true)}>
            <GearIcon />
            <span>Settings</span>
          </button>
          <p className={styles.footerText}>Local processing<br/>No cloud uploads</p>
        </div>
      </nav>

      {showSettings && <SettingsPopup onClose={() => setShowSettings(false)} />}
    </>
  );
}
