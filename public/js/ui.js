// ui.js — DOM manipulation helpers (ES module)

// ---- Platform presets -------------------------------------------------------

export const PLATFORMS = [
  { id: 'x',          name: 'X / Twitter',  limit: '5 MB',   bytes: 5242880,    type: 'image' },
  { id: 'instagram',  name: 'Instagram',     limit: '30 MB',  bytes: 31457280,   type: 'image' },
  { id: 'discord',    name: 'Discord',       limit: '10 MB',  bytes: 10485760,   type: 'all'   },
  { id: 'discord-n',  name: 'Discord Nitro', limit: '50 MB',  bytes: 52428800,   type: 'all'   },
  { id: 'whatsapp',   name: 'WhatsApp',      limit: '16 MB',  bytes: 16777216,   type: 'all'   },
  { id: 'email',      name: 'Email',         limit: '25 MB',  bytes: 26214400,   type: 'all'   },
  { id: 'reddit',     name: 'Reddit',        limit: '20 MB',  bytes: 20971520,   type: 'image' },
  { id: 'tiktok',     name: 'TikTok',        limit: '287 MB', bytes: 300941312,  type: 'video' },
];

export const PLATFORM_ICONS = {
  'x': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M15.27 2h2.51l-5.49 6.27L18.75 18h-5.06l-3.96-5.18L5.19 18H2.68l5.87-6.71L2.25 2h5.19l3.58 4.73L15.27 2zm-.88 14.37h1.39L6.73 3.43H5.24l9.15 12.94z"/></svg>`,
  'instagram': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="4"/><circle cx="10" cy="10" r="3.5"/><circle cx="14.5" cy="5.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  'discord': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M16.07 4.58A14.2 14.2 0 0012.54 3.4a.05.05 0 00-.06.03c-.15.27-.33.63-.45.91a13.12 13.12 0 00-3.96 0 9.12 9.12 0 00-.46-.91.05.05 0 00-.05-.03c-1.2.21-2.36.56-3.54 1.18a.05.05 0 00-.02.02C1.8 8.25 1.2 11.82 1.5 15.34a.06.06 0 00.02.04 14.3 14.3 0 004.31 2.18.05.05 0 00.06-.02c.33-.46.63-.94.88-1.45a.05.05 0 00-.03-.07 9.42 9.42 0 01-1.35-.64.05.05 0 01-.01-.09c.09-.07.18-.14.27-.21a.05.05 0 01.05-.01c2.84 1.3 5.92 1.3 8.73 0a.05.05 0 01.06.01c.09.07.18.15.27.21a.05.05 0 01-.01.09c-.43.25-.88.47-1.35.64a.05.05 0 00-.03.07c.26.51.55 1 .88 1.45a.05.05 0 00.06.02 14.27 14.27 0 004.32-2.18.06.06 0 00.02-.04c.36-3.85-.6-7.39-2.54-10.73a.04.04 0 00-.02-.02zM7.26 13.2c-.93 0-1.69-.85-1.69-1.9s.75-1.9 1.69-1.9c.95 0 1.7.86 1.69 1.9 0 1.05-.75 1.9-1.69 1.9zm6.24 0c-.93 0-1.69-.85-1.69-1.9s.75-1.9 1.69-1.9c.95 0 1.7.86 1.69 1.9 0 1.05-.74 1.9-1.69 1.9z"/></svg>`,
  'discord-n': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M16.07 4.58A14.2 14.2 0 0012.54 3.4a.05.05 0 00-.06.03c-.15.27-.33.63-.45.91a13.12 13.12 0 00-3.96 0 9.12 9.12 0 00-.46-.91.05.05 0 00-.05-.03c-1.2.21-2.36.56-3.54 1.18a.05.05 0 00-.02.02C1.8 8.25 1.2 11.82 1.5 15.34a.06.06 0 00.02.04 14.3 14.3 0 004.31 2.18.05.05 0 00.06-.02c.33-.46.63-.94.88-1.45a.05.05 0 00-.03-.07 9.42 9.42 0 01-1.35-.64.05.05 0 01-.01-.09c.09-.07.18-.14.27-.21a.05.05 0 01.05-.01c2.84 1.3 5.92 1.3 8.73 0a.05.05 0 01.06.01c.09.07.18.15.27.21a.05.05 0 01-.01.09c-.43.25-.88.47-1.35.64a.05.05 0 00-.03.07c.26.51.55 1 .88 1.45a.05.05 0 00.06.02 14.27 14.27 0 004.32-2.18.06.06 0 00.02-.04c.36-3.85-.6-7.39-2.54-10.73a.04.04 0 00-.02-.02zM7.26 13.2c-.93 0-1.69-.85-1.69-1.9s.75-1.9 1.69-1.9c.95 0 1.7.86 1.69 1.9 0 1.05-.75 1.9-1.69 1.9zm6.24 0c-.93 0-1.69-.85-1.69-1.9s.75-1.9 1.69-1.9c.95 0 1.7.86 1.69 1.9 0 1.05-.74 1.9-1.69 1.9z"/></svg>`,
  'whatsapp': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2C5.59 2 2 5.59 2 10c0 1.5.42 2.9 1.14 4.1L2 18l3.99-1.11A7.96 7.96 0 0010 18c4.41 0 8-3.59 8-8s-3.59-8-8-8zm0 14.5c-1.28 0-2.5-.37-3.54-1.02l-.25-.15-2.6.68.7-2.54-.17-.26A6.46 6.46 0 013.5 10c0-3.58 2.92-6.5 6.5-6.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5zm3.56-4.86c-.2-.1-1.16-.57-1.34-.64-.18-.06-.31-.1-.44.1-.13.2-.5.64-.62.77-.11.13-.23.15-.42.05-.2-.1-.83-.31-1.59-.98-.59-.52-.98-1.17-1.1-1.37-.11-.2-.01-.3.09-.4.09-.09.2-.23.3-.35.1-.12.13-.2.2-.33.06-.13.03-.25-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.33h-.38c-.13 0-.34.05-.52.25-.18.2-.68.66-.68 1.62s.7 1.88.8 2.01c.1.13 1.37 2.09 3.32 2.93.46.2.83.32 1.11.41.47.15.89.13 1.23.08.38-.06 1.16-.47 1.32-.93.17-.46.17-.85.12-.93-.05-.09-.18-.14-.38-.24z"/></svg>`,
  'email': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 6l8 5 8-5"/></svg>`,
  'reddit': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M18 10a1.9 1.9 0 00-3.24-1.35A9.3 9.3 0 0010 7.34a9.3 9.3 0 00-4.76 1.31 1.9 1.9 0 10-2.17 3.07c-.02.19-.03.38-.03.58 0 2.96 3.45 5.37 7.7 5.37s7.7-2.4 7.7-5.37c0-.2-.01-.39-.04-.58A1.9 1.9 0 0018 10zM6.5 11.5a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0zm7.17 3.27c-.88.87-2.2 1.3-3.92 1.3s-3.04-.43-3.92-1.3a.5.5 0 01.71-.71c.67.67 1.73 1 3.21 1s2.54-.33 3.21-1a.5.5 0 01.71.71zm-.42-2.02a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zM15.5 3l-2.5 4.5M12 2.5l1 1"/></svg>`,
  'tiktok': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M16.5 5.5A3.5 3.5 0 0113 2h-2.5v11a2.5 2.5 0 11-2-2.45V8a5 5 0 104.5 4.97V9.14A6 6 0 0016.5 11V8a3.49 3.49 0 01-3-2.5h3z"/></svg>`,
};

