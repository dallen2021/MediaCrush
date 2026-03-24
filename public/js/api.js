// api.js — Server communication layer (ES module)

/**
 * Send a file to the server for compression.
 * @param {File} file - The file to compress
 * @param {Object} options - Compression options (quality, format, preset, etc.)
 * @returns {Promise<Object>} - Server response JSON
 *   For images: full result with id, originalName, originalSize, compressedSize, etc.
 *   For video: { id, status: 'processing', originalName, originalSize }
 */
export async function compressFile(file, options) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));

  const response = await fetch('/api/compress', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data;
}

/**
 * Subscribe to real-time SSE progress for a video compression job.
 * @param {string} jobId - The job ID returned from compressFile
 * @param {function} onProgress - Called with progress percentage (0-100)
 * @param {function} onComplete - Called with final result data when done
 * @param {function} onError - Called with error message string
 * @returns {EventSource} - The EventSource instance (caller can close it)
 */
export function subscribeProgress(jobId, onProgress, onComplete, onError) {
  const source = new EventSource(`/api/progress/${jobId}`);

  source.onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.status === 'completed') {
      source.close();
      if (onComplete) onComplete(data);
    } else if (data.status === 'error') {
      source.close();
      if (onError) onError(data.error || 'Compression failed');
    } else {
      if (onProgress) onProgress(data.progress);
    }
  };

  source.onerror = () => {
    source.close();
    if (onError) onError('Lost connection to server');
  };

  return source;
}

/**
 * Get the download URL for a completed job.
 * @param {string} jobId
 * @returns {string}
 */
export function getDownloadUrl(jobId) {
  return `/api/download/${jobId}`;
}
