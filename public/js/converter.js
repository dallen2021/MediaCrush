// converter.js — Format conversion utilities (ES module)

const IMAGE_FORMATS = [
  { ext: 'jpeg', label: 'JPEG Image', mimes: ['image/jpeg', 'image/jpg'] },
  { ext: 'png',  label: 'PNG Image',  mimes: ['image/png'] },
  { ext: 'webp', label: 'WebP Image', mimes: ['image/webp'] },
  { ext: 'avif', label: 'AVIF Image', mimes: ['image/avif'] },
];

const VIDEO_FORMATS = [
  { ext: 'mp4',  label: 'MP4 Video',  mimes: ['video/mp4'] },
  { ext: 'mov',  label: 'MOV Video',  mimes: ['video/quicktime'] },
  { ext: 'avi',  label: 'AVI Video',  mimes: ['video/x-msvideo', 'video/avi'] },
  { ext: 'mkv',  label: 'MKV Video',  mimes: ['video/x-matroska'] },
  { ext: 'webm', label: 'WebM Video', mimes: ['video/webm'] },
];

const AUDIO_FORMATS = [
  { ext: 'mp3',  label: 'MP3 Audio',  mimes: ['audio/mpeg', 'audio/mp3'] },
  { ext: 'wav',  label: 'WAV Audio',  mimes: ['audio/wav', 'audio/x-wav'] },
  { ext: 'aac',  label: 'AAC Audio',  mimes: ['audio/aac'] },
  { ext: 'ogg',  label: 'OGG Audio',  mimes: ['audio/ogg'] },
  { ext: 'flac', label: 'FLAC Audio', mimes: ['audio/flac', 'audio/x-flac'] },
];

/**
 * Detect the current format of a file from its MIME type and extension.
 * Returns { ext, label, category } or null.
 */
export function detectFormat(file) {
  const mime = file.type.toLowerCase();
  const fileExt = file.name.split('.').pop().toLowerCase();

  const allFormats = [
    ...IMAGE_FORMATS.map(f => ({ ...f, category: 'image' })),
    ...VIDEO_FORMATS.map(f => ({ ...f, category: 'video' })),
    ...AUDIO_FORMATS.map(f => ({ ...f, category: 'audio' })),
  ];

  // Try MIME match first
  let match = allFormats.find(f => f.mimes.includes(mime));

  // Fallback: match by extension
  if (!match) {
    match = allFormats.find(f => f.ext === fileExt);
  }

  // Final fallback: guess from MIME prefix
  if (!match) {
    if (mime.startsWith('image/')) return { ext: fileExt, label: fileExt.toUpperCase(), category: 'image' };
    if (mime.startsWith('video/')) return { ext: fileExt, label: fileExt.toUpperCase(), category: 'video' };
    if (mime.startsWith('audio/')) return { ext: fileExt, label: fileExt.toUpperCase(), category: 'audio' };
    return null;
  }

  return { ext: match.ext, label: match.label, category: match.category };
}

/**
 * Get available target formats for a file, excluding its current format.
 */
export function getTargetFormats(file) {
  const current = detectFormat(file);
  if (!current) return [];

  let formats;
  switch (current.category) {
    case 'image': formats = IMAGE_FORMATS; break;
    case 'video': formats = VIDEO_FORMATS; break;
    case 'audio': formats = AUDIO_FORMATS; break;
    default: return [];
  }

  // Filter out the current format
  return formats.filter(f => f.ext !== current.ext);
}

/**
 * Render format selection buttons into the #convert-format-grid element.
 * Returns nothing; buttons are rendered into the DOM.
 */
export function renderFormatGrid(file) {
  const grid = document.getElementById('convert-format-grid');
  if (!grid) return;

  const formats = getTargetFormats(file);

  grid.innerHTML = formats.map(f => `
    <button type="button" class="format-btn" data-format="${f.ext}">
      <span class="format-ext">.${f.ext}</span>
      <span class="format-label">${f.label.split(' ')[0]}</span>
    </button>
  `).join('');
}

/**
 * Get the currently selected target format, or null.
 */
export function getSelectedFormat() {
  const active = document.querySelector('#convert-format-grid .format-btn.active');
  return active ? active.dataset.format : null;
}

/**
 * Clear format selection.
 */
export function clearFormatSelection() {
  document.querySelectorAll('#convert-format-grid .format-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('convert-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Select a format';
  }
}
