/**
 * Parsea el campo follow_up_date que puede tener varios formatos:
 *   "YYYY-MM-DD"
 *   "YYYY-MM-DD HH:mm"
 *   "YYYY-MM-DD HH:mm-HH:mm"
 */

const DEFAULT_START = '09:00';
const DEFAULT_END = '09:30';

export interface ParsedFollowUp {
  date: string;
  startTime: string;
  endTime: string;
}

export function parseFollowUpDate(raw: string | null | undefined): ParsedFollowUp {
  const dateStr = raw ?? '';
  const date = dateStr.split(/[T ]/)[0];
  const timePart = dateStr.split(/[T ]/)[1] ?? '';
  const [startTime, endTime] = timePart.split('-');
  return {
    date,
    startTime: startTime?.substring(0, 5) || DEFAULT_START,
    endTime: endTime?.substring(0, 5) || DEFAULT_END,
  };
}
