import { expect, test } from '@playwright/test';
import { iniciarSesion } from './ayudas.js';

// Flujo end-to-end del MVP con los cuatro roles. Cada prueba usa un navegador aislado (otra persona).
test.describe.serial('Flujo completo de una solicitud', () => {
  let urlSolicitud;
  let codigo;

  test('HU-02: credenciales incorrectas muestran un mensaje genérico', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo institucional').fill('estudiante@uni.edu.pe');
    await page.getByLabel('Contraseña').fill('incorrecta1');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos');
  });

  test('HU-05: el estudiante registra una solicitud (con validación previa)', async ({ page }) => {
    await iniciarSesion(page, 'estudiante@uni.edu.pe');
    await expect(page.getByRole('heading', { name: 'Mis solicitudes' })).toBeVisible();
    await page.getByRole('link', { name: 'Nueva solicitud' }).first().click();

    // Escenario 2: datos incompletos
    await page.getByRole('button', { name: 'Registrar solicitud' }).click();
    await expect(page.getByText('Selecciona una categoría')).toBeVisible();
    await expect(page.getByText('Describe el problema con al menos 20 caracteres')).toBeVisible();

    // Escenario 1: registro correcto
    await page.getByLabel('Categoría *').selectOption({ label: 'Mantenimiento' });
    await page.getByLabel('Prioridad sugerida *').selectOption({ index: 3 });
    await page.getByLabel('Ubicación *').fill('Facultad de Ingeniería – Laboratorio 5');
    await page.getByLabel('Descripción *').fill('El aire acondicionado del laboratorio 5 gotea sobre las mesas.');
    await page.getByRole('button', { name: 'Registrar solicitud' }).click();

    await expect(page.getByRole('heading', { name: 'Solicitud registrada' })).toBeVisible();
    codigo = (await page.locator('.exito__codigo').textContent()).trim();
    expect(codigo).toMatch(/^SOL-\d{4}-\d{5}$/);
    await page.getByRole('link', { name: 'Ver detalle' }).click();
    await expect(page.getByText('Registrada', { exact: true }).first()).toBeVisible();
    urlSolicitud = page.url();
  });

  test('HU-09 y HU-10: el supervisor evalúa y asigna un técnico', async ({ page }) => {
    await iniciarSesion(page, 'supervisor@uni.edu.pe');
    await page.goto(urlSolicitud);
    await page.getByRole('button', { name: 'Pasar a evaluación' }).click();
    await page.getByLabel('Técnico responsable').selectOption({ label: 'Luis Paredes · Mantenimiento e Infraestructura' });
    await page.getByRole('button', { name: 'Asignar' }).click();
    await expect(page.getByText('Asignada a Luis Paredes')).toBeVisible();
  });

  test('HU-13 y HU-11: el técnico ve la notificación, atiende y resuelve', async ({ page }) => {
    await iniciarSesion(page, 'tecnico@uni.edu.pe');
    const campana = page.getByRole('button', { name: /Notificaciones, \d+ sin leer/ });
    await expect(campana).toBeVisible();
    await campana.click();
    await page.getByRole('button', { name: new RegExp(`Se te asignó la solicitud ${codigo}`) }).click();
    await expect(page).toHaveURL(urlSolicitud);

    await page.getByRole('button', { name: 'Iniciar atención' }).click();
    await expect(page.getByText('Estado cambiado a En atención')).toBeVisible();
    page.once('dialog', (d) => d.accept('Se cambió la tubería del equipo.'));
    await page.getByRole('button', { name: 'Marcar como resuelta' }).click();
    await expect(page.getByText('Se cambió la tubería del equipo.')).toBeVisible();
  });

  test('El estudiante confirma y cierra; el historial queda completo', async ({ page }) => {
    await iniciarSesion(page, 'estudiante@uni.edu.pe');
    await page.goto(urlSolicitud);
    await page.getByRole('button', { name: 'Confirmar y cerrar' }).click();
    await expect(page.locator('.encabezado .badge')).toHaveText('Cerrada');
    await expect(page.locator('.historial li')).toHaveCount(6);
  });

  test('HU-04: el estudiante no puede abrir el dashboard', async ({ page }) => {
    await iniciarSesion(page, 'estudiante@uni.edu.pe');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/solicitudes$/);
    await expect(page.getByText('No tienes permiso para ver esa página')).toBeVisible();
  });

  test('HU-14: el supervisor ve los indicadores del dashboard', async ({ page }) => {
    await iniciarSesion(page, 'supervisor@uni.edu.pe');
    await expect(page.getByRole('heading', { name: 'Dashboard de atención' })).toBeVisible();
    await expect(page.locator('.kpi')).toHaveCount(6);
  });
});
