import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, PenLine, ShieldCheck } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { signaturesApi } from '../../api/endpoints';
import { useSignSyllabus, useSyllabusSignatures } from '../../hooks';
import { formatDateTime } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Modal } from '../ui/modal';
import { ConventionBadge } from './Conventions';
import { conventionOf } from '../../lib/verification';
import type { Syllabus, SyllabusSignatures } from '../../types';

/** Nombre común (CN) del titular de un certificado, para mostrarlo. */
const commonName = (subject: string) => /CN=([^,]+)/.exec(subject)?.[1] ?? subject;

/**
 * Aprobación con firma digital: firma primero la coordinación que ofrece la asignatura y después
 * Registro Académico. Con las dos firmas el syllabus queda verificado y se exporta el PDF firmado.
 */
export function SignaturePanel({ syllabus }: { syllabus: Syllabus }) {
  const { data: firmas } = useSyllabusSignatures(syllabus.id);
  const [signing, setSigning] = useState(false);
  if (!firmas) return null;

  const firma = (step: 'DEPARTAMENTO' | 'REGISTRO') =>
    firmas.signatures.find((f) => f.step === step);
  const pasos = [
    {
      step: 'DEPARTAMENTO' as const,
      title: 'Coordinación que ofrece la asignatura',
      pending: firmas.nextStep === 'DEPARTAMENTO' ? firmas.nextSigner : null,
    },
    {
      step: 'REGISTRO' as const,
      title: 'Registro Académico',
      pending: firmas.nextStep === 'REGISTRO' ? firmas.nextSigner : null,
    },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-uam-blue flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Aprobación con firma digital
          </CardTitle>
          <ConventionBadge state={conventionOf(syllabus)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="grid gap-3 md:grid-cols-2">
          {pasos.map((p, i) => {
            const hecha = firma(p.step);
            return (
              <li key={p.step} className="rounded-lg border border-uam-gray-mid/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-uam-gray-mid">
                  {i + 1}. {p.title}
                </p>
                {hecha ? (
                  <div className="mt-1 text-sm">
                    <p className="flex items-center gap-1 font-medium text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Firmado por {hecha.signerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(hecha.signedAt)} · certificado de{' '}
                      {commonName(hecha.certificateSubject)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {p.pending ? `Pendiente: ${p.pending}` : 'Pendiente'}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-gray-500">
          {!firmas.signable
            ? 'Solo se firma un syllabus activo (vigente). Cada edición crea una versión nueva que vuelve a necesitar las firmas.'
            : firmas.state === 'VERIFICADO'
              ? `Versión ${firmas.version} verificada: «Exportar PDF» descarga el documento con las dos firmas digitales, válidas en Adobe Acrobat.`
              : `Las firmas aplican a la versión ${firmas.version}. Si el syllabus se edita, hay que volver a firmarlo.`}
        </p>
        {firmas.canSign && (
          <Button onClick={() => setSigning(true)} className="bg-uam-blue hover:bg-uam-blue-dark">
            <PenLine className="mr-2 h-4 w-4" />
            Revisar y firmar
          </Button>
        )}
      </CardContent>
      {signing && (
        <SignModal syllabus={syllabus} firmas={firmas} onClose={() => setSigning(false)} />
      )}
    </Card>
  );
}

interface SignModalProps {
  syllabus: Syllabus;
  firmas: SyllabusSignatures;
  onClose: () => void;
}

/** Muestra el PDF que se va a firmar en el visor del navegador y firma con el certificado. */
function SignModal({ syllabus, firmas, onClose }: SignModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [useOther, setUseOther] = useState(!firmas.storedCertificate);
  const [file, setFile] = useState<File | null>(null);
  const [remember, setRemember] = useState(true);
  const [password, setPassword] = useState('');
  const sign = useSignSyllabus();

  useEffect(() => {
    let url: string | null = null;
    signaturesApi
      .preview(syllabus.id)
      .then(({ blob }) => {
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      })
      .catch((error) => toast.error(getErrorMessage(error, 'No se pudo preparar el documento')));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [syllabus.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await sign.mutateAsync({
        id: syllabus.id,
        input: {
          version: firmas.version,
          password,
          certificate: useOther ? file : null,
          remember: useOther && remember,
        },
      });
      toast.success(
        result.state === 'VERIFICADO'
          ? 'Syllabus firmado y verificado'
          : 'Firma registrada; falta la firma de Registro Académico',
      );
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo firmar el syllabus'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Firmar como ${firmas.nextSigner ?? ''}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Revise el documento que va a firmar (versión {firmas.version}). La firma queda en el PDF y
          Adobe Acrobat la muestra en su panel de firmas.
        </p>
        <div className="h-[50vh] overflow-hidden rounded border border-uam-gray-mid/30 bg-gray-100">
          {pdfUrl ? (
            <iframe title="Documento por firmar" src={pdfUrl} className="h-full w-full" />
          ) : (
            <p className="p-4 text-sm text-gray-500">Preparando el documento...</p>
          )}
        </div>

        {firmas.storedCertificate && !useOther ? (
          <div className="rounded-lg bg-uam-gray-light/50 p-3 text-sm">
            <p>
              Certificado registrado:{' '}
              <span className="font-medium">{commonName(firmas.storedCertificate.subject)}</span>{' '}
              (vence {formatDateTime(firmas.storedCertificate.notAfter)})
            </p>
            <button
              type="button"
              className="text-xs text-uam-blue underline"
              onClick={() => setUseOther(true)}
            >
              Usar otro certificado
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="sign-file">Certificado de firma digital (.p12 o .pfx)</Label>
            <Input
              id="sign-file"
              type="file"
              accept=".p12,.pfx,application/x-pkcs12"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Recordar este certificado para mis próximas firmas
            </label>
            <p className="text-xs text-gray-500">
              ¿No sabe dónde está su certificado? Vea{' '}
              <Link to="/firma-digital" className="text-uam-blue underline">
                Mi firma digital
              </Link>
              .
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="sign-password">Contraseña del certificado</Label>
          <Input
            id="sign-password"
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
          <Button type="submit" disabled={sign.isPending || !pdfUrl}>
            <PenLine className="mr-2 h-4 w-4" />
            {sign.isPending ? 'Firmando...' : 'Firmar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
