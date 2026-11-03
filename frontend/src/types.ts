export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface Teacher {
  id: string;
  name: string;
  subject: string;
}

export interface Section {
  id: string;
  name: string;
}

export interface Requirement {
  id: string;
  sectionId: string;
  teacherId: string;
  subject: string;
  periodsPerWeek: number;
}

export interface TimetableSlot {
  day: Day;
  period: number;
  sectionId: string;
  teacherId: string;
  subject: string;
}
