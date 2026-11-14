// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Las pruebas corren contra la aplicación levantada con Docker Compose (gateway en :8088).
 *   E2E_BASE_URL  URL a probar (por defecto http://localhost:8088)
 *   PW_CHANNEL    "chrome" para usar el Chrome instalado en la máquina (local); en CI se usa Chromium.
 */
export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8088',
    locale: 'es-PE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined }, testIgnore: /movil\.spec\.js/ },
    { name: 'movil', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL || undefined }, testMatch: /movil\.spec\.js/ }
  ]
});
