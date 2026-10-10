import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { SectionContent } from '../../components/syllabus/SectionContent';
import { ArrowLeft, Clock, User, FileText, GitCompare } from 'lucide-react';
import { useSyllabus, useSyllabusVersion, useSyllabusVersions } from '../../hooks';
import { compareSnapshots } from '../../lib/diff';
import type { DiffLine, SectionChange } from '../../lib/diff';
import { cn, formatDateTime, getModifierName } from '../../lib/utils';
import type { SyllabusVersion } from '../../types';

type View = 'changes' | 'content';

const SECTION_BADGES: Record<SectionChange['status'], { label: string; className: string }> = {
  added: { label: 'Agregada', className: 'bg-green-100 text-green-800' },
  removed: { label: 'Eliminada', className: 'bg-red-100 text-red-800' },
  modified: { label: 'Modificada', className: 'bg-amber-100 text-amber-800' },
  unchanged: { label: 'Sin cambios', className: 'bg-gray-100 text-gray-600' },
};

/** UC14: quién modificó el syllabus, cuándo, por qué y qué cambió entre versiones. */
export function SyllabusVersionsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: syllabus } = useSyllabus(id);
  const { data: versions = [], isLoading: loading } = useSyllabusVersions(id);
  const [selectedId, setSelectedId] = useState<string>();
  const [compareId, setCompareId] = useState<string>();
  const [view, setView] = useState<View>('changes');

  // Por defecto: la versión más reciente comparada con la inmediatamente anterior.
  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];
  const previous = selected
    ? versions.find((v) => v.versionNumber < selected.versionNumber)
    : undefined;
  const compareTo = versions.find((v) => v.id === compareId) ?? previous;

  const { data: selectedFull } = useSyllabusVersion(id, selected?.id);
  const { data: compareFull } = useSyllabusVersion(id, compareTo?.id);

  const select = (version: SyllabusVersion) => {
    setSelectedId(version.id);
    setCompareId(undefined);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Cargando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/syllabus/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              Historial de Versiones
            </h1>
            <p className="text-gray-500 truncate">{syllabus?.title ?? '—'}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Línea de tiempo */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Versiones ({versions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay versiones registradas</p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <button
                        type="button"
                        key={version.id}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border cursor-pointer transition-colors',
                          selected?.id === version.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50',
                        )}
                        onClick={() => select(version)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Versión {version.versionNumber}</span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(version.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{version.changeDescription}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Por: {getModifierName(version)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Versión seleccionada */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Versión {selected.versionNumber}</CardTitle>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(selected.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>
                      Modificado por: {getModifierName(selected)} ({selected.modifiedBy.email})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{selected.changeDescription}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button
                      type="button"
                      size="sm"
                      variant={view === 'changes' ? 'default' : 'outline'}
                      onClick={() => setView('changes')}
                      disabled={!compareTo}
                    >
                      <GitCompare className="mr-2 h-4 w-4" />
                      Cambios
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={view === 'content' || !compareTo ? 'default' : 'outline'}
                      onClick={() => setView('content')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Contenido
                    </Button>
                    {view === 'changes' && compareTo && (
                      <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                        Comparar con
                        <select
                          value={compareTo.id}
                          onChange={(e) => setCompareId(e.target.value)}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {versions
                            .filter((v) => v.id !== selected.id)
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                Versión {v.versionNumber}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                  </div>

                  {!selectedFull?.snapshot ? (
                    <p className="text-gray-500 text-sm">Cargando contenido...</p>
                  ) : view === 'changes' && compareTo ? (
                    compareFull?.snapshot ? (
                      <Changes before={compareFull} after={selectedFull} />
                    ) : (
                      <p className="text-gray-500 text-sm">Cargando comparación...</p>
                    )
                  ) : (
                    <div className="space-y-4">
                      {selectedFull.snapshot.sections.map((section, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <h4 className="font-medium text-sm mb-2">
                            {index + 1}. {section.title}
                          </h4>
                          <SectionContent section={section} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleccione una versión para ver su contenido</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/** Diferencias entre dos versiones; la más antigua se muestra como "antes". */
function Changes({ before, after }: { before: SyllabusVersion; after: SyllabusVersion }) {
  const [older, newer] =
    before.versionNumber < after.versionNumber ? [before, after] : [after, before];
  const { fields, sections } = compareSnapshots(older.snapshot!, newer.snapshot!);
  const changed = sections.filter((s) => s.status !== 'unchanged');

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        De la versión {older.versionNumber} a la versión {newer.versionNumber}:{' '}
        {fields.length + changed.length === 0
          ? 'sin cambios de contenido.'
          : `${changed.length} sección(es) con cambios${fields.length ? ` y ${fields.length} dato(s) general(es)` : ''}.`}
      </p>

      {fields.length > 0 && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2 font-medium">Dato</th>
                <th className="p-2 font-medium">Versión {older.versionNumber}</th>
                <th className="p-2 font-medium">Versión {newer.versionNumber}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.label} className="border-t">
                  <td className="p-2 font-medium">{f.label}</td>
                  <td className="p-2 text-red-700 line-through">{f.before}</td>
                  <td className="p-2 text-green-700">{f.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.key} className="rounded-lg border bg-gray-50">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <h4 className="font-medium text-sm">{section.title}</h4>
            <Badge className={cn('border', SECTION_BADGES[section.status].className)}>
              {SECTION_BADGES[section.status].label}
            </Badge>
          </div>
          {section.status !== 'unchanged' && <DiffView lines={section.lines} />}
        </div>
      ))}
    </div>
  );
}

const LINE_STYLES: Record<DiffLine['type'], string> = {
  added: 'bg-green-50 text-green-800',
  removed: 'bg-red-50 text-red-800 line-through',
  equal: 'text-gray-600',
};

const LINE_MARKS: Record<DiffLine['type'], string> = { added: '+', removed: '−', equal: ' ' };

function DiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <pre className="overflow-x-auto p-3 text-xs leading-5 whitespace-pre-wrap">
      {lines.map((line, i) => (
        <div key={i} className={cn('px-1', LINE_STYLES[line.type])}>
          <span className="select-none pr-2 text-gray-400">{LINE_MARKS[line.type]}</span>
          {line.text || ' '}
        </div>
      ))}
    </pre>
  );
}
