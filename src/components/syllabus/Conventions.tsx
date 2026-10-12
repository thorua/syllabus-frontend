import { cn } from '../../lib/utils';
import { CONVENTIONS } from '../../lib/verification';
import type { CurriculumState } from '../../types';

/** Marca de color de un syllabus según la tabla de convenciones de verificación. */
export function ConventionBadge({ state, short }: { state: CurriculumState; short?: boolean }) {
  const c = CONVENTIONS[state];
  return (
    <span
      title={c.label}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        c.className,
      )}
    >
      <span aria-hidden>{c.mark}</span>
      {short ? null : c.label}
    </span>
  );
}

/** Tabla de convenciones: qué significa cada color. */
export function ConventionsLegend({ states }: { states?: CurriculumState[] }) {
  const shown = states ?? (Object.keys(CONVENTIONS) as CurriculumState[]);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <span className="font-semibold text-gray-700">Convenciones:</span>
      {shown.map((state) => (
        <ConventionBadge key={state} state={state} />
      ))}
    </div>
  );
}
