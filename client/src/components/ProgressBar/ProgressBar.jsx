import { motion } from 'framer-motion';
import styles from './ProgressBar.module.css';

export default function ProgressBar({ percent = 0, label = 'Processing...' }) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className={styles.panel}>
      <p className={styles.label}>{label}</p>
      <div className={styles.track}>
        <motion.div
          className={styles.fill}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      <p className={styles.percent}>{clamped}%</p>
    </div>
  );
}
