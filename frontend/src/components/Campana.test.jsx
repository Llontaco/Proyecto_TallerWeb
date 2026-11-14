import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Campana from './Campana.jsx';
import { api } from '../api/client.js';

const bandeja = {
  noLeidas: 2,
  items: [
    { id: 1, mensaje: 'Se te asignó la solicitud SOL-2026-00010', solicitudId: 10, leida: false, fecha: new Date().toISOString() },
    { id: 2, mensaje: 'La solicitud SOL-2026-00004 pasó a Cerrada', solicitudId: 4, leida: true, fecha: new Date().toISOString() }
  ]
};

describe('Campana de notificaciones (HU-13)', () => {
  beforeEach(() => {
    vi.spyOn(api, 'notificaciones').mockResolvedValue(bandeja);
  });

  it('muestra el número de notificaciones sin leer', async () => {
    render(<MemoryRouter><Campana /></MemoryRouter>);
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' })).toBeInTheDocument();
  });

  it('abre el panel y lista los mensajes', async () => {
    render(<MemoryRouter><Campana /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: /Notificaciones/ }));
    expect(screen.getByRole('dialog', { name: 'Notificaciones' })).toBeInTheDocument();
    expect(screen.getByText('Se te asignó la solicitud SOL-2026-00010')).toBeInTheDocument();
  });

  it('marca todas como leídas', async () => {
    const marcar = vi.spyOn(api, 'marcarTodasNotificaciones').mockResolvedValue(null);
    render(<MemoryRouter><Campana /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: /Notificaciones/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }));
    await waitFor(() => expect(marcar).toHaveBeenCalledTimes(1));
  });

  it('no muestra contador cuando no hay pendientes', async () => {
    api.notificaciones.mockResolvedValue({ noLeidas: 0, items: [] });
    render(<MemoryRouter><Campana /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
    expect(document.querySelector('.campana__contador')).toBeNull();
  });
});
