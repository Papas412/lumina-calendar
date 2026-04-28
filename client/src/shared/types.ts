export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO format
  time?: string;
  slot: 'whole-day' | 'am' | 'pm';
  color: string;
}

export type CreateAppointmentDto = Omit<Appointment, 'id'>;

// Explicitly export something to ensure it's treated as a module by Vite
export const APP_VERSION = '1.0.0';
