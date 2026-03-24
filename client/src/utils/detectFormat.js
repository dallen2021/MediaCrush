const IMAGE_FORMATS = [
  { ext: 'jpeg', label: 'JPEG Image', mimes: ['image/jpeg', 'image/jpg'] },
  { ext: 'png', label: 'PNG Image', mimes: ['image/png'] },
  { ext: 'webp', label: 'WebP Image', mimes: ['image/webp'] },
  { ext: 'avif', label: 'AVIF Image', mimes: ['image/avif'] },
];

const VIDEO_FORMATS = [
  { ext: 'mp4', label: 'MP4 Video', mimes: ['video/mp4'] },
  { ext: 'mov', label: 'MOV Video', mimes: ['video/quicktime'] },
  { ext: 'avi', label: 'AVI Video', mimes: ['video/x-msvideo', 'video/avi'] },
  { ext: 'mkv', label: 'MKV Video', mimes: ['video/x-matroska'] },
  { ext: 'webm', label: 'WebM Video', mimes: ['video/webm'] },
];

const AUDIO_FORMATS = [
  { ext: 'mp3', label: 'MP3 Audio', mimes: ['audio/mpeg', 'audio/mp3'] },
  { ext: 'wav', label: 'WAV Audio', mimes: ['audio/wav', 'audio/x-wav'] },
  { ext: 'aac', label: 'AAC Audio', mimes: ['audio/aac'] },
  { ext: 'ogg', label: 'OGG Audio', mimes: ['audio/ogg'] },
  { ext: 'flac', label: 'FLAC Audio', mimes: ['audio/flac', 'audio/x-flac'] },
];

const ALL_FORMATS = [
  ...IMAGE_FORMATS.map(f => ({ ...f, category: 'image' })),
  ...VIDEO_FORMATS.map(f => ({ ...f, category: 'video' })),
  ...AUDIO_FORMATS.map(f => ({ ...f, category: 'audio' })),
];

export function detectFormat(file) {
  const mime = file.type.toLowerCase();
  const fileExt = file.name.split('.').pop().toLowerCase();
  let match = ALL_FORMATS.find(f => f.mimes.includes(mime));
  if (!match) match = ALL_FORMATS.find(f => f.ext === fileExt);
  if (!match) {
    if (mime.startsWith('image/')) return { ext: fileExt, label: fileExt.toUpperCase(), category: 'image' };
    if (mime.startsWith('video/')) return { ext: fileExt, label: fileExt.toUpperCase(), category: 'video' };
    if (mime.startsWith('audio/')) return { ext: fileExt, label: fileExt.toUpperCase(), category: 'audio' };
    return null;
  }
  return { ext: match.ext, label: match.label, category: match.category };
}

export function getTargetFormats(file) {
  const current = detectFormat(file);
  if (!current) return [];
  let formats;
  if (current.category === 'image') formats = IMAGE_FORMATS;
  else if (current.category === 'video') formats = VIDEO_FORMATS;
  else formats = AUDIO_FORMATS;
  return formats.filter(f => f.ext !== current.ext);
}
