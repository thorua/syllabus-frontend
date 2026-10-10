// Encabezado institucional del documento, réplica del formato oficial UAM:
// tres secciones => [logo | título | código/versión/fecha]
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useSettings } from '../../hooks';

export type HeaderField = 'headerTitle' | 'documentCode' | 'documentDate';

interface SyllabusHeaderEditorProps {
  headerTitle: string;
  documentCode: string;
  documentDate: string;
  /** Sin el permiso syllabus:header el encabezado se muestra pero no se edita (UC19). */
  readOnly: boolean;
  onChange: (field: HeaderField, value: string) => void;
}

export function SyllabusHeaderEditor({
  headerTitle,
  documentCode,
  documentDate,
  readOnly,
  onChange,
}: SyllabusHeaderEditorProps) {
  const { data: config } = useSettings();

  // Un valor vacío significa "usar el de la configuración institucional".
  const fields: Record<HeaderField, { value: string; fallback?: string }> = {
    headerTitle: { value: headerTitle, fallback: config?.syllabusHeader },
    documentCode: { value: documentCode, fallback: config?.documentCode },
    documentDate: { value: documentDate, fallback: config?.documentDate },
  };

  const field = (name: HeaderField, id: string, className: string, readClassName: string) =>
    readOnly ? (
      <span id={id} className={readClassName}>
        {fields[name].value || fields[name].fallback || '—'}
      </span>
    ) : (
      <Input
        id={id}
        value={fields[name].value}
        placeholder={fields[name].fallback}
        onChange={(e) => onChange(name, e.target.value)}
        className={className}
      />
    );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">
          Encabezado del Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_230px] divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white">
            <div className="flex items-center justify-center p-4 min-h-24">
              {config?.universityLogoUrl ? (
                <img
                  src={config.universityLogoUrl}
                  alt="Logo Universidad"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-400 text-center">
                  Logo
                  <br />
                  Universidad
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center px-4 py-4 text-center min-h-24">
              <Label htmlFor="syl-header-title" className="text-xs font-medium text-gray-400">
                Título del encabezado
              </Label>
              <div className="mt-1 w-full min-w-0">
                {field(
                  'headerTitle',
                  'syl-header-title',
                  'w-full min-w-0 text-center font-bold text-uam-blue bg-transparent border-0 border-b border-dashed border-uam-blue/40 rounded-none px-1 shadow-none focus-visible:ring-0 focus:border-uam-blue focus:border-b-solid h-auto py-1',
                  'font-bold text-uam-blue',
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-2 px-5 py-4 min-h-24">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="syl-header-code"
                  className="text-xs font-medium text-gray-500 whitespace-nowrap"
                >
                  CÓDIGO
                </Label>
                {field(
                  'documentCode',
                  'syl-header-code',
                  'h-8 w-28 min-w-0 text-right text-xs bg-gray-50',
                  'text-sm text-gray-700',
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-gray-500">VERSIÓN</Label>
                <span className="h-8 flex items-center text-sm font-semibold text-gray-700 tabular-nums">
                  {config?.documentVersion ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="syl-header-date"
                  className="text-xs font-medium text-gray-500 whitespace-nowrap"
                >
                  FECHA ELABORACIÓN
                </Label>
                {field(
                  'documentDate',
                  'syl-header-date',
                  'h-8 w-28 min-w-0 text-right text-xs bg-gray-50',
                  'text-sm text-gray-700',
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {readOnly
            ? 'El encabezado y la versión del formato los administra la institución.'
            : 'Deje un campo vacío para usar el valor de la configuración institucional. La versión del formato se administra en Configuración.'}
        </p>
      </CardContent>
    </Card>
  );
}
