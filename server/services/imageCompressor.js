const sharp = require('sharp');
const fs = require('fs');

/**
 * Apply format-specific quality settings to a sharp pipeline.
 *
 * @param {string} inputPath   Absolute path to the source image.
 * @param {string} outputPath  Absolute path where the result should be written.
 * @param {string} format      Target format ('jpeg', 'png', 'webp', 'avif', etc.)
 * @param {number} quality     1-100
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
async function compressAtQuality(inputPath, outputPath, format, quality) {
  let pipeline = sharp(inputPath).rotate(); // .rotate() auto-orients using EXIF

  switch (format) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });
      break;

    case 'png': {
      // Map quality (1-100) to compressionLevel (9-1).
      // quality 100 → level 1 (least compression, best quality)
      // quality   1 → level 9 (most compression)
      const compressionLevel = Math.round(9 - ((quality - 1) / 99) * 8);
      pipeline = pipeline.png({
        compressionLevel,
        effort: 10,
      });
      break;
    }

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

  const info = await pipeline.toFile(outputPath);

  return {
    width: info.width,
    height: info.height,
    format: info.format,
  };
}

/**
 * Iteratively compress an image using binary search on quality
 * to fit under a target file size.
 *
 * @param {string} inputPath   Absolute path to the source image.
 * @param {string} outputPath  Absolute path where the result should be written.
 * @param {object} options
 *   - targetSize {number}       Target file size in bytes.
 *   - format     {string|null}  null = keep original; 'jpeg'|'png'|'webp'|'avif'
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
async function compressToTargetSize(inputPath, outputPath, options) {
  const targetBytes = options.targetSize;
  const targetFormat = options.format || null;
  const meta = await sharp(inputPath).metadata();
  const effectiveFormat = targetFormat || meta.format;

  // Binary search: find the highest quality that fits under targetBytes
  let low = 1, high = 100, bestQuality = 1;

  // Max 8 iterations of binary search
  for (let i = 0; i < 8; i++) {
    const mid = Math.floor((low + high) / 2);
    const tempPath = outputPath + '.tmp';

    await compressAtQuality(inputPath, tempPath, effectiveFormat, mid);
    const stat = fs.statSync(tempPath);

    if (stat.size <= targetBytes) {
      bestQuality = mid;
      low = mid + 1;  // Try higher quality
    } else {
      high = mid - 1; // Need lower quality
    }

    // Clean up temp
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }

  // Final compression at best quality found
  const result = await compressAtQuality(inputPath, outputPath, effectiveFormat, bestQuality);
  return result;
}

/**
 * Compress / convert an image with sharp.
 *
 * @param {string} inputPath   Absolute path to the source image.
 * @param {string} outputPath  Absolute path where the result should be written.
 * @param {object} options
 *   - quality    {number}       1-100 (default 80)
 *   - format     {string|null}  null = keep original; 'jpeg'|'png'|'webp'|'avif'
 *   - targetSize {number}       If set, iteratively compress to fit under this byte limit.
 * @returns {Promise<{width: number, height: number, format: string}>}
 */
async function compress(inputPath, outputPath, options = {}) {
  // If targetSize is set, do iterative compression
  if (options.targetSize) {
    return compressToTargetSize(inputPath, outputPath, options);
  }

  // Existing quality-based compression
  const quality = options.quality != null ? Number(options.quality) : 80;
  const targetFormat = options.format || null; // null = keep original

  const meta = await sharp(inputPath).metadata();
  const effectiveFormat = targetFormat || meta.format;

  // Write to disk (sharp strips metadata by default)
  const result = await compressAtQuality(inputPath, outputPath, effectiveFormat, quality);

  return result;
}

module.exports = { compress };
