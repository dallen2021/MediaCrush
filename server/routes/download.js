const express = require('express');
const path = require('path');
const fs = require('fs');

const { jobs } = require('../utils/fileUtils');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/download/:id
// ---------------------------------------------------------------------------
router.get('/download/:id', (req, res) => {
  try {
    const job = jobs.get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    if (job.status !== 'completed') {
      return res.status(404).json({ error: 'File is not ready for download.' });
    }

    if (!job.outputPath || !fs.existsSync(job.outputPath)) {
      return res.status(404).json({ error: 'Compressed file not found on disk.' });
    }

    // Build a user-friendly download filename
    const ext = path.extname(job.outputPath);
    const baseName = path.basename(job.originalName, path.extname(job.originalName));
    const downloadName = job.jobType === 'convert'
      ? `${baseName}${ext}`
      : `compressed_${baseName}${ext}`;

    res.download(job.outputPath, downloadName, (err) => {
      if (err) {
        // Only log if headers have not yet been sent
        if (!res.headersSent) {
          console.error('[download] Error sending file:', err.message);
          return res.status(500).json({ error: 'Failed to send file.' });
        }
      }
    });
  } catch (err) {
    console.error('[download] Unexpected error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

module.exports = router;
