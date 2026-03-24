import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCompress from '../../hooks/useCompress';
import UploadZone from '../../components/UploadZone/UploadZone';
import FileInfo from '../../components/FileInfo/FileInfo';
import PlatformGrid from '../../components/PlatformGrid/PlatformGrid';
import SegmentedControl from '../../components/SegmentedControl/SegmentedControl';
import QualitySlider from '../../components/QualitySlider/QualitySlider';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import ResultsCard from '../../components/ResultsCard/ResultsCard';
import styles from './CompressPage.module.css';

const panelAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25 },
};

export default function CompressPage() {
  const {
    state, file, thumbnailUrl, progress, result, downloadUrl,
    selectFile, compress, reset,
  } = useCompress();

  // Settings state
  const [platform, setPlatform] = useState(null);
  const [format, setFormat] = useState('original');
  const [qualityPreset, setQualityPreset] = useState('80');
  const [quality, setQuality] = useState(80);
  const [videoPreset, setVideoPreset] = useState('medium');
  const [videoBitrate, setVideoBitrate] = useState('');
  const [audioBitrate, setAudioBitrate] = useState('128');
  const [resolution, setResolution] = useState('original');

  const isImage = file?.type.startsWith('image/');
  const isVideo = file?.type.startsWith('video/');

  const handleCompress = () => {
    let options = {};
    if (isImage) {
      options.quality = quality;
      if (format !== 'original') options.format = format;
    } else {
      options.preset = videoPreset;
      if (videoPreset === 'custom') {
        if (videoBitrate) options.videoBitrate = videoBitrate;
        if (audioBitrate) options.audioBitrate = audioBitrate;
        if (resolution !== 'original') options.resolution = resolution;
      }
    }
    if (platform) options.targetSize = platform.bytes;
    compress(options);
  };

  const handleQualityPreset = (val) => {
    setQualityPreset(val);
    if (val !== 'custom') setQuality(Number(val));
  };

  const handleQualitySlider = (val) => {
    setQuality(val);
    setQualityPreset('custom');
  };

  const handleReset = () => {
    reset();
    setPlatform(null);
    setFormat('original');
    setQualityPreset('80');
    setQuality(80);
    setVideoPreset('medium');
    setVideoBitrate('');
    setAudioBitrate('128');
    setResolution('original');
  };

  return (
    <AnimatePresence mode="wait">
      {state === 'idle' && (
        <motion.div key="upload" {...panelAnimation}>
          <UploadZone
            onFileSelected={selectFile}
            accept="image/*,video/*"
            description="Drop your file here"
            formats="JPEG, PNG, WebP, AVIF, MP4, MOV, AVI, MKV"
          />
        </motion.div>
      )}

      {state === 'configuring' && file && (
        <motion.div key="settings" {...panelAnimation} className={styles.panel}>
          <FileInfo file={file} thumbnailUrl={thumbnailUrl} />

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Compress For</h3>
            <p className={styles.sectionSub}>
              Select a platform to auto-target its file size limit
            </p>
            <PlatformGrid
              fileType={isImage ? 'image' : 'video'}
              selected={platform?.id || null}
              onSelect={(p) => setPlatform(p)}
            />
            {platform && (
              <div className={styles.targetInfo}>
                <span className={styles.targetLabel}>Target size:</span>
                <span className={styles.targetValue}>{platform.limit}</span>
                <button className={styles.clearBtn} onClick={() => setPlatform(null)}>
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Manual Settings</h3>
            <p className={styles.sectionSub}>Or fine-tune compression manually</p>

            {isImage && (
              <>
                <label className={styles.label}>Output Format</label>
                <select
                  className={styles.select}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="original">Keep Original</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                </select>

                <label className={styles.label}>Quality</label>
                <SegmentedControl
                  options={[
                    { value: '40', label: 'Low' },
                    { value: '60', label: 'Medium' },
                    { value: '80', label: 'High' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  value={qualityPreset}
                  onChange={handleQualityPreset}
                />
                <QualitySlider value={quality} onChange={handleQualitySlider} />
              </>
            )}

            {isVideo && (
              <>
                <label className={styles.label}>Preset</label>
                <SegmentedControl
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  value={videoPreset}
                  onChange={setVideoPreset}
                />
                {videoPreset === 'custom' && (
                  <div className={styles.customOptions}>
                    <label className={styles.label}>Video Bitrate (kbps)</label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="2000"
                      value={videoBitrate}
                      onChange={(e) => setVideoBitrate(e.target.value)}
                    />
                    <label className={styles.label}>Audio Bitrate</label>
                    <select
                      className={styles.select}
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(e.target.value)}
                    >
                      <option value="64">64 kbps</option>
                      <option value="128">128 kbps</option>
                      <option value="192">192 kbps</option>
                      <option value="256">256 kbps</option>
                      <option value="320">320 kbps</option>
                    </select>
                    <label className={styles.label}>Resolution</label>
                    <select
                      className={styles.select}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                    >
                      <option value="original">Keep Original</option>
                      <option value="2160">4K (2160p)</option>
                      <option value="1080">1080p</option>
                      <option value="720">720p</option>
                      <option value="480">480p</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <button className={styles.compressBtn} onClick={handleCompress}>
            Compress
          </button>
        </motion.div>
      )}

      {state === 'compressing' && (
        <motion.div key="progress" {...panelAnimation}>
          <ProgressBar percent={progress} label="Compressing..." />
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
            width={result.width}
            height={result.height}
            downloadUrl={downloadUrl}
            onReset={handleReset}
            resetLabel="Compress Another"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
