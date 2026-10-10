import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EvaluationTableEditor } from './EvaluationTableEditor';
import type { EvaluationCorte } from '../../types';

const cortes: EvaluationCorte[] = [
  {
    corte: 1,
    label: 'PRIMER CORTE',
    porcentaje: 40,
    tipos: [
      { tipo: 'Quiz', porcentaje: 50 },
      { tipo: 'Taller', porcentaje: 50 },
    ],
  },
  {
    corte: 2,
    label: 'SEGUNDO CORTE',
    porcentaje: 60,
    tipos: [{ tipo: 'Proyecto', porcentaje: 80 }],
  },
];

describe('EvaluationTableEditor', () => {
  afterEach(cleanup);

  it('muestra los cortes de la plantilla como texto fijo y la suma de cada corte', () => {
    render(<EvaluationTableEditor value={cortes} onChange={() => {}} />);
    expect(screen.getByText('PRIMER CORTE')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByText('100% de 100%')).toBeTruthy();
    expect(screen.getByText('80% de 100%')).toBeTruthy();
    // El rótulo y el % del corte no son editables: solo hay campos para los tipos.
    expect(screen.queryByDisplayValue('PRIMER CORTE')).toBeNull();
  });

  it('actualiza el porcentaje parcial de un tipo sin tocar los demás cortes', () => {
    const onChange = vi.fn();
    render(<EvaluationTableEditor value={cortes} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('SEGUNDO CORTE: % parcial 1'), {
      target: { value: '100' },
    });
    expect(onChange).toHaveBeenCalledWith([
      cortes[0],
      { ...cortes[1], tipos: [{ tipo: 'Proyecto', porcentaje: 100 }] },
    ]);
  });

  it('agrega tipos y no permite dejar un corte sin tipos', () => {
    const onChange = vi.fn();
    render(<EvaluationTableEditor value={cortes} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Agregar tipo/ })[1]);
    expect(onChange.mock.calls[0][0][1].tipos).toHaveLength(2);

    const quitar = screen.getAllByTitle('Quitar tipo');
    expect((quitar[2] as HTMLButtonElement).disabled).toBe(true);
  });
});
