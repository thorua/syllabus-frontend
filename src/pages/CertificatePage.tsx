import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, PenLine, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageContainer } from '../components/composites';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SignaturePad } from '../components/SignaturePad';
import { getErrorMessage } from '../api/client';
import {
  useDeleteCertificate,
  useDeleteSignatureImage,
  useMyCertificate,
  useMySignatureImage,
  useSaveCertificate,
  useSaveSignatureImage,
} from '../hooks';
import { formatDate } from '../lib/utils';

/**
 * Mi firma digital: el firmante deja registrado su certificado (.p12/.pfx) una sola vez para no
 * tener que buscar el archivo en cada firma. El archivo queda protegido por su contraseña, que el
 * sistema no guarda: se pide en cada firma. También registra la imagen de su firma manuscrita,
 * que se dibuja en el sello visible del PDF.
 */
export function CertificatePage() {
  const { data: certificate, isLoading } = useMyCertificate();
  const save = useSaveCertificate();
  const remove = useDeleteCertificate();
  const saveAppearance = useSaveSignatureImage();
  const [file, setFile] = useState<File | null>(null);
  const [appearance, setAppearance] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      await save.mutateAsync({ file, password });
      if (appearance) await saveAppearance.mutateAsync(appearance);
      toast.success(appearance ? 'Certificado y firma registrados' : 'Certificado registrado');
      setPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo registrar el certificado'));
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync();
      toast.success('Certificado eliminado del sistema');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el certificado'));
    }
  };

  return (
    <Layout>
      <PageContainer
        title="Mi firma digital"
        description="Certificado con el que firma la aprobación de los syllabus"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-uam-blue flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Certificado registrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : certificate ? (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Titular:</span> {certificate.subject}
                  </p>
                  <p>
                    <span className="text-gray-500">Emitido por:</span> {certificate.issuer}
                  </p>
                  <p>
                    <span className="text-gray-500">Vence:</span> {formatDate(certificate.notAfter)}
                  </p>
                  <p>
                    <span className="text-gray-500">Registrado:</span>{' '}
                    {formatDate(certificate.uploadedAt)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600"
                    onClick={handleDelete}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="mr-2 h-3 w-3" /> Eliminar del sistema
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No tiene un certificado registrado: al firmar se le pedirá el archivo.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-gray-700">
                  {certificate ? 'Reemplazar certificado' : 'Registrar certificado'}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="cert-file">Archivo .p12 o .pfx</Label>
                  <Input
                    id="cert-file"
                    type="file"
                    accept=".p12,.pfx,application/x-pkcs12"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-password">Contraseña del certificado</Label>
                  <Input
                    id="cert-password"
                    type="password"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Solo se usa para comprobar el certificado; no se guarda. El archivo queda
                    protegido por ella y se le pedirá en cada firma.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-appearance">
                    Apariencia de su firma en Acrobat (opcional)
                  </Label>
                  <Input
                    id="cert-appearance"
                    type="file"
                    accept=".acrodata,image/png,image/jpeg"
                    onChange={(e) => setAppearance(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-gray-500">
                    El archivo <code>appearances.acrodata</code> de la misma carpeta que su .pfx:
                    trae el dibujo de su firma tal como lo pone Acrobat en el sello.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={save.isPending || saveAppearance.isPending || !file}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {save.isPending ? 'Comprobando...' : 'Registrar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <SignatureImageCard />

          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-uam-blue">
                ¿Dónde está mi certificado?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium">Si firma en Adobe Acrobat desde este computador</p>
                <ol className="ml-5 list-decimal space-y-1 text-gray-600">
                  <li>
                    Abra «Administrar certificados de usuario» (escriba <code>certmgr.msc</code> en
                    el menú Inicio de Windows).
                  </li>
                  <li>Entre a Personal → Certificados y busque el certificado con su nombre.</li>
                  <li>
                    Clic derecho → Todas las tareas → Exportar → «Sí, exportar la clave privada» →
                    formato .PFX, y asígnele una contraseña.
                  </li>
                  <li>Registre aquí el archivo .pfx con esa contraseña.</li>
                </ol>
              </div>
              <div>
                <p className="font-medium">Si creó su firma dentro de Acrobat</p>
                <p className="text-gray-600">
                  Pegue <code>%APPDATA%\Adobe\Acrobat\DC\Security</code> en la barra del Explorador
                  de archivos. Allí están los dos archivos: el certificado (.pfx, con la misma
                  contraseña que usa en Acrobat) y <code>appearances.acrodata</code>, con el dibujo
                  de su firma. Regístrelos juntos.
                </p>
              </div>
              <div>
                <p className="font-medium">Si su firma está en un token USB o en la nube</p>
                <p className="text-gray-600">
                  Esa clave no se puede exportar a un archivo. Avise a Registro Académico para
                  habilitar la firma remota de la entidad certificadora.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </Layout>
  );
}

/**
 * Imagen de la firma manuscrita: se dibuja en el recuadro o se sube una foto o escaneo. Sin ella,
 * el sello muestra el nombre en grande, como la apariencia predeterminada de Acrobat.
 */
function SignatureImageCard() {
  const { data: imagen, isLoading } = useMySignatureImage();
  const save = useSaveSignatureImage();
  const remove = useDeleteSignatureImage();
  const [modo, setModo] = useState<'dibujar' | 'subir'>('dibujar');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imagen) {
      setUrl(null);
      return;
    }
    const nueva = URL.createObjectURL(imagen);
    setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [imagen]);

  const guardar = async (blob: Blob) => {
    try {
      await save.mutateAsync(blob);
      toast.success('Imagen de la firma registrada');
      setArchivo(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo registrar la imagen'));
    }
  };

  const eliminar = async () => {
    try {
      await remove.mutateAsync();
      toast.success('Imagen de la firma eliminada');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo eliminar la imagen'));
    }
  };

  const pestana = (valor: 'dibujar' | 'subir', etiqueta: string, Icono: typeof PenLine) => (
    <button
      type="button"
      onClick={() => setModo(valor)}
      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
        modo === valor ? 'bg-uam-blue text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icono className="h-3 w-3" /> {etiqueta}
    </button>
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-uam-blue flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          Imagen de su firma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : url ? (
          <div className="space-y-2">
            <div className="flex h-28 items-center justify-center rounded-lg border bg-white p-2">
              <img src={url} alt="Su firma registrada" className="max-h-full max-w-full" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={eliminar}
              disabled={remove.isPending}
            >
              <Trash2 className="mr-2 h-3 w-3" /> Eliminar imagen
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No tiene una firma registrada: el sello muestra su nombre en grande, como Acrobat cuando
            no tiene una apariencia de firma.
          </p>
        )}

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium text-gray-700">
            {url ? 'Reemplazar imagen' : 'Registrar imagen'}
          </p>
          <div className="flex gap-1">
            {pestana('dibujar', 'Dibujar', PenLine)}
            {pestana('subir', 'Subir imagen', Upload)}
          </div>
          {modo === 'dibujar' ? (
            <SignaturePad onSave={guardar} saving={save.isPending} />
          ) : (
            <div className="space-y-2">
              <Input
                type="file"
                accept=".acrodata,image/png,image/jpeg"
                aria-label="Imagen de la firma"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-500">
                El archivo <code>appearances.acrodata</code> de Acrobat, o una foto o escaneo de su
                firma en una hoja blanca (PNG o JPG, hasta 2 MB). El fondo se quita solo.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => archivo && guardar(archivo)}
                disabled={!archivo || save.isPending}
              >
                <Upload className="mr-2 h-3 w-3" />{' '}
                {save.isPending ? 'Guardando...' : 'Guardar imagen'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
