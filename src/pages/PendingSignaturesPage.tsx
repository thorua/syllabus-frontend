import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, PenLine } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageContainer } from '../components/composites';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Modal } from '../components/ui/modal';
import { getErrorMessage } from '../api/client';
import { useMyCertificate, usePendingSignatures, useSignBatch } from '../hooks';
import { formatDate } from '../lib/utils';
import type { BatchSignResult, PendingSignature } from '../types';

const PASO = { DEPARTAMENTO: 'Coordinación', REGISTRO: 'Registro Académico' } as const;

/**
 * Bandeja de firmas: los syllabus vigentes que esperan la firma del usuario (coordinación del
 * departamento o Registro). Se revisan uno por uno y se firman varios a la vez con una sola
 * contraseña; si uno cambió mientras tanto, los demás igual quedan firmados.
 */
export function PendingSignaturesPage() {
  const { data: pendientes = [], isLoading } = usePendingSignatures();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [firmando, setFirmando] = useState(false);

  const elegidos = pendientes.filter((p) => seleccion.has(p.id));
  const todos = pendientes.length > 0 && elegidos.length === pendientes.length;

  const alternar = (id: string) =>
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Layout>
      <PageContainer
        title="Pendientes de firma"
        description="Syllabus vigentes que esperan su firma digital"
        action={
          elegidos.length > 0 ? (
            <Button
              onClick={() => setFirmando(true)}
              className="bg-uam-blue hover:bg-uam-blue-dark"
            >
              <PenLine className="mr-2 h-4 w-4" />
              Firmar {elegidos.length} seleccionado{elegidos.length === 1 ? '' : 's'}
            </Button>
          ) : undefined
        }
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            {isLoading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : pendientes.length === 0 ? (
              <p className="text-sm text-gray-500">No tiene syllabus pendientes de firma.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="w-8 py-2">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={todos}
                        onChange={() =>
                          setSeleccion(todos ? new Set() : new Set(pendientes.map((p) => p.id)))
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="py-2">Syllabus</th>
                    <th className="py-2">Ofrecida por</th>
                    <th className="py-2">Firma de</th>
                    <th className="py-2">Actualizado</th>
                    <th className="w-10 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${p.subjectName}`}
                          checked={seleccion.has(p.id)}
                          onChange={() => alternar(p.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="py-2">
                        <p className="font-medium text-gray-900">{p.subjectName}</p>
                        <p className="text-xs text-gray-500">
                          {p.subjectCode} · {p.academicPeriod} · versión {p.version}
                        </p>
                      </td>
                      <td className="py-2 text-gray-600">{p.offeredBy}</td>
                      <td className="py-2 text-gray-600">{PASO[p.step]}</td>
                      <td className="py-2 text-gray-500">{formatDate(p.updatedAt)}</td>
                      <td className="py-2">
                        <Link to={`/syllabus/${p.id}`} title="Revisar el syllabus">
                          <Eye className="h-4 w-4 text-uam-blue" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </PageContainer>
      {firmando && (
        <BatchSignModal
          seleccion={elegidos}
          onClose={() => setFirmando(false)}
          onDone={() => setSeleccion(new Set())}
        />
      )}
    </Layout>
  );
}

function BatchSignModal({
  seleccion,
  onClose,
  onDone,
}: {
  seleccion: PendingSignature[];
  onClose: () => void;
  onDone: () => void;
}) {
  // Copia de la selección: al firmar, la bandeja se actualiza pero el resumen sigue mostrando sus nombres.
  const [items] = useState(seleccion);
  const { data: certificado, isLoading: consultando } = useMyCertificate();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [resultados, setResultados] = useState<BatchSignResult[] | null>(null);
  const firmar = useSignBatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await firmar.mutateAsync({
        items: items.map((p) => ({ id: p.id, version: p.version })),
        password,
        certificate: archivo,
      });
      setResultados(r);
      onDone();
      const firmados = r.filter((x) => x.signed).length;
      if (firmados === r.length) toast.success(`${firmados} syllabus firmados`);
      else toast.error(`${firmados} de ${r.length} firmados; revise los que no se firmaron`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo firmar'));
    }
  };

  const nombre = (id: string) => items.find((p) => p.id === id)?.subjectName ?? id;

  return (
    <Modal isOpen onClose={onClose} title={`Firmar ${items.length} syllabus`} size="md">
      {resultados ? (
        <div className="space-y-3">
          <ul className="space-y-1 text-sm">
            {resultados.map((r) => (
              <li key={r.id} className={r.signed ? 'text-green-700' : 'text-red-700'}>
                {r.signed ? '✔' : '✘'} {nombre(r.id)}
                {!r.signed && <span className="block text-xs">{r.message}</span>}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Se firma la versión que aparece en la bandeja de cada syllabus. Revíselos antes de
            firmar: la firma queda en el PDF de cada uno.
          </p>
          {consultando ? (
            <p className="text-sm text-gray-500">Consultando su certificado registrado...</p>
          ) : certificado ? (
            <p className="rounded-lg bg-uam-gray-light/50 p-3 text-sm">
              Se usará su certificado registrado:{' '}
              <span className="font-medium">
                {/CN=([^,]+)/.exec(certificado.subject)?.[1] ?? certificado.subject}
              </span>
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="lote-archivo">Certificado de firma digital (.p12 o .pfx)</Label>
              <Input
                id="lote-archivo"
                type="file"
                accept=".p12,.pfx,application/x-pkcs12"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="lote-clave">Contraseña del certificado</Label>
            <Input
              id="lote-clave"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={firmar.isPending || consultando}>
              <PenLine className="mr-2 h-4 w-4" />
              {firmar.isPending ? 'Firmando...' : 'Firmar'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
