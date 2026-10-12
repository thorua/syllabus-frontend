import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageContainer } from '../components/composites';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { getErrorMessage } from '../api/client';
import { useDeleteCertificate, useMyCertificate, useSaveCertificate } from '../hooks';
import { formatDate } from '../lib/utils';

/**
 * Mi firma digital: el firmante deja registrado su certificado (.p12/.pfx) una sola vez para no
 * tener que buscar el archivo en cada firma. El archivo queda protegido por su contraseña, que el
 * sistema no guarda: se pide en cada firma.
 */
export function CertificatePage() {
  const { data: certificate, isLoading } = useMyCertificate();
  const save = useSaveCertificate();
  const remove = useDeleteCertificate();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      await save.mutateAsync({ file, password });
      toast.success('Certificado registrado');
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
                <Button type="submit" disabled={save.isPending || !file}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {save.isPending ? 'Comprobando...' : 'Registrar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
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
                  Acrobat → Preferencias → Firmas → Identidades y certificados de confianza → ID
                  digitales: seleccione su ID y use «Exportar». El archivo suele estar en{' '}
                  <code>%APPDATA%\Adobe\Acrobat\DC\Security</code>.
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
