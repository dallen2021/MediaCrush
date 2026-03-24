import { PLATFORMS, PLATFORM_ICONS } from './platforms';
import styles from './PlatformGrid.module.css';

export default function PlatformGrid({ fileType, selected, onSelect }) {
  const filtered = PLATFORMS.filter(p => p.type === 'all' || p.type === fileType);

  return (
    <div className={styles.grid}>
      {filtered.map(p => (
        <button
          key={p.id}
          className={`${styles.btn} ${selected === p.id ? styles.active : ''}`}
          onClick={() => onSelect(selected === p.id ? null : p)}
        >
          <span className={styles.icon} dangerouslySetInnerHTML={{ __html: PLATFORM_ICONS[p.id] || '' }} />
          <span className={styles.name}>{p.name}</span>
          <span className={styles.limit}>{p.limit}</span>
        </button>
      ))}
    </div>
  );
}
