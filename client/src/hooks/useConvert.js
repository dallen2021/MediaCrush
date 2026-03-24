import { useState, useCallback, useRef } from 'react';
import { convertFile, subscribeProgress, getDownloadUrl } from '../utils/api';

export default function useConvert() {
  const [state, setState] = useState('idle'); // idle | configuring | converting | done
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
    try {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setThumbnailUrl(reader.result);
        reader.readAsDataURL(f);
      } else {
        setThumbnailUrl('');
      }
    } catch {
      setThumbnailUrl('');
    }
  }, []);

  const convert = useCallback(async (targetFormat) => {
    if (!file) return;
    setState('converting');
    setProgress(0);

    try {
      const res = await convertFile(file, { targetFormat });

      if (res.status === 'processing') {
        setJobId(res.id);
        sseRef.current = subscribeProgress(
          res.id,
          (p) => setProgress(p),
          (data) => {
            data.originalName = res.originalName || file.name;
            data.originalSize = res.originalSize || file.size;
            data.id = res.id;
            data.format = targetFormat;
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
        res.format = targetFormat;
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
    convert,
    reset,
  };
}
