/**
 * Playwright globalTeardown — kills the Firebase emulator process that was
 * spawned by global-setup.ts (if any).  When the developer reuses their own
 * running emulators, no PID file is written so this is a no-op.
 */

import * as fs from 'fs';
import * as path from 'path';

const PID_FILE = path.join(__dirname, '..', '..', '.firebase', 'e2e-emulator.pid');

async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(PID_FILE)) {
    console.log('[e2e] No emulator PID file found — skipping teardown.');
    return;
  }

  const raw = fs.readFileSync(PID_FILE, 'utf8').trim();
  const pid = parseInt(raw, 10);
  fs.unlinkSync(PID_FILE);

  if (isNaN(pid)) return;

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`[e2e] Sent SIGTERM to emulator process ${pid}.`);
  } catch {
    // Process already exited — nothing to do.
  }
}

export default globalTeardown;
