const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  jobs,
  createJob,
  getCompressedPath,
  formatSize,
} = require('../utils/fileUtils');
const fileConverter = require('../services/fileConverter');

const router = express.Router();

// ---------------------------------------------------------------------------
// Multer setup — store uploads in ../uploads/ (relative to server/)
// ---------------------------------------------------------------------------
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Keep original extension so converters can detect format
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
});

// ---------------------------------------------------------------------------
// POST /api/convert
// ---------------------------------------------------------------------------
router.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { mimetype, originalname, size: originalSize, path: inputPath } = req.file;

    // Parse options from the request body (sent as a JSON string)
    let options = {};
    if (req.body && req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch {
        return res.status(400).json({ error: 'Invalid options JSON.' });
      }
    }

    const targetFormat = options.targetFormat;
    if (!targetFormat) {
      fs.unlink(inputPath, () => {});
      return res.status(400).json({ error: 'targetFormat is required.' });
    }

    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');
    const isAudio = mimetype.startsWith('audio/');

    if (!isImage && !isVideo && !isAudio) {
      // Clean up the uploaded file
      fs.unlink(inputPath, () => {});
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    // Determine output extension
    const outputExt = '.' + targetFormat;

    // Create job
    const job = createJob({
      originalName: originalname,
      originalSize,
      mimeType: mimetype,
      jobType: 'convert',
    });

    const outputPath = getCompressedPath(job.id, outputExt);
    job.outputPath = outputPath;

    // ----- Image conversion (synchronous response) -----
    if (isImage) {
      job.status = 'processing';

      const result = await fileConverter.convertImage(inputPath, outputPath, targetFormat);

      const compressedStat = fs.statSync(outputPath);
      job.compressedSize = compressedStat.size;
      job.status = 'completed';
      job.progress = 100;

      return res.json({
        id: job.id,
        originalName: originalname,
        originalSize,
        originalSizeFormatted: formatSize(originalSize),
        compressedSize: compressedStat.size,
        compressedSizeFormatted: formatSize(compressedStat.size),
        width: result.width,
        height: result.height,
        format: targetFormat,
      });
    }

    // ----- Video / audio conversion (async — return immediately) -----
    job.status = 'processing';

    // Fire and forget — conversion runs in the background
    fileConverter
      .convertMedia(inputPath, outputPath, targetFormat, (percent) => {
        job.progress = percent;
      })
      .then(() => {
        const stat = fs.statSync(outputPath);
        job.compressedSize = stat.size;
        job.status = 'completed';
        job.progress = 100;
        console.log(`[convert] Job ${job.id} completed — ${formatSize(stat.size)}`);
      })
      .catch((err) => {
        job.status = 'error';
        job.error = err.message || 'Conversion failed.';
        console.error(`[convert] Job ${job.id} failed:`, err.message);
      });

    return res.json({
      id: job.id,
      originalName: originalname,
      originalSize,
      originalSizeFormatted: formatSize(originalSize),
      status: 'processing',
    });
  } catch (err) {
    console.error('[convert] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// NOTE: Convert jobs reuse the existing shared endpoints:
//   GET /api/progress/:id  (SSE real-time progress)
//   GET /api/status/:id    (JSON polling)
//   GET /api/download/:id  (file download)
// These all read from the shared jobs Map in fileUtils.js.

module.exports = router;
