import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { getErrorMessage } from './client';

function errorWith(data: unknown): AxiosError {
  const response = {
    data,
    status: 400,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return new AxiosError('Bad Request', '400', undefined, undefined, response as AxiosResponse);
}

describe('getErrorMessage', () => {
  it('usa el mensaje del backend', () => {
    expect(getErrorMessage(errorWith({ error: 'Syllabus no encontrado.' }), 'Error')).toBe(
      'Syllabus no encontrado.',
    );
  });

  it('agrega el primer motivo de un error de validación', () => {
    const error = errorWith({
      error: 'Datos inválidos.',
      details: {
        coordinationEmail: 'debe ser una dirección de correo electrónico con formato correcto',
      },
    });
    expect(getErrorMessage(error, 'Error')).toBe(
      'Datos inválidos: debe ser una dirección de correo electrónico con formato correcto',
    );
  });

  it('usa el mensaje por defecto si no hay respuesta del backend', () => {
    expect(getErrorMessage(new Error('red'), 'Error al guardar')).toBe('Error al guardar');
    expect(getErrorMessage(errorWith(undefined), 'Error al guardar')).toBe('Error al guardar');
  });
});
