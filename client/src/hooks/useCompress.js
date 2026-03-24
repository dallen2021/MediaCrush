import { useState, useCallback, useRef } from 'react';
import { compressFile, subscribeProgress, getDownloadUrl } from '../utils/api';

export default function useCompress() {
  const [state, setState] = useState('idle'); // idle | configuring | compressing | done
  const [file, setFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const sseRef = useRef(null);

  const selectFile = useCallback(async (f) => {
    setFile(f);
    setState('configuring');
    setResult(null);
    setJobId(null);
    setProgress(0);
    // Generate thumbnail
    try {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setThumbnailUrl(reader.result);
        reader.readAsDataURL(f);
      } else if (f.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.muted = true;
        video.preload = 'metadata';
        const url = URL.createObjectURL(f);
        video.src = url;
        video.addEventListener('loadeddata', () => {
          video.currentTime = Math.min(1, video.duration);
        });
        video.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.7));
          URL.revokeObjectURL(url);
        });
        video.addEventListener('error', () => {
          URL.revokeObjectURL(url);
          setThumbnailUrl('');
        });
      } else {
        setThumbnailUrl('');
      }
    } catch {
      setThumbnailUrl('');
    }
  }, []);

  const compress = useCallback(async (options) => {
    if (!file) return;
    setState('compressing');
    setProgress(0);

    try {
      const res = await compressFile(file, options);

      if (res.status === 'processing') {
        // Video — SSE progress
        setJobId(res.id);
        sseRef.current = subscribeProgress(
          res.id,
          (p) => setProgress(p),
          (data) => {
            data.originalName = res.originalName || file.name;
            data.originalSize = res.originalSize || file.size;
            data.originalSizeFormatted = res.originalSizeFormatted || '';
            data.id = res.id;
            setResult(data);
            setJobId(res.id);
            setState('done');
          },
          (err) => {
            window.dispatchEvent(
              new CustomEvent('mediacrush-error', { detail: err }),
            );
            setState('configuring');
          },
        );
      } else {
        // Image — immediate
        setResult(res);
        setJobId(res.id);
        setState('done');
      }
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent('mediacrush-error', { detail: err.message }),
      );
      setState('configuring');
    }
  }, [file]);

  const reset = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setFile(null);
    setThumbnailUrl('');
    setState('idle');
    setResult(null);
    setJobId(null);
    setProgress(0);
  }, []);

  return {
    state,
    file,
    thumbnailUrl,
    progress,
    result,
    downloadUrl: jobId ? getDownloadUrl(jobId) : null,
    selectFile,
    compress,
    reset,
  };
}