/**
 * Render platform preset buttons into #platform-grid based on file type.
 * @param {{ isImage: boolean, isVideo: boolean }} fileInfo
 */
export function renderPlatformGrid(fileInfo) {
  const grid = document.getElementById('platform-grid');
  if (!grid) return;

  // Determine which type filter to apply
  const fileType = fileInfo.isImage ? 'image' : fileInfo.isVideo ? 'video' : 'all';

  // Filter platforms: show 'all' type platforms + those matching the file type
  const filtered = PLATFORMS.filter(
    (p) => p.type === 'all' || p.type === fileType
  );

  grid.innerHTML = filtered
    .map(
      (p) => `
    <button type="button" class="platform-btn" data-platform-id="${p.id}" data-limit="${p.limit}" data-bytes="${p.bytes}">
      <span class="platform-icon">${PLATFORM_ICONS[p.id] || ''}</span>
      <span class="platform-name">${p.name}</span>
      <span class="platform-limit">${p.limit}</span>
    </button>`
    )
    .join('');
}

/**
 * Get the currently selected platform object, or null if none selected.
 */
export function getSelectedPlatform() {
  const activeBtn = document.querySelector('.platform-btn.active');
  if (!activeBtn) return null;

  const id = activeBtn.dataset.platformId;
  return PLATFORMS.find((p) => p.id === id) || null;
}

/**
 * Deselect all platform buttons and hide the target info bar.
 */
export function clearPlatformSelection() {
  document.querySelectorAll('.platform-btn').forEach((b) => b.classList.remove('active'));
  const targetInfo = document.getElementById('target-info');
  if (targetInfo) targetInfo.classList.add('hidden');
}

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
