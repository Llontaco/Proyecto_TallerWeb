import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Barras, BadgeEstado, Campo, FlujoEstados, Prioridad } from './ui.jsx';

describe('Componentes reutilizables', () => {
  it('BadgeEstado muestra la etiqueta en español y la clase del estado', () => {
    render(<BadgeEstado estado="EN_EVALUACION" />);
    const badge = screen.getByText('En evaluación');
    expect(badge).toHaveClass('badge', 'badge--en_evaluacion');
  });

  it('Prioridad normaliza las tildes para la clase CSS', () => {
    render(<Prioridad nombre="Crítica" />);
    expect(screen.getByText('Crítica')).toHaveClass('prio--critica');
  });

  it('FlujoEstados marca el paso actual y los anteriores como hechos', () => {
    render(<FlujoEstados actual="ASIGNADA" />);
    expect(screen.getByText('Asignada')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Registrada')).toHaveClass('flujo__paso--hecho');
    expect(screen.getByText('Cerrada')).not.toHaveClass('flujo__paso--hecho');
  });

  it('Campo anuncia el error con role="alert"', () => {
    render(<Campo id="x" etiqueta="Ubicación" error="Indica la ubicación"><input id="x" /></Campo>);
    expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Indica la ubicación');
  });

  it('Barras oculta las categorías con valor cero', () => {
    render(<Barras titulo="Por estado" datos={{ Registrada: 2, Cerrada: 0 }} />);
    expect(screen.getByText('Registrada')).toBeInTheDocument();
    expect(screen.queryByText('Cerrada')).not.toBeInTheDocument();
  });
});
