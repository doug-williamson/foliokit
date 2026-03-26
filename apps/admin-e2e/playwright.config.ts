import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import * as path from 'path';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4203';
const ADMIN_STORAGE_STATE = path.join(__dirname, '.auth', 'admin.json');

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  globalSetup: path.join(__dirname, '../e2e-shared/global-setup.ts'),
  globalTeardown: path.join(__dirname, '../e2e-shared/global-teardown.ts'),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run start:admin',
      url: 'http://localhost:4203',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
    // Also start the blog server so integration tests can verify blog output.
    {
      command: 'npm run start:blog',
      url: 'http://localhost:4201',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
  ],
  projects: [
    // Auth setup project — signs in once and saves storageState.
    // All other projects depend on it so it runs first.
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: ADMIN_STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: ADMIN_STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
