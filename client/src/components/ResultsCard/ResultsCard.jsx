import { formatSize } from '../../utils/formatSize';
import styles from './ResultsCard.module.css';

export default function ResultsCard({ originalName, originalSize, compressedSize, compressedSizeFormatted, originalSizeFormatted, format, width, height, savingsBadge, formatBadge, downloadUrl, onReset, resetLabel = 'Start Over' }) {
  const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;
  const badgeClass = savings >= 30 ? styles.good : savings >= 10 ? styles.moderate : styles.bad;

  return (
    <div className={styles.panel}>
      {savingsBadge !== false && (
        <div className={`${styles.savingsBadge} ${badgeClass}`}>
          {savings >= 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
        </div>
      )}

      {formatBadge && (
        <div className={styles.formatBadge}>
          <span className={styles.fromFmt}>{formatBadge.from}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M12 6l4 4-4 4"/></svg>
          <span className={styles.toFmt}>{formatBadge.to}</span>
        </div>
      )}

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Original</span>
          <span className={styles.cardName}>{originalName}</span>
          <span className={styles.cardSize}>{originalSizeFormatted || formatSize(originalSize)}</span>
          {width && height && <span className={styles.cardDims}>{width} x {height}</span>}
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>{savingsBadge !== false ? 'Compressed' : 'Converted'}</span>
          <span className={styles.cardName}>{savingsBadge !== false ? `compressed_${originalName?.replace(/\.[^.]+$/, '')}.${format}` : `${originalName?.replace(/\.[^.]+$/, '')}.${format}`}</span>
          <span className={styles.cardSize}>{compressedSizeFormatted || formatSize(compressedSize)}</span>
          {format && <span className={styles.cardFmt}>{format.toUpperCase()}</span>}
        </div>
      </div>

      <div className={styles.actions}>
        <a href={downloadUrl} className={styles.downloadBtn}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M5 9L9 13L13 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Download
        </a>
        <button className={styles.resetBtn} onClick={onReset}>{resetLabel}</button>
      </div>
    </div>
  );
}
