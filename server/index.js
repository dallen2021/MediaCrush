const express = require('express');
const path = require('path');
const fs = require('fs');

const compressRoutes = require('./routes/compress');
const downloadRoutes = require('./routes/download');
const { startCleanupJob } = require('./utils/fileUtils');

const app = express();
const PORT = 3500;

// ---------------------------------------------------------------------------
// Ensure upload and compressed directories exist
// ---------------------------------------------------------------------------
const uploadsDir = path.join(__dirname, '..', 'uploads');
const compressedDir = path.join(__dirname, '..', 'compressed');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[init] Created uploads/ directory');
}
if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir, { recursive: true });
  console.log('[init] Created compressed/ directory');
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api', compressRoutes);
app.use('/api', downloadRoutes);

// ---------------------------------------------------------------------------
// Start cleanup job
// ---------------------------------------------------------------------------
startCleanupJob();

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[server] MediaCrush running at http://localhost:${PORT}`);
});
