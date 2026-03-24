const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Point fluent-ffmpeg at the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Preset definitions.
 * Each preset returns an object with the ffmpeg settings to apply.
 */
const PRESETS = {
  low: {
    crf: 32,
    maxWidth: 1280,   // 720p max
    maxHeight: 720,
    profile: 'baseline',
    audioBitrate: '96k',
  },
  medium: {
    crf: 26,
    maxWidth: 1920,   // 1080p max
    maxHeight: 1080,
    profile: 'main',
    audioBitrate: '128k',
  },
  high: {
    crf: 20,
    maxWidth: null,    // no rescale
    maxHeight: null,
    profile: 'high',
    audioBitrate: '192k',
  },
};

/**
 * Compress a video file.
 *
 * @param {string}   inputPath   Absolute path to the source video.
 * @param {string}   outputPath  Absolute path for the compressed output (.mp4).
 * @param {object}   options
 *   - preset       {'low'|'medium'|'high'|'custom'}  (default 'medium')
 *   - videoBitrate {string}   e.g. '2000k'  (custom only)
 *   - audioBitrate {string}   e.g. '128k'   (custom only)
 *   - resolution   {string}   e.g. '1280x720' (custom only)
 * @param {function} onProgress  Called with a number 0-100 during encoding.
 * @returns {Promise<void>}
 */
function compress(inputPath, outputPath, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const presetName = options.preset || 'medium';

    let command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions('-movflags', '+faststart')
      .format('mp4');

    if (presetName === 'custom') {
      // Custom settings
      if (options.videoBitrate) {
        command = command.videoBitrate(options.videoBitrate);
      }
      if (options.audioBitrate) {
        command = command.audioBitrate(options.audioBitrate);
      }
      if (options.resolution) {
        // resolution is a max height value (e.g. "1080")
        // Scale to fit within that height, keep aspect ratio, ensure divisible by 2
        const maxH = parseInt(options.resolution, 10);
        if (maxH > 0) {
          command = command.outputOptions(
            '-vf',
            `scale=-2:'min(${maxH},ih)'`
          );
        }
      }
    } else {
      const preset = PRESETS[presetName] || PRESETS.medium;

      command = command
        .outputOptions('-crf', String(preset.crf))
        .outputOptions('-profile:v', preset.profile)
        .audioBitrate(preset.audioBitrate);

      if (preset.maxWidth && preset.maxHeight) {
        // Scale down only if larger; keep aspect ratio; divisible by 2
        command = command.outputOptions(
          '-vf',
          `scale='min(${preset.maxWidth},iw)':'min(${preset.maxHeight},ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`
        );
      }
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
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve();
      })
      .save(outputPath);
  });
}

module.exports = { compress };
