import { expect } from '@playwright/test';

export const CLAVE = process.env.E2E_DEMO_PASSWORD || 'Demo1234';

/** Inicia sesión desde la pantalla de login y espera llegar a la página inicial del rol. */
export async function iniciarSesion(page, correo, clave = CLAVE) {
  await page.goto('/login');
  await page.getByLabel('Correo institucional').fill(correo);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.locator('.sidebar')).toBeVisible();
}
