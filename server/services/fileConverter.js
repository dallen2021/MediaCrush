const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Point fluent-ffmpeg at the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ---------------------------------------------------------------------------
// Image conversion — high quality, no compression focus
// ---------------------------------------------------------------------------

/**
 * Convert an image to a different format at high quality.
 *
 * @param {string} inputPath    Absolute path to the source image.
 * @param {string} outputPath   Absolute path for the converted output.
 * @param {string} targetFormat Target format ('jpeg', 'jpg', 'png', 'webp', 'avif').
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
async function convertImage(inputPath, outputPath, targetFormat) {
  let pipeline = sharp(inputPath).rotate(); // .rotate() auto-orients using EXIF

  switch (targetFormat) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: 95, progressive: true });
      break;

    case 'png':
      pipeline = pipeline.png({ compressionLevel: 3 });
      break;

    case 'webp':
      pipeline = pipeline.webp({ quality: 95 });
      break;

    case 'avif':
      pipeline = pipeline.avif({ quality: 90 });
      break;

    default:
      pipeline = pipeline.jpeg({ quality: 95 });
      break;
  }

  const info = await pipeline.toFile(outputPath);

  return {
    width: info.width,
    height: info.height,
    format: info.format,
  };
}

// ---------------------------------------------------------------------------
// Video / audio conversion
// Try codec copy first for container changes (fast), fall back to transcode
// ---------------------------------------------------------------------------

/**
 * Convert a video or audio file to a different format.
 *
 * @param {string}   inputPath    Absolute path to the source media file.
 * @param {string}   outputPath   Absolute path for the converted output.
 * @param {string}   targetFormat Target format ('mp4', 'webm', 'mov', 'mkv', 'mp3', 'wav', etc.)
 * @param {function} onProgress   Called with a number 0-100 during encoding.
 * @returns {Promise<void>}
 */
async function convertMedia(inputPath, outputPath, targetFormat, onProgress) {
  return new Promise((resolve, reject) => {
    // Probe input to get codec info
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const hasVideo = metadata.streams.some((s) => s.codec_type === 'video');
      const hasAudio = metadata.streams.some((s) => s.codec_type === 'audio');
      const isAudioOnly = hasAudio && !hasVideo;

      let command = ffmpeg(inputPath);

      if (isAudioOnly) {
        // Audio-only conversion
        const audioCodecMap = {
          mp3: 'libmp3lame',
          wav: 'pcm_s16le',
          aac: 'aac',
          ogg: 'libvorbis',
          flac: 'flac',
          m4a: 'aac',
        };
        const codec = audioCodecMap[targetFormat] || 'aac';
        command = command.noVideo().audioCodec(codec);

        if (targetFormat === 'mp3') {
          command = command.audioBitrate('320k');
        } else if (targetFormat === 'aac' || targetFormat === 'm4a') {
          command = command.audioBitrate('256k');
        } else if (targetFormat === 'ogg') {
          command = command.audioBitrate('256k');
        }
      } else if (targetFormat === 'webm') {
        // WebM needs VP9 + Opus — always transcode
        command = ffmpeg(inputPath)
          .videoCodec('libvpx-vp9')
          .outputOptions('-crf', '30')
          .outputOptions('-b:v', '0')
          .audioCodec('libopus')
          .audioBitrate('192k');
      } else {
        // Video conversion — try codec copy when possible
        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const videoCodec = videoStream ? videoStream.codec_name : '';

        // Container format to codec compatibility
        const containerAcceptsH264 = ['mp4', 'mov', 'mkv', 'avi'].includes(targetFormat);
        const canCopyVideo = videoCodec === 'h264' && containerAcceptsH264;

        if (canCopyVideo) {
          command = command.videoCodec('copy');
        } else {
          command = command
            .videoCodec('libx264')
            .outputOptions('-crf', '18')
            .outputOptions('-preset', 'medium');
        }

        // Audio: try copy, transcode if needed
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
        const audioCodec = audioStream ? audioStream.codec_name : '';
        const containerAcceptsAAC = ['mp4', 'mov', 'mkv'].includes(targetFormat);
        const canCopyAudio = audioCodec === 'aac' && containerAcceptsAAC;

        if (canCopyAudio) {
          command = command.audioCodec('copy');
        } else if (hasAudio) {
          command = command.audioCodec('aac').audioBitrate('192k');
        }
      }

      // Add faststart for MP4/MOV (moves moov atom to beginning for streaming)
      if (['mp4', 'mov'].includes(targetFormat)) {
        command = command.outputOptions('-movflags', '+faststart');
      }

      // Progress callback
      if (typeof onProgress === 'function') {
        command.on('progress', (info) => {
          if (info && info.percent != null) {
            onProgress(Math.min(100, Math.round(info.percent)));
          }
        });
      }

      command
        .on('error', (cmdErr) => reject(cmdErr))
        .on('end', () => resolve())
        .save(outputPath);
    });
  });
}

module.exports = { convertImage, convertMedia };
