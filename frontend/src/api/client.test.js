import { describe, expect, it, vi } from 'vitest';
import { api, ApiError, onSesionExpirada } from './client.js';

const respuesta = (status, cuerpo) => Promise.resolve(new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
  status, headers: { 'Content-Type': 'application/json' }
}));

describe('Cliente HTTP', () => {
  it('envía JSON con credenciales incluidas (cookie HttpOnly)', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(respuesta(201, { id: 1, codigo: 'SOL-2026-00001' }));
    const r = await api.crearSolicitud({ ubicacion: 'Aula' });
    expect(r.codigo).toBe('SOL-2026-00001');
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/solicitudes');
    expect(opciones).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(opciones.headers['Content-Type']).toBe('application/json');
  });

  it('devuelve null en 204 No Content', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(respuesta(204));
    await expect(api.eliminarSolicitud(3)).resolves.toBeNull();
  });

  it('convierte los errores 400 en ApiError con errores por campo', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(respuesta(400, { mensaje: 'Datos inválidos', errores: { ubicacion: 'Indica la ubicación' } }));
    const err = await api.crearSolicitud({}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.errores.ubicacion).toBe('Indica la ubicación');
  });

  it('avisa que la sesión expiró ante un 401 fuera de /auth', async () => {
    const expirada = vi.fn();
    onSesionExpirada(expirada);
    vi.spyOn(globalThis, 'fetch').mockReturnValue(respuesta(401, { mensaje: 'Sesión no válida o expirada' }));
    await api.listarSolicitudes().catch(() => {});
    expect(expirada).toHaveBeenCalledTimes(1);
  });

  it('no trata un login fallido como sesión expirada', async () => {
    const expirada = vi.fn();
    onSesionExpirada(expirada);
    vi.spyOn(globalThis, 'fetch').mockReturnValue(respuesta(401, { mensaje: 'Correo o contraseña incorrectos' }));
    await expect(api.login('a@uni.edu.pe', 'x')).rejects.toThrow('Correo o contraseña incorrectos');
    expect(expirada).not.toHaveBeenCalled();
  });

  it('informa un error claro si el servidor no responde', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await api.catalogos().catch((e) => e);
    expect(err.status).toBe(0);
    expect(err.message).toBe('No se pudo conectar con el servidor');
  });

  it('omite los filtros vacíos en la URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockReturnValue(respuesta(200, []));
    await api.listarSolicitudes({ estado: 'REGISTRADA', q: '', categoriaId: null });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/solicitudes?estado=REGISTRADA');
  });
});
