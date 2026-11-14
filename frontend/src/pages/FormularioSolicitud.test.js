import { describe, expect, it } from 'vitest';
import { validar } from './FormularioSolicitud.jsx';

const valido = { categoriaId: '1', prioridadId: '2', ubicacion: 'Aula 204', descripcion: 'El proyector del aula no enciende.' };
const archivo = (name, mb) => ({ name, size: mb * 1024 * 1024 });

// HU-05 escenario 2 y HU-06: validaciones del lado del cliente
describe('validar (formulario de solicitud)', () => {
  it('acepta una solicitud completa sin archivos', () => {
    expect(validar(valido, [])).toEqual({});
  });

  it('marca cada campo obligatorio vacío', () => {
    const e = validar({ categoriaId: '', prioridadId: '', ubicacion: '', descripcion: '' }, []);
    expect(Object.keys(e)).toEqual(['categoriaId', 'prioridadId', 'ubicacion', 'descripcion']);
  });

  it('exige al menos 20 caracteres en la descripción', () => {
    expect(validar({ ...valido, descripcion: 'muy corta' }, []).descripcion)
      .toBe('Describe el problema con al menos 20 caracteres');
  });

  it('rechaza más de 3 archivos', () => {
    expect(validar(valido, [1, 2, 3, 4].map((i) => archivo(`f${i}.png`, 1))).archivo).toBe('Máximo 3 archivos');
  });

  it('rechaza archivos mayores a 5 MB', () => {
    expect(validar(valido, [archivo('foto.jpg', 6)]).archivo).toMatch(/5 MB/);
  });

  it('rechaza extensiones no permitidas', () => {
    expect(validar(valido, [archivo('script.exe', 1)]).archivo).toBe('Solo se permiten JPG, PNG o PDF');
  });
});
