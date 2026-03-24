import { getTargetFormats } from './formats';
import styles from './FormatGrid.module.css';

export default function FormatGrid({ file, selected, onSelect }) {
  const formats = getTargetFormats(file);

  return (
    <div className={styles.grid}>
      {formats.map(f => (
        <button
          key={f.ext}
          className={`${styles.btn} ${selected === f.ext ? styles.active : ''}`}
          onClick={() => onSelect(f.ext)}
        >
          <span className={styles.ext}>.{f.ext}</span>
          <span className={styles.label}>{f.label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}
