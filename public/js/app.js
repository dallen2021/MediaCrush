// app.js — Main application orchestration (ES module)

import { initUploadZone, getFileInfo, createThumbnail } from './upload.js';
import { compressFile, subscribeProgress, getDownloadUrl, convertFile } from './api.js';
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
  formatSize,
} from './ui.js';
import { detectFormat, renderFormatGrid, getSelectedFormat, clearFormatSelection } from './converter.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentFile = null;
let currentJobId = null;
let currentConvertFile = null;
let convertJobId = null;

// ---------------------------------------------------------------------------
// Page switching
// ---------------------------------------------------------------------------
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  // Show target page
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.remove('hidden');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (nav) nav.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {

  // --- Sidebar navigation ---
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      showPage(btn.dataset.page);
    });
  });

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

  // --- Convert page: upload zone ---
  const convertUploadZone = document.getElementById('convert-upload-zone');
  const convertFileInput = document.getElementById('convert-file-input');

  if (convertUploadZone && convertFileInput) {
    convertUploadZone.addEventListener('click', (e) => {
      if (e.target !== convertFileInput) convertFileInput.click();
    });

    convertFileInput.addEventListener('change', () => {
      const file = convertFileInput.files[0];
      if (file) handleConvertFileSelected(file);
      convertFileInput.value = '';
    });

    // Drag and drop for convert zone
    convertUploadZone.addEventListener('dragenter', (e) => { e.preventDefault(); convertUploadZone.classList.add('dragover'); });
    convertUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); convertUploadZone.classList.add('dragover'); });
    convertUploadZone.addEventListener('dragleave', () => { convertUploadZone.classList.remove('dragover'); });
    convertUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      convertUploadZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleConvertFileSelected(file);
    });
  }

  // --- Convert page: format grid click ---
  const convertFormatGrid = document.getElementById('convert-format-grid');
  if (convertFormatGrid) {
    convertFormatGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.format-btn');
      if (!btn) return;

      document.querySelectorAll('#convert-format-grid .format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Enable convert button
      const convertBtn = document.getElementById('convert-btn');
      if (convertBtn) {
        convertBtn.disabled = false;
        convertBtn.textContent = `Convert to .${btn.dataset.format.toUpperCase()}`;
      }
    });
  }

  // --- Convert button ---
  const convertBtn = document.getElementById('convert-btn');
  if (convertBtn) {
    convertBtn.addEventListener('click', handleConvert);
  }

  // --- Convert download ---
  const convertDownloadBtn = document.getElementById('convert-download-btn');
  if (convertDownloadBtn) {
    convertDownloadBtn.addEventListener('click', () => {
      if (convertJobId) window.location.href = getDownloadUrl(convertJobId);
    });
  }

  // --- Convert reset ---
  const convertResetBtn = document.getElementById('convert-reset-btn');
  if (convertResetBtn) {
    convertResetBtn.addEventListener('click', resetConvertUI);
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

// ---------------------------------------------------------------------------
// Convert: file selected handler
// ---------------------------------------------------------------------------
async function handleConvertFileSelected(file) {
  currentConvertFile = file;
  convertJobId = null;

  const info = getFileInfo(file);
  const format = detectFormat(file);

  // Hide upload zone, show settings
  hidePanel('convert-upload-zone');
  showPanel('convert-settings');

  // Show file info
  const nameEl = document.getElementById('convert-file-name');
  const sizeEl = document.getElementById('convert-file-size');
  const formatBadge = document.getElementById('convert-current-format');

  if (nameEl) nameEl.textContent = info.name;
  if (sizeEl) sizeEl.textContent = info.sizeFormatted;
  if (formatBadge) {
    formatBadge.textContent = format ? format.ext.toUpperCase() : info.name.split('.').pop().toUpperCase();
  }

  // Thumbnail
  const thumbEl = document.getElementById('convert-file-thumbnail');
  if (thumbEl) {
    try {
      const thumb = await createThumbnail(file);
      if (thumb) {
        thumbEl.innerHTML = `<img src="${thumb}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
      } else {
        thumbEl.innerHTML = '';
      }
    } catch {
      thumbEl.innerHTML = '';
    }
  }

  // Render format grid
  renderFormatGrid(file);
  clearFormatSelection();
}

// ---------------------------------------------------------------------------
// Convert: compress handler
// ---------------------------------------------------------------------------
async function handleConvert() {
  if (!currentConvertFile) return;

  const targetFormat = getSelectedFormat();
  if (!targetFormat) {
    showError('Please select a target format.');
    return;
  }

  // Show progress
  const convertBtn = document.getElementById('convert-btn');
  if (convertBtn) { convertBtn.disabled = true; convertBtn.textContent = 'Converting...'; }
  hidePanel('convert-settings');
  showPanel('convert-progress');

  // Reset progress
  const fill = document.getElementById('convert-progress-fill');
  const text = document.getElementById('convert-progress-text');
  if (fill) fill.style.width = '0%';
  if (text) text.textContent = '0%';

  try {
    const result = await convertFile(currentConvertFile, { targetFormat });

    if (result.status === 'processing') {
      // Video/audio — SSE progress
      convertJobId = result.id;
      subscribeProgress(
        result.id,
        (progress) => {
          if (fill) fill.style.width = `${progress}%`;
          if (text) text.textContent = `${progress}%`;
        },
        (finalData) => {
          finalData.originalName = result.originalName || currentConvertFile.name;
          finalData.originalSize = result.originalSize || currentConvertFile.size;
          finalData.id = result.id;
          finalData.format = targetFormat;
          showConvertResults(finalData);
        },
        (error) => {
          showError(error || 'Conversion failed');
          resetConvertToSettings();
        }
      );
    } else {
      // Image — immediate result
      convertJobId = result.id;
      result.format = targetFormat;
      showConvertResults(result);
    }
  } catch (err) {
    showError(err.message || 'Conversion failed');
    resetConvertToSettings();
  }
}

// ---------------------------------------------------------------------------
// Convert: results display
// ---------------------------------------------------------------------------
function showConvertResults(result) {
  hidePanel('convert-progress');
  showPanel('convert-results');

  const sourceFormat = detectFormat(currentConvertFile);

  // Format change badge
  const fromEl = document.querySelector('#convert-format-badge .from-format');
  const toEl = document.querySelector('#convert-format-badge .to-format');
  if (fromEl) fromEl.textContent = sourceFormat ? sourceFormat.ext.toUpperCase() : '?';
  if (toEl) toEl.textContent = (result.format || '').toUpperCase();

  // Original card
  const origName = document.querySelector('#convert-original-card .card-filename');
  const origSize = document.querySelector('#convert-original-card .card-size');
  if (origName) origName.textContent = result.originalName || '';
  if (origSize) origSize.textContent = result.originalSizeFormatted || formatSize(result.originalSize || 0);

  // Converted card
  const convName = document.querySelector('#convert-converted-card .card-filename');
  const convSize = document.querySelector('#convert-converted-card .card-size');
  const convFmt = document.querySelector('#convert-converted-card .card-format');
  if (convName) {
    const baseName = (result.originalName || 'file').replace(/\.[^.]+$/, '');
    convName.textContent = `${baseName}.${result.format}`;
  }
  if (convSize) convSize.textContent = result.compressedSizeFormatted || formatSize(result.compressedSize || 0);
  if (convFmt) convFmt.textContent = (result.format || '').toUpperCase();
}

// ---------------------------------------------------------------------------
// Convert: reset helpers
// ---------------------------------------------------------------------------
function resetConvertToSettings() {
  hidePanel('convert-progress');
  showPanel('convert-settings');
  const convertBtn = document.getElementById('convert-btn');
  if (convertBtn) { convertBtn.disabled = false; convertBtn.textContent = 'Convert'; }
}

function resetConvertUI() {
  currentConvertFile = null;
  convertJobId = null;
  hidePanel('convert-settings');
  hidePanel('convert-progress');
  hidePanel('convert-results');
  showPanel('convert-upload-zone');
  clearFormatSelection();
}
