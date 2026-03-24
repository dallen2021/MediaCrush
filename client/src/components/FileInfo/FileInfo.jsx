import { formatSize } from '../../utils/formatSize';
import styles from './FileInfo.module.css';

export default function FileInfo({ file, thumbnailUrl }) {
  const ext = file.name.split('.').pop().toUpperCase();
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const badgeLabel = isImage ? ext : isVideo ? 'VIDEO' : 'AUDIO';
  const badgeClass = isImage ? styles.badgeImage : isVideo ? styles.badgeVideo : styles.badgeAudio;

  return (
    <div className={styles.container}>
      <div className={styles.thumbnail}>
        {thumbnailUrl ? <img src={thumbnailUrl} alt="" /> : null}
      </div>
      <div className={styles.meta}>
        <span className={styles.name}>{file.name}</span>
        <span className={styles.size}>{formatSize(file.size)}</span>
      </div>
      <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
    </div>
  );
}
