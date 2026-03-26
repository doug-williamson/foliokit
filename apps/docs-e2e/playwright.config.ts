import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import * as path from 'path';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4202';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  // Docs is a static Angular app — no Firebase required.
  // globalSetup / globalTeardown are omitted intentionally.
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run start:docs',
    url: 'http://localhost:4202',
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
