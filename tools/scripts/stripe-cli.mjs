#!/usr/bin/env node
/**
 * Runs the Stripe CLI even when the terminal has a stale PATH (common after
 * winget install while Cursor was open). Set STRIPE_CLI_PATH to override.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function findStripeWindows() {
  const override = process.env.STRIPE_CLI_PATH;
  if (override && fs.existsSync(override)) {
    return override;
  }
  const local = process.env.LOCALAPPDATA;
  if (local) {
    const packages = path.join(local, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(packages)) {
      const dirs = fs.readdirSync(packages).filter((d) => d.startsWith('Stripe.StripeCli'));
      dirs.sort();
      for (let i = dirs.length - 1; i >= 0; i--) {
        const exe = path.join(packages, dirs[i], 'stripe.exe');
        if (fs.existsSync(exe)) {
          return exe;
        }
      }
    }
  }
  const tools = path.join('C:', 'Tools', 'stripe-cli', 'stripe.exe');
  if (fs.existsSync(tools)) {
    return tools;
  }
  return null;
}

function resolveStripeBinary() {
  if (process.platform === 'win32') {
    const found = findStripeWindows();
    if (found) {
      return found;
    }
  }
  return 'stripe';
}

const bin = resolveStripeBinary();
const child = spawn(bin, args, {
  stdio: 'inherit',
  // Needed when falling back to bare "stripe" on Windows if CreateProcess PATH is minimal
  shell: process.platform === 'win32' && bin === 'stripe',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on('error', (err) => {
  if (bin === 'stripe') {
    console.error(
      'Stripe CLI not found. Install it (winget install Stripe.StripeCli), then fully quit and reopen Cursor,\n' +
        'or set STRIPE_CLI_PATH to your stripe.exe. Docs: https://docs.stripe.com/stripe-cli/install\n' +
        `Underlying error: ${err.message}`
    );
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
