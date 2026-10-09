import type { SectionType, SyllabusStatus } from './enums';
import type { Subject } from './catalog';
import type { User } from './user';

export interface SyllabusSection {
  id?: string;
  sectionType: SectionType;
  title: string;
  content: string;
  order: number;
}

export interface Syllabus {
  id: string;
  title: string;
  academicPeriod: string;
  status: SyllabusStatus;
  headerTitle?: string;
  documentCode?: string;
  documentDate?: string;
  subject: Subject;
  sections: SyllabusSection[];
  createdBy: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusFilters {
  search?: string;
  departmentId?: string;
  programId?: string;
  subjectId?: string;
  academicPeriod?: string;
  status?: SyllabusStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
