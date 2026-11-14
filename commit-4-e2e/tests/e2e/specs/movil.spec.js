import { expect, test } from '@playwright/test';
import { iniciarSesion } from './ayudas.js';

// RNF-02: la interfaz funciona en un celular sin desbordamiento horizontal.
test('En el celular el menú lateral se abre y la lista no se desborda', async ({ page }) => {
  await iniciarSesion(page, 'estudiante@uni.edu.pe');
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(page.viewportSize().width);

  await expect(page.locator('.sidebar')).not.toBeInViewport();
  await page.getByRole('button', { name: 'Mostrar u ocultar menú' }).click();
  await expect(page.locator('.sidebar')).toBeInViewport();
  await page.locator('.sidebar').getByRole('link', { name: 'Nueva solicitud' }).click();
  await expect(page.getByRole('heading', { name: 'Nueva solicitud' })).toBeVisible();
});
