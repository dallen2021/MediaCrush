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
const imageCompressor = require('../services/imageCompressor');
const videoCompressor = require('../services/videoCompressor');

const router = express.Router();

// ---------------------------------------------------------------------------
// Multer setup — store uploads in ../uploads/ (relative to server/)
// ---------------------------------------------------------------------------
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Keep original extension so compressors can detect format
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

// ---------------------------------------------------------------------------
// POST /api/compress
// ---------------------------------------------------------------------------
router.post('/compress', upload.single('file'), async (req, res) => {
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

    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      // Clean up the uploaded file
      fs.unlink(inputPath, () => {});
      return res.status(400).json({ error: 'Unsupported file type. Only images and videos are accepted.' });
    }

    // Determine output extension
    let outputExt;
    if (isImage) {
      if (options.format) {
        outputExt = '.' + (options.format === 'jpg' ? 'jpeg' : options.format);
      } else {
        outputExt = path.extname(originalname) || '.jpg';
      }
    } else {
      outputExt = '.mp4'; // video always outputs mp4
    }

    // Create job
    const job = createJob({
      originalName: originalname,
      originalSize,
      mimeType: mimetype,
    });

    const outputPath = getCompressedPath(job.id, outputExt);
    job.outputPath = outputPath;

    // ----- Image compression (synchronous response) -----
    if (isImage) {
      job.status = 'processing';

      const result = await imageCompressor.compress(inputPath, outputPath, options);

      const compressedStat = fs.statSync(outputPath);
      job.compressedSize = compressedStat.size;
      job.status = 'completed';
      job.progress = 100;

      // Build original name for download
      const savings = originalSize > 0
        ? ((1 - compressedStat.size / originalSize) * 100).toFixed(1)
        : '0.0';

      return res.json({
        id: job.id,
        originalName: originalname,
        originalSize,
        originalSizeFormatted: formatSize(originalSize),
        compressedSize: compressedStat.size,
        compressedSizeFormatted: formatSize(compressedStat.size),
        savings: `${savings}%`,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }

    // ----- Video compression (async — return immediately) -----
    job.status = 'processing';

    // Fire and forget — compression runs in the background
    videoCompressor
      .compress(inputPath, outputPath, options, (percent) => {
        job.progress = percent;
      })
      .then(() => {
        const compressedStat = fs.statSync(outputPath);
        job.compressedSize = compressedStat.size;
        job.status = 'completed';
        job.progress = 100;
        console.log(`[video] Job ${job.id} completed — ${formatSize(compressedStat.size)}`);
      })
      .catch((err) => {
        job.status = 'error';
        job.error = err.message || 'Video compression failed.';
        console.error(`[video] Job ${job.id} failed:`, err.message);
      });

    return res.json({
      id: job.id,
      originalName: originalname,
      originalSize,
      originalSizeFormatted: formatSize(originalSize),
      status: 'processing',
    });
  } catch (err) {
    console.error('[compress] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/status/:id  — poll job status (JSON)
// ---------------------------------------------------------------------------
router.get('/status/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const payload = {
    id: job.id,
    status: job.status,
    progress: job.progress,
    originalName: job.originalName,
    originalSize: job.originalSize,
    originalSizeFormatted: formatSize(job.originalSize),
  };

  if (job.status === 'completed') {
    const savings = job.originalSize > 0
      ? ((1 - job.compressedSize / job.originalSize) * 100).toFixed(1)
      : '0.0';

    payload.compressedSize = job.compressedSize;
    payload.compressedSizeFormatted = formatSize(job.compressedSize);
    payload.savings = `${savings}%`;
  }

  if (job.status === 'error') {
    payload.error = job.error || 'Unknown error.';
  }

  return res.json(payload);
});

// ---------------------------------------------------------------------------
// GET /api/progress/:id  — SSE endpoint for real-time video progress
// ---------------------------------------------------------------------------
router.get('/progress/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Helper to send an SSE event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = setInterval(() => {
    const current = jobs.get(req.params.id);

    if (!current) {
      sendEvent({ status: 'error', error: 'Job not found.' });
      clearInterval(intervalId);
      res.end();
      return;
    }

    if (current.status === 'completed') {
      const savings = current.originalSize > 0
        ? ((1 - current.compressedSize / current.originalSize) * 100).toFixed(1)
        : '0.0';

      sendEvent({
        status: 'completed',
        progress: 100,
        compressedSize: current.compressedSize,
        compressedSizeFormatted: formatSize(current.compressedSize),
        savings: `${savings}%`,
      });
      clearInterval(intervalId);
      res.end();
      return;
    }

    if (current.status === 'error') {
      sendEvent({ status: 'error', error: current.error || 'Unknown error.' });
      clearInterval(intervalId);
      res.end();
      return;
    }

    // Still processing — send progress update
    sendEvent({
      status: 'processing',
      progress: current.progress,
    });
  }, 500);

  // Clean up if client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

module.exports = router;
