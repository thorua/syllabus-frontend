import type { ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SyllabusStatusBadge } from '../../components/ui/status-badge';
import { SectionContent } from '../../components/syllabus/SectionContent';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import {
  useAuth,
  useExportSyllabus,
  usePrintSyllabus,
  useSettings,
  useSyllabus,
  useSyllabusVersions,
} from '../../hooks';
import { syllabusAccess } from '../../lib/syllabusAccess';
import {
  formatDate,
  getSubjectCode,
  getSubjectName,
  getDepartmentName,
  getProgramName,
  getSubjectCredits,
  getSubjectSemester,
  getProfessorName,
  getCreatorName,
  getModifierName,
} from '../../lib/utils';
import {
  ArrowLeft,
  Download,
  Printer,
  Edit,
  History,
  BookOpen,
  User,
  Calendar,
  CreditCard,
  GraduationCap,
  FileText,
} from 'lucide-react';

/** UC10: contenido vigente del syllabus; a quien lo gestiona le muestra también su historial. */
export function SyllabusDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { can } = useAuth();
  const navigate = useNavigate();
  const { data: syllabus, isLoading: loading } = useSyllabus(id);
  const { data: config } = useSettings();
  const access = syllabus ? syllabusAccess(syllabus, can) : null;
  const { data: versions = [] } = useSyllabusVersions(id, !!access?.versions);
  const exportMutation = useExportSyllabus();
  const printMutation = usePrintSyllabus();

  const handlePrint = async () => {
    try {
      await printMutation.mutateAsync(id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al preparar la impresión'));
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync(id);
      toast.success('Syllabus exportado correctamente');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar syllabus'));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-uam-gray-dark">Cargando...</div>
      </Layout>
    );
  }

  if (!syllabus || !access) {
    return (
      <Layout>
        <div className="text-center py-12 text-uam-gray-dark">Syllabus no encontrado</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/syllabus')}
              className="text-uam-gray-dark hover:text-uam-blue"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{syllabus.title}</h1>
              <p className="text-uam-gray-dark mt-1">
                {getSubjectCode(syllabus)} — {getSubjectName(syllabus)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-uam-blue/10 text-uam-blue text-sm font-mono">
                  <FileText className="h-3 w-3" />
                  <span className="font-bold">Formato Almera:</span>
                  {syllabus.documentCode || config?.documentCode || '—'} · versión{' '}
                  {config?.documentVersion ?? '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyllabusStatusBadge status={syllabus.status} />
            {can('syllabus:export') && (
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="border-uam-gray-mid/30 hover:bg-uam-blue hover:text-white hover:border-uam-blue"
              >
                <Download className="mr-2 h-4 w-4" />
                {exportMutation.isPending ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            )}
            {can('syllabus:export') && (
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={printMutation.isPending}
                title="Abre el formato estándar Almera para imprimirlo"
                className="border-uam-gray-mid/30 hover:bg-uam-blue hover:text-white hover:border-uam-blue"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            )}
            {access.edit && (
              <Link to={`/syllabus/${id}/edit`}>
                <Button className="bg-uam-blue hover:bg-uam-blue-dark shadow-uam">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Información General */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-uam-blue flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={<GraduationCap className="h-4 w-4" />}
                label="Departamento"
                value={syllabus.subject.department ? getDepartmentName(syllabus) : 'Posgrado'}
              />
              <InfoItem
                icon={<BookOpen className="h-4 w-4" />}
                label="Programa"
                value={getProgramName(syllabus)}
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Período Académico"
                value={syllabus.academicPeriod || '—'}
              />
              <InfoItem
                icon={<CreditCard className="h-4 w-4" />}
                label="Créditos"
                value={getSubjectCredits(syllabus)}
              />
              <InfoItem
                icon={<GraduationCap className="h-4 w-4" />}
                label="Semestre"
                value={getSubjectSemester(syllabus)}
              />
              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Docente"
                value={getProfessorName(syllabus)}
              />
              <InfoItem
                icon={<User className="h-4 w-4" />}
                label="Creado por"
                value={getCreatorName(syllabus)}
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Última actualización"
                value={formatDate(syllabus.updatedAt)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Secciones */}
        {syllabus.sections && syllabus.sections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-uam-blue">Secciones del Syllabus</h2>
            {syllabus.sections.map((section, index) => (
              <Card key={section.id || index} className="border-0 shadow-sm">
                <CardHeader className="pb-2 border-b border-uam-yellow/20">
                  <CardTitle className="text-sm font-semibold text-uam-blue">
                    {index + 1}. {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <SectionContent section={section} syllabus={syllabus} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Historial (UC14) */}
        {access.versions && versions.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-uam-blue flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historial de Versiones
                </CardTitle>
                <Link to={`/syllabus/${id}/versions`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-uam-gray-mid/30 hover:border-uam-blue hover:text-uam-blue"
                  >
                    <History className="mr-2 h-3 w-3" />
                    Ver todo
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {versions.slice(0, 5).map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-lg border border-uam-gray-mid/20 p-3 hover:bg-white transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        Versión {version.versionNumber}
                      </p>
                      <p className="text-xs text-uam-gray-dark">
                        {version.changeDescription} — {getModifierName(version)}
                      </p>
                    </div>
                    <p className="text-xs text-uam-gray-mid">{formatDate(version.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-uam-gray-light/50">
      <span className="text-uam-blue mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-medium text-uam-gray-mid uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
