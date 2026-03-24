// app.js — Main application orchestration (ES module)

import { initUploadZone, getFileInfo, createThumbnail } from './upload.js';
import { compressFile, subscribeProgress, getDownloadUrl } from './api.js';
import {
  showPanel,
  hidePanel,
  showFileInfo,
  showImageSettings,
  showVideoSettings,
  updateProgress,
  showResults,
  showError,
  resetUI,
  setCompressButtonLoading,
  renderPlatformGrid,
  getSelectedPlatform,
  clearPlatformSelection,
} from './ui.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentFile = null;
let currentJobId = null;

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  // 1. Upload zone (drag-and-drop + click)
  initUploadZone(handleFileSelected);

  // Listen for validation errors from the upload module
  window.addEventListener('upload-error', (e) => {
    showError(e.detail);
  });

  // 2. Image quality preset buttons
  document.querySelectorAll('#quality-presets .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('#quality-presets .seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const quality = btn.dataset.quality;
      const slider = document.getElementById('quality-slider');
      const display = document.getElementById('quality-value');

      if (quality !== 'custom' && slider && display) {
        slider.value = quality;
        display.textContent = quality;
      }
      // "Custom" simply leaves the slider wherever it is so the user can adjust
    });
  });

  // 3. Quality slider — update the display value on input
  const qualitySlider = document.getElementById('quality-slider');
  if (qualitySlider) {
    qualitySlider.addEventListener('input', (e) => {
      const display = document.getElementById('quality-value');
      if (display) display.textContent = e.target.value;

      // If user drags the slider, auto-select "Custom" preset
      document.querySelectorAll('#quality-presets .seg-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.quality === 'custom');
      });
    });
  }

  // 4. Video preset buttons
  document.querySelectorAll('#video-presets .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#video-presets .seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const customPanel = document.getElementById('video-custom-options');
      if (customPanel) {
        if (btn.dataset.preset === 'custom') {
          customPanel.classList.remove('hidden');
        } else {
          customPanel.classList.add('hidden');
        }
      }
    });
  });

  // 5. Compress button
  const compressBtn = document.getElementById('compress-btn');
  if (compressBtn) {
    compressBtn.addEventListener('click', handleCompress);
  }

  // 6. Download button
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (currentJobId) {
        window.location.href = getDownloadUrl(currentJobId);
      }
    });
  }

  // 7. Reset button (compress another)
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFile = null;
      currentJobId = null;
      clearPlatformSelection();
      resetUI();
    });
  }

  // 8. Platform grid — event delegation for preset buttons
  const platformGrid = document.getElementById('platform-grid');
  if (platformGrid) {
    platformGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.platform-btn');
      if (!btn) return;

      // Toggle active state
      document.querySelectorAll('.platform-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Show target info
      const targetInfo = document.getElementById('target-info');
      const targetDisplay = document.getElementById('target-size-display');
      if (targetInfo) targetInfo.classList.remove('hidden');
      if (targetDisplay) targetDisplay.textContent = btn.dataset.limit;
    });
  }

  // 9. Clear target button
  const clearTargetBtn = document.getElementById('clear-target');
  if (clearTargetBtn) {
    clearTargetBtn.addEventListener('click', () => {
      clearPlatformSelection();
    });
  }
});

// ---------------------------------------------------------------------------
// File selected handler
// ---------------------------------------------------------------------------
async function handleFileSelected(file) {
  currentFile = file;
  currentJobId = null;
  const info = getFileInfo(file);

  // Transition panels
  hidePanel('upload-zone');
  showPanel('settings-panel');

  // Create and display thumbnail
  try {
    const thumb = await createThumbnail(file);
    showFileInfo(info, thumb);
  } catch {
    // Thumbnail failed — show info without it
    showFileInfo(info, '');
  }

  // Populate platform presets for this file type
  renderPlatformGrid(info);

  // Show the right settings section
  if (info.isImage) {
    showImageSettings();
  } else {
    showVideoSettings();
  }
}

// ---------------------------------------------------------------------------
// Compress handler
// ---------------------------------------------------------------------------
async function handleCompress() {
  if (!currentFile) return;

  const info = getFileInfo(currentFile);

  // Gather options based on file type
  let options = {};

  if (info.isImage) {
    const formatSelect = document.getElementById('format-select');
    const qualitySlider = document.getElementById('quality-slider');
    const format = formatSelect ? formatSelect.value : 'original';
    const quality = qualitySlider ? parseInt(qualitySlider.value, 10) : 80;

    options = { quality };
    if (format && format !== 'original') {
      options.format = format;
    }
  } else {
    // Video — determine active preset
    const activeBtn = document.querySelector('#video-presets .seg-btn.active');
    const preset = activeBtn ? activeBtn.dataset.preset : 'medium';
    options = { preset };

    if (preset === 'custom') {
      const vb = document.getElementById('video-bitrate');
      const ab = document.getElementById('audio-bitrate');
      const vr = document.getElementById('video-resolution');

      if (vb && vb.value) options.videoBitrate = vb.value;
      if (ab && ab.value) options.audioBitrate = ab.value;
      if (vr && vr.value && vr.value !== 'original') options.resolution = vr.value;
    }
  }

  // If a platform target is selected, add targetSize to options
  const selectedPlatform = getSelectedPlatform();
  if (selectedPlatform) {
    options.targetSize = selectedPlatform.bytes;
  }

  // Show progress
  setCompressButtonLoading(true);
  hidePanel('settings-panel');
  showPanel('progress-panel');
  updateProgress(0);

  try {
    const result = await compressFile(currentFile, options);

    if (result.status === 'processing') {
      // Video — subscribe to SSE progress stream
      currentJobId = result.id;

      subscribeProgress(
        result.id,
        (progress) => {
          updateProgress(progress);
        },
        (finalData) => {
          // The SSE completion event has compressedSize, savings, etc.
          // Merge in the original file info that only we know client-side.
          finalData.originalName = result.originalName || currentFile.name;
          finalData.originalSize = result.originalSize || currentFile.size;
          finalData.originalSizeFormatted = result.originalSizeFormatted || '';
          finalData.id = result.id;
          showCompressionResults(finalData);
        },
        (error) => {
          showError(error || 'Video compression failed');
          resetToSettings();
        }
      );
    } else {
      // Image — result is the final payload
      currentJobId = result.id;
      showCompressionResults(result);
    }
  } catch (err) {
    showError(err.message || 'Compression failed');
    resetToSettings();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showCompressionResults(result) {
  hidePanel('progress-panel');
  showPanel('results-panel');
  showResults(result);
  setCompressButtonLoading(false);
}

function resetToSettings() {
  hidePanel('progress-panel');
  showPanel('settings-panel');
  setCompressButtonLoading(false);
}
