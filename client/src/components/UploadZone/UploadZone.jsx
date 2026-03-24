import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './UploadZone.module.css';

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export default function UploadZone({ onFileSelected, accept = 'image/*,video/*', description = 'Drop your file here', formats = 'JPEG, PNG, WebP, MP4, MOV, AVI, MKV' }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const validate = useCallback((file) => {
    if (!file) return null;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    if (!isImage && !isVideo && !isAudio) return 'Unsupported file type.';
    if (file.size > MAX_SIZE) return 'Files must be under 2 GB.';
    return null;
  }, []);

  const handleFile = useCallback((file) => {
    const error = validate(file);
    if (error) {
      window.dispatchEvent(new CustomEvent('mediacrush-error', { detail: error }));
      return;
    }
    onFileSelected(file);
  }, [validate, onFileSelected]);

  return (
    <motion.div
      className={`${styles.zone} ${dragOver ? styles.dragover : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
      }}
      whileHover={{ borderColor: 'var(--accent)' }}
    >
      <motion.div
        className={styles.icon}
        animate={dragOver ? { scale: [1, 1.08, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 30V10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M17 17L24 10L31 17" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 28V34C8 36.2 9.8 38 12 38H36C38.2 38 40 36.2 40 34V28" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </motion.div>
      <p className={styles.primary}>{description}</p>
      <p className={styles.secondary}>or click to browse</p>
      <p className={styles.formats}>{formats}</p>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={(e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
        e.target.value = '';
      }} />
    </motion.div>
  );
}
