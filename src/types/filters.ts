export type SortDirection = 'asc' | 'desc';

export interface ConsultationFilters {
  petId?: string;
  vetName?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
}
