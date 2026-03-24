import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useConvert from '../../hooks/useConvert';
import UploadZone from '../../components/UploadZone/UploadZone';
import FileInfo from '../../components/FileInfo/FileInfo';
import FormatGrid from '../../components/FormatGrid/FormatGrid';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import ResultsCard from '../../components/ResultsCard/ResultsCard';
import { detectFormat } from '../../utils/detectFormat';
import styles from './ConvertPage.module.css';

const panelAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25 },
};

export default function ConvertPage() {
  const {
    state, file, thumbnailUrl, progress, result, downloadUrl,
    selectFile, convert, reset,
  } = useConvert();

  const [targetFormat, setTargetFormat] = useState(null);

  const sourceFormat = file ? detectFormat(file) : null;

  const handleConvert = () => {
    if (targetFormat) convert(targetFormat);
  };

  const handleReset = () => {
    reset();
    setTargetFormat(null);
  };

  return (
    <AnimatePresence mode="wait">
      {state === 'idle' && (
        <motion.div key="upload" {...panelAnimation}>
          <UploadZone
            onFileSelected={(f) => {
              selectFile(f);
              setTargetFormat(null);
            }}
            accept="image/*,video/*,audio/*"
            description="Drop a file to convert"
            formats="Images, Videos, and Audio files supported"
          />
        </motion.div>
      )}

      {state === 'configuring' && file && (
        <motion.div key="settings" {...panelAnimation} className={styles.panel}>
          <FileInfo file={file} thumbnailUrl={thumbnailUrl} />

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Convert To</h3>
            <p className={styles.sectionSub}>Select your target format</p>
            <FormatGrid
              file={file}
              selected={targetFormat}
              onSelect={setTargetFormat}
            />
          </div>

          <button
            className={styles.convertBtn}
            disabled={!targetFormat}
            onClick={handleConvert}
          >
            {targetFormat
              ? `Convert to .${targetFormat.toUpperCase()}`
              : 'Select a format'}
          </button>
        </motion.div>
      )}

      {state === 'converting' && (
        <motion.div key="progress" {...panelAnimation}>
          <ProgressBar percent={progress} label="Converting..." />
        </motion.div>
      )}

      {state === 'done' && result && (
        <motion.div key="results" {...panelAnimation}>
          <ResultsCard
            originalName={result.originalName}
            originalSize={result.originalSize}
            originalSizeFormatted={result.originalSizeFormatted}
            compressedSize={result.compressedSize}
            compressedSizeFormatted={result.compressedSizeFormatted}
            format={result.format}
            savingsBadge={false}
            formatBadge={
              sourceFormat
                ? {
                    from: sourceFormat.ext.toUpperCase(),
                    to: (result.format || '').toUpperCase(),
                  }
                : null
            }
            downloadUrl={downloadUrl}
            onReset={handleReset}
            resetLabel="Convert Another"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
