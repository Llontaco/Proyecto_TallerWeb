import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

const login = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ login }) }));

const pantalla = () => render(<MemoryRouter><ToastProvider><Login /></ToastProvider></MemoryRouter>);

// HU-02: inicio de sesión
describe('Login', () => {
  it('valida los campos vacíos sin llamar a la API', async () => {
    pantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(screen.getByText('Ingresa tu correo')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('muestra el mensaje genérico cuando las credenciales son incorrectas', async () => {
    login.mockRejectedValueOnce(new Error('Correo o contraseña incorrectos'));
    pantalla();
    await userEvent.type(screen.getByLabelText('Correo institucional'), 'estudiante@uni.edu.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala1234');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
  });

  it('recuerda el correo en localStorage solo si se marca la casilla', async () => {
    login.mockResolvedValueOnce({ nombre: 'Ana', rol: 'ESTUDIANTE' });
    pantalla();
    await userEvent.type(screen.getByLabelText('Correo institucional'), 'estudiante@uni.edu.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Demo1234');
    await userEvent.click(screen.getByLabelText('Recordar mi correo en este equipo'));
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(localStorage.getItem('sigsu_recordar_correo')).toBe('estudiante@uni.edu.pe');
    expect(localStorage.getItem('sigsu_recordar_correo')).not.toContain('Demo1234');
  });
});
