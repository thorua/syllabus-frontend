import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import { useRenewSyllabus } from '../../hooks';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Modal } from '../ui/modal';
import type { Syllabus } from '../../types';

/** Período siguiente: 01 → 02 y 02 o 03 → 01 del año siguiente. */
export function nextPeriod(period: string): string {
  const [year, term] = period.split('-').map(Number);
  return term === 1 ? `${year}-02` : `${year + 1}-01`;
}

/**
 * Renovar sin ajustes (guía GFR-GUI-031): copia el syllabus al período indicado tal como está y su
 * historial registra que no tuvo ajustes. Si necesita cambios, se editan después.
 */
export function RenewModal({ syllabus, onClose }: { syllabus: Syllabus; onClose: () => void }) {
  const [period, setPeriod] = useState(nextPeriod(syllabus.academicPeriod));
  const renew = useRenewSyllabus();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevo = await renew.mutateAsync({ id: syllabus.id, academicPeriod: period });
      toast.success(`Syllabus renovado para ${period}`);
      onClose();
      navigate(`/syllabus/${nuevo.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo renovar el syllabus'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Renovar sin ajustes" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Se crea el syllabus de {syllabus.subject.code} para otro período con el mismo contenido.
          El historial deja constancia de que no tuvo ajustes respecto a {syllabus.academicPeriod},
          y la versión nueva necesita las firmas de aprobación.
        </p>
        <div className="space-y-2">
          <Label htmlFor="renew-period">Período</Label>
          <Input
            id="renew-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            pattern="\d{4}-0[1-3]"
            title="AAAA-01, AAAA-02 o AAAA-03"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={renew.isPending}>
            Renovar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
