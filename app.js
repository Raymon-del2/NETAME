// Wrapper to satisfy Vercel express entrypoint detection.
// Re-export the Express app defined in ./api/index.js.
const app = require('./api/index');
module.exports = app;
