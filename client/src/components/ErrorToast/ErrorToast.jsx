import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ErrorToast.module.css';

export default function ErrorToast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail);
      setTimeout(() => setMessage(null), 4000);
    };
    window.addEventListener('mediacrush-error', handler);
    return () => window.removeEventListener('mediacrush-error', handler);
  }, []);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
