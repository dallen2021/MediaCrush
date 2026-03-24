// ui.js — DOM manipulation helpers (ES module)

// ---- Panel visibility -------------------------------------------------------

/**
 * Show a panel by removing 'hidden' and adding 'panel-reveal' for animation.
 * Scrolls the panel into view.
 */
export function showPanel(panelId) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add('panel-reveal');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide a panel by adding 'hidden' and removing 'panel-reveal'.
 */
export function hidePanel(panelId) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.classList.add('hidden');
  el.classList.remove('panel-reveal');
}

// ---- File info bar ----------------------------------------------------------

const VIDEO_ICON_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="10" width="26" height="28" rx="4" stroke="var(--text-muted, #888)" stroke-width="2"/>
  <path d="M32 20L42 14V34L32 28V20Z" fill="var(--text-muted, #888)" opacity="0.5"/>
</svg>`;

/**
 * Populate the file info bar with name, size, thumbnail, and type badge.
 * @param {{ name: string, sizeFormatted: string, isImage: boolean, isVideo: boolean }} fileInfo
 * @param {string} thumbnailUrl - Data URL for thumbnail (or empty string)
 */
export function showFileInfo(fileInfo, thumbnailUrl) {
  const thumbEl = document.getElementById('file-thumbnail');
  const nameEl = document.getElementById('file-name');
  const sizeEl = document.getElementById('file-size');
  const badgeEl = document.getElementById('file-type-badge');

  if (thumbEl) {
    if (thumbnailUrl) {
      thumbEl.innerHTML = `<img src="${thumbnailUrl}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    } else if (fileInfo.isVideo) {
      thumbEl.innerHTML = VIDEO_ICON_SVG;
    } else {
      thumbEl.innerHTML = '';
    }
  }

  if (nameEl) nameEl.textContent = fileInfo.name;
  if (sizeEl) sizeEl.textContent = fileInfo.sizeFormatted;

  if (badgeEl) {
    // Determine badge label from MIME type
    const ext = fileInfo.name.split('.').pop().toUpperCase();
    badgeEl.textContent = fileInfo.isImage ? ext : 'VIDEO';
    badgeEl.classList.remove('badge-image', 'badge-video');
    badgeEl.classList.add(fileInfo.isImage ? 'badge-image' : 'badge-video');
  }
}

// ---- Settings toggles -------------------------------------------------------

export function showImageSettings() {
  const imgEl = document.getElementById('image-settings');
  const vidEl = document.getElementById('video-settings');
  if (imgEl) imgEl.classList.remove('hidden');
  if (vidEl) vidEl.classList.add('hidden');
}

export function showVideoSettings() {
  const imgEl = document.getElementById('image-settings');
  const vidEl = document.getElementById('video-settings');
  if (imgEl) imgEl.classList.add('hidden');
  if (vidEl) vidEl.classList.remove('hidden');
}

// ---- Progress bar -----------------------------------------------------------

/**
 * Update the progress bar fill and percentage text.
 * @param {number} percent - 0 to 100
 */
export function updateProgress(percent) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));

  if (fill) fill.style.width = `${clamped}%`;
  if (text) text.textContent = `${clamped}%`;
}

// ---- Results panel ----------------------------------------------------------

/**
 * Populate the results panel with compression outcome.
 * Expects a result object from the server (image) or the SSE completion event (video).
 *
 * Result shape from server:
 *   { id, originalName, originalSize, originalSizeFormatted,
 *     compressedSize, compressedSizeFormatted, savings, width, height, format }
 *
 * For video SSE completions, originalName and originalSize are merged in by app.js.
 */
