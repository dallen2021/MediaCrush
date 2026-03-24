// upload.js — Drag-and-drop, file selection, and file utilities (ES module)

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;   // 2 GB

/**
 * Initialize the upload zone with drag-and-drop and click-to-browse.
 * @param {function} onFileSelected - Callback receiving the validated File object
 */
export function initUploadZone(onFileSelected) {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (!uploadZone || !fileInput) return;

  // Click anywhere on the zone to open the file picker
  uploadZone.addEventListener('click', (e) => {
    // Avoid double-trigger if the hidden input itself is clicked
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  // File selected via the browser dialog
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const validated = validateFile(file);
    if (validated) onFileSelected(validated);
    // Reset so the same file can be re-selected
    fileInput.value = '';
  });

  // --- Drag-and-drop events ---
  uploadZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (!file) return;
    const validated = validateFile(file);
    if (validated) onFileSelected(validated);
  });
}

/**
 * Validate a file's type and size. Dispatches an error event if invalid.
 * @param {File} file
 * @returns {File|null} The file if valid, null otherwise
 */
function validateFile(file) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    dispatchError('Unsupported file type. Please upload an image or video.');
    return null;
  }

  if (file.size > MAX_FILE_SIZE) {
    dispatchError('Files must be under 2 GB.');
    return null;
  }

  return file;
}

/**
 * Dispatch a custom error event that the UI layer can listen for.
 */
function dispatchError(message) {
  window.dispatchEvent(new CustomEvent('upload-error', { detail: message }));
}

/**
 * Extract useful metadata from a File object.
 * @param {File} file
 * @returns {{ name: string, size: number, sizeFormatted: string, type: string, isImage: boolean, isVideo: boolean }}
 */
export function getFileInfo(file) {
  return {
    name: file.name,
    size: file.size,
    sizeFormatted: formatSizeLocal(file.size),
    type: file.type,
    isImage: file.type.startsWith('image/'),
    isVideo: file.type.startsWith('video/'),
  };
}

/**
 * Create a thumbnail data URL for preview.
 * @param {File} file
 * @returns {Promise<string>} A data URL string
 */
export function createThumbnail(file) {
  if (file.type.startsWith('image/')) {
    return createImageThumbnail(file);
  }
  if (file.type.startsWith('video/')) {
    return createVideoThumbnail(file);
  }
  // Fallback: return empty string (no thumbnail)
  return Promise.resolve('');
}

function createImageThumbnail(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function createVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.addEventListener('loadeddata', () => {
      // Seek to 1 second (or 0 if video is shorter)
      video.currentTime = Math.min(1, video.duration || 0);
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve('');
      }
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(''); // Graceful fallback — no thumbnail
    });
  });
}

/**
 * Local size formatter (also exported from ui.js, but duplicated here to keep upload.js self-contained).
 */
function formatSizeLocal(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return i === 0 ? `${bytes} B` : `${value.toFixed(1)} ${units[i]}`;
}
