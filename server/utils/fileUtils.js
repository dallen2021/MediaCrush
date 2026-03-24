const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ---------------------------------------------------------------------------
// In-memory job store
// ---------------------------------------------------------------------------
const jobs = new Map();

/**
 * Create a new job object and register it in the store.
 * Returns the job so callers can mutate it in place.
 */
function createJob(overrides = {}) {
  const id = generateId();
  const job = {
    id,
    status: 'pending',       // pending | processing | completed | error
    originalName: null,
    originalSize: 0,
    compressedSize: null,
    mimeType: null,
    outputPath: null,
    progress: 0,
    createdAt: Date.now(),
    ...overrides,
  };
  jobs.set(id, job);
  return job;
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------
function generateId() {
  return uuidv4();
}

// ---------------------------------------------------------------------------
// Path helpers  (all paths are relative to the project root, i.e. server/..)
// ---------------------------------------------------------------------------
const PROJECT_ROOT = path.join(__dirname, '..', '..');

function getUploadPath(id, ext) {
  return path.join(PROJECT_ROOT, 'uploads', `${id}${ext}`);
}

function getCompressedPath(id, ext) {
  return path.join(PROJECT_ROOT, 'compressed', `${id}${ext}`);
}

// ---------------------------------------------------------------------------
// Human-readable file size
// ---------------------------------------------------------------------------
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Cleanup job — runs every 30 minutes, deletes files older than 30 minutes
// ---------------------------------------------------------------------------
function startCleanupJob() {
  const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  const MAX_AGE_MS  = 30 * 60 * 1000; // 30 minutes

  const dirsToClean = [
    path.join(PROJECT_ROOT, 'uploads'),
    path.join(PROJECT_ROOT, 'compressed'),
  ];

  setInterval(() => {
    const now = Date.now();

    for (const dir of dirsToClean) {
      if (!fs.existsSync(dir)) continue;

      let entries;
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }

      for (const entry of entries) {
        const filePath = path.join(dir, entry);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > MAX_AGE_MS) {
            fs.unlinkSync(filePath);
            console.log(`[cleanup] Deleted old file: ${filePath}`);
          }
        } catch {
          // Ignore errors for individual files
        }
      }
    }

    // Also purge finished / old jobs from the Map
    for (const [id, job] of jobs) {
      if (now - job.createdAt > MAX_AGE_MS) {
        jobs.delete(id);
      }
    }
  }, INTERVAL_MS);

  console.log('[cleanup] Cleanup job scheduled (every 30 min, files older than 30 min)');
}

module.exports = {
  jobs,
  createJob,
  generateId,
  getUploadPath,
  getCompressedPath,
  formatSize,
  startCleanupJob,
};
