export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

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

export const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const PERIODS = [0, 1, 2, 3, 4, 5];

export function generateTimetable(
  requirements: Requirement[],
  teachers: Teacher[],
  sections: Section[]
): { success: boolean; schedule: TimetableSlot[]; errors: string[] } {
  const schedule: TimetableSlot[] = [];

  type Task = {
    reqId: string;
    sectionId: string;
    teacherId: string;
    subject: string;
  };

  const tasks: Task[] = [];
  requirements.forEach((req) => {
    for (let i = 0; i < req.periodsPerWeek; i++) {
      tasks.push({
        reqId: req.id,
        sectionId: req.sectionId,
        teacherId: req.teacherId,
        subject: req.subject,
      });
    }
  });

  tasks.sort((a, b) => {
    const countA = tasks.filter(t => t.teacherId === a.teacherId).length;
    const countB = tasks.filter(t => t.teacherId === b.teacherId).length;
    return countB - countA;
  });

  const isTeacherBusy = (teacherId: string, day: Day, period: number) =>
    schedule.some(s => s.teacherId === teacherId && s.day === day && s.period === period);

  const isSectionBusy = (sectionId: string, day: Day, period: number) =>
    schedule.some(s => s.sectionId === sectionId && s.day === day && s.period === period);

  const maxClassesPerDay = 2;
  const sectionSubjectCountOnDay = (sectionId: string, subject: string, day: Day) =>
    schedule.filter(s => s.sectionId === sectionId && s.subject === subject && s.day === day).length;

  function backtrack(taskIndex: number): boolean {
    if (taskIndex >= tasks.length) return true;

    const currentTask = tasks[taskIndex];

    for (const day of DAYS) {
      for (const period of PERIODS) {
        if (isTeacherBusy(currentTask.teacherId, day, period)) continue;
        if (isSectionBusy(currentTask.sectionId, day, period)) continue;

        if (sectionSubjectCountOnDay(currentTask.sectionId, currentTask.subject, day) >= maxClassesPerDay) {
          continue;
        }

        const slot: TimetableSlot = {
          day,
          period,
          sectionId: currentTask.sectionId,
          teacherId: currentTask.teacherId,
          subject: currentTask.subject,
        };
        schedule.push(slot);

        if (backtrack(taskIndex + 1)) return true;

        schedule.pop();
      }
    }

    return false;
  }

  const success = backtrack(0);
  return {
    success,
    schedule,
    errors: success ? [] : ["Could not resolve all constraints. Too many hours assigned for available slots."]
  };
}
