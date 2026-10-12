/** Tipo de actividad de un corte; su porcentaje es parcial (relativo al corte). */
export interface EvaluationTipo {
  tipo: string;
  porcentaje: number;
}

/** Corte de evaluación: rótulo y porcentaje sobre la nota final los fija la plantilla (UC20). */
export interface EvaluationCorte {
  corte: number;
  label: string;
  porcentaje: number;
  tipos: EvaluationTipo[];
}

export type EvaluationTemplate = EvaluationCorte[];

/** Configuración institucional (UC18–UC20), tal como la entrega GET /api/settings. */
export interface InstitutionalConfig {
  universityName: string;
  universityLogoUrl: string;
  universityAddress: string;
  universityPhone: string;
  universityEmail: string;
  facultyName: string;
  departmentName: string;
  syllabusHeader: string;
  documentCode: string;
  documentVersion: string;
  documentDate: string;
  syllabusSubtitle: string;
  footerText: string;
  evaluationTemplate: EvaluationTemplate;
}
