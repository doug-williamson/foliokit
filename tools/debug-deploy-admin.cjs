/* Debug session 2b9046 — remove after deploy verified */
'use strict';
// #region agent log
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'debug-2b9046.log');
const nestedWorktrees = fs.existsSync(path.join(root, '.claude', 'worktrees'));
const payload = {
  sessionId: '2b9046',
  runId: process.env.DEBUG_RUN_ID || 'deploy-preflight',
  hypothesisId: 'H1',
  location: 'tools/debug-deploy-admin.cjs',
  message: 'deploy:admin preflight',
  data: { nestedClaudeWorktreesDirExists: nestedWorktrees },
  timestamp: Date.now(),
};
fs.appendFileSync(logPath, JSON.stringify(payload) + '\n');
fetch('http://127.0.0.1:7685/ingest/04c22366-8199-473f-8c52-f74c20446284', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '2b9046' },
  body: JSON.stringify({ ...payload, sessionId: '2b9046' }),
}).catch(() => {});
// #endregion
