const sharp = require('sharp');

/**
 * Compress / convert an image with sharp.
 *
 * @param {string} inputPath   Absolute path to the source image.
 * @param {string} outputPath  Absolute path where the result should be written.
 * @param {object} options
 *   - quality  {number}  1-100 (default 80)
 *   - format   {string|null}  null = keep original; 'jpeg'|'png'|'webp'|'avif'
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
async function compress(inputPath, outputPath, options = {}) {
  const quality = options.quality != null ? Number(options.quality) : 80;
  const targetFormat = options.format || null; // null = keep original

  let pipeline = sharp(inputPath).rotate(); // .rotate() auto-orients using EXIF

  // Determine the effective output format
  const meta = await sharp(inputPath).metadata();
  const effectiveFormat = targetFormat || meta.format; // e.g. 'jpeg', 'png', 'webp'

  // Apply format-specific settings
  switch (effectiveFormat) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });
      break;

    case 'png':
      // Map quality (1-100) to compressionLevel (9-1).
      // quality 100 → level 1 (least compression, best quality)
      // quality   1 → level 9 (most compression)
      const compressionLevel = Math.round(9 - ((quality - 1) / 99) * 8);
      pipeline = pipeline.png({
        compressionLevel,
        effort: 10,
      });
      break;

    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;

    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;

    default:
      // Fallback: treat unknown as JPEG
      pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
      break;
  }

  // Write to disk (sharp strips metadata by default)
  const info = await pipeline.toFile(outputPath);

  return {
    width: info.width,
    height: info.height,
    format: info.format,
  };
}

module.exports = { compress };