export function showResults(result) {
  // Original card
  const origNameEl = document.querySelector('#original-card .card-filename');
  const origSizeEl = document.querySelector('#original-card .card-size');
  const origDimsEl = document.querySelector('#original-card .card-dimensions');

  if (origNameEl) origNameEl.textContent = result.originalName || '';
  if (origSizeEl) origSizeEl.textContent = result.originalSizeFormatted || formatSize(result.originalSize || 0);

  if (origDimsEl) {
    if (result.width && result.height) {
      origDimsEl.textContent = `${result.width} x ${result.height}`;
      origDimsEl.style.display = '';
    } else {
      origDimsEl.style.display = 'none';
    }
  }

  // Compressed card
  const compNameEl = document.querySelector('#compressed-card .card-filename');
  const compSizeEl = document.querySelector('#compressed-card .card-size');
  const compDimsEl = document.querySelector('#compressed-card .card-dimensions');
  const compFmtEl = document.querySelector('#compressed-card .card-format');

  if (compNameEl) {
    // Build a meaningful compressed filename
    const baseName = (result.originalName || 'file').replace(/\.[^.]+$/, '');
    const ext = result.format ? `.${result.format}` : '';
    compNameEl.textContent = `compressed_${baseName}${ext}`;
  }
  if (compSizeEl) compSizeEl.textContent = result.compressedSizeFormatted || formatSize(result.compressedSize || 0);

  if (compDimsEl) {
    if (result.width && result.height) {
      compDimsEl.textContent = `${result.width} x ${result.height}`;
      compDimsEl.style.display = '';
    } else {
      compDimsEl.style.display = 'none';
    }
  }

  if (compFmtEl) {
    if (result.format) {
      compFmtEl.textContent = result.format.toUpperCase();
      compFmtEl.style.display = '';
    } else {
      compFmtEl.style.display = 'none';
    }
  }

  // Savings badge
  const badgeEl = document.getElementById('savings-badge');
  if (badgeEl) {
    const origSize = result.originalSize || 0;
    const compSize = result.compressedSize || 0;
    const savingsPercent = origSize > 0
      ? Math.round((1 - compSize / origSize) * 100)
      : 0;

    badgeEl.textContent = savingsPercent >= 0 ? `-${savingsPercent}%` : `+${Math.abs(savingsPercent)}%`;

    // Color coding
    badgeEl.classList.remove('savings-good', 'savings-moderate', 'savings-bad');
    if (savingsPercent >= 30) {
      badgeEl.classList.add('savings-good');       // green — great savings
    } else if (savingsPercent >= 10) {
      badgeEl.classList.add('savings-moderate');    // yellow — moderate
    } else {
      badgeEl.classList.add('savings-bad');         // red — minimal or size increase
    }
  }
}

// ---- Error toast ------------------------------------------------------------

let errorTimeout = null;

/**
 * Show an error message in the toast. Auto-hides after 4 seconds.
 */
export function showError(message) {
  const toast = document.getElementById('error-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show');
  }, 4000);
}

// ---- Reset ------------------------------------------------------------------

/**
 * Reset all UI panels and inputs back to initial state.
 */
export function resetUI() {
  hidePanel('settings-panel');
  hidePanel('progress-panel');
  hidePanel('results-panel');
  showPanel('upload-zone');

  // Reset form inputs to defaults
  const formatSelect = document.getElementById('format-select');
  if (formatSelect) formatSelect.value = 'original';

  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');
  if (qualitySlider) qualitySlider.value = 80;
  if (qualityValue) qualityValue.textContent = '80';

  // Reset image quality presets — set "High" as active
  document.querySelectorAll('#quality-presets .seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.quality === '80');
  });

  // Reset video presets — set "Medium" as active
  document.querySelectorAll('#video-presets .seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === 'medium');
  });

  // Hide video custom options
  const customOpts = document.getElementById('video-custom-options');
  if (customOpts) customOpts.classList.add('hidden');

  // Reset video custom fields
  const videoBitrate = document.getElementById('video-bitrate');
  if (videoBitrate) videoBitrate.value = '';

  const audioBitrate = document.getElementById('audio-bitrate');
  if (audioBitrate) audioBitrate.value = '128';

  const videoRes = document.getElementById('video-resolution');
  if (videoRes) videoRes.value = 'original';

  // Reset progress bar
  updateProgress(0);

  // Show image settings by default, hide video
  showImageSettings();
}

// ---- Compress button state --------------------------------------------------

/**
 * Toggle the compress button between loading and normal states.
 */
export function setCompressButtonLoading(loading) {
  const btn = document.getElementById('compress-btn');
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.textContent = 'Compressing...';
  } else {
    btn.disabled = false;
    btn.textContent = 'Compress';
  }
}

// ---- Utility ----------------------------------------------------------------

/**
 * Convert a byte count to a human-readable string.
 * 0 -> "0 B", 1024 -> "1.0 KB", 1048576 -> "1.0 MB"
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return i === 0 ? `${bytes} B` : `${value.toFixed(1)} ${units[i]}`;
}
