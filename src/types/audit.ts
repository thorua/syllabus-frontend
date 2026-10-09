export interface AuditLog {
  id: string;
  userId: string | null;
  user: { id: string; name: string; email: string } | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditFilters {
  userId?: string;
  entity?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditOptions {
  entities: string[];
  actions: string[];
}
