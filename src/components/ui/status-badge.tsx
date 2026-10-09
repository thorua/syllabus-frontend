import { cn } from '../../lib/utils';
import { Badge } from './badge';
import {
  SyllabusStatus,
  Role,
  SyllabusStatusLabels,
  RoleLabels,
  SyllabusStatusColors,
  RoleColors,
} from '../../types';

function SyllabusStatusBadge({ status }: { status: SyllabusStatus }) {
  return (
    <Badge
      className={cn('border', SyllabusStatusColors[status])}
    >
      {SyllabusStatusLabels[status]}
    </Badge>
  );
}
SyllabusStatusBadge.displayName = 'SyllabusStatusBadge';

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge
      className={cn('border', RoleColors[role])}
    >
      {RoleLabels[role]}
    </Badge>
  );
}
RoleBadge.displayName = 'RoleBadge';

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={cn(
        'border',
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      )}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}
ActiveBadge.displayName = 'ActiveBadge';

export { SyllabusStatusBadge, RoleBadge, ActiveBadge };
