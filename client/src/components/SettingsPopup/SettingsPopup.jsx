import { useTheme } from '../../theme/ThemeProvider';
import { themes } from '../../theme/themes';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SettingsPopup.module.css';

export default function SettingsPopup({ onClose }) {
  const { themeName, setTheme } = useTheme();

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.popup}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          <h3 className={styles.title}>Theme</h3>
          <div className={styles.grid}>
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`${styles.themeCard} ${key === themeName ? styles.active : ''}`}
                onClick={() => { setTheme(key); onClose(); }}
              >
                <div className={styles.swatch} style={{ background: theme.accent }} />
                <span className={styles.themeName}>{theme.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
