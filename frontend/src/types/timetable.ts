export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export const ALL_DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export type RoomType = "LECTURE_HALL" | "COMPUTER_LAB" | "SCIENCE_LAB" | "WORKSHOP" | "SEMINAR_ROOM";

export interface TimeInterval {
  startMinute: number;
  endMinute: number;
}

export interface BreakDefinition {
  id: string;
  name: string;
  startMinute: number;
  endMinute: number;
  appliesToDays: DayOfWeek[];
}

export interface DayPeriodStructure {
  day: DayOfWeek;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  periodDurationMinutes: number;
  breaks: BreakDefinition[];
}

export interface PeriodSlot extends TimeInterval {
  id: string;
  day: DayOfWeek;
  periodIndex: number;
  label: string;
}

export interface InstitutionConfig {
  institutionName: string;
  workingDays: DayOfWeek[];
  defaultStartTime: string;
  defaultEndTime: string;
  defaultPeriodDuration: number;
  breaks: BreakDefinition[];
  dayOverrides?: Partial<Record<DayOfWeek, Partial<DayPeriodStructure>>>;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  department?: string;
  maxWeeklyHours: number;
  maxDailyHours: number;
  unavailableSlots?: Array<{ day: DayOfWeek; interval: TimeInterval }>;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  roomType: RoomType;
  isLab: boolean;
}

export interface Section {
  id: string;
  name: string;
  program: string;
  academicYear: number;
  semester: number;
  studentCount: number;
}

export interface CourseOffering {
  id: string;
  subjectCode: string;
  subjectName: string;
  sectionId: string;
  teacherId: string;
  roomId: string;
  weeklyHours: number;
  isLab: boolean;
  consecutivePeriods: number; // e.g., 2, 3, or 4 for labs
}

export interface TimetableEntry {
  id: string;
  offeringId: string;
  sectionId: string;
  teacherId: string;
  roomId: string;
  subjectName: string;
  day: DayOfWeek;
  periodIndex: number;
  startMinute: number;
  endMinute: number;
  isLab: boolean;
  isContinuation: boolean;
}

export interface SolverDiagnostics {
  totalRequiredSlots: number;
  totalAvailableSlots: number;
  scheduledSlots: number;
  wallTimeMs: number;
  backtrackSteps: number;
  status: "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "TIMEOUT" | "VALIDATION_FAILED";
  failureReason?: string;
}
