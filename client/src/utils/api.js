export async function compressFile(file, options) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));
  const res = await fetch('/api/compress', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

export async function convertFile(file, options) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));
  const res = await fetch('/api/convert', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

export function subscribeProgress(jobId, onProgress, onComplete, onError) {
  const source = new EventSource(`/api/progress/${jobId}`);
  source.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    if (data.status === 'completed') { source.close(); onComplete?.(data); }
    else if (data.status === 'error') { source.close(); onError?.(data.error || 'Failed'); }
    else { onProgress?.(data.progress); }
  };
  source.onerror = () => { source.close(); onError?.('Lost connection'); };
  return source;
}

export function getDownloadUrl(jobId) {
  return `/api/download/${jobId}`;
}
