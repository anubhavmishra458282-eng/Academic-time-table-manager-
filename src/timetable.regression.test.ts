import { describe, it, expect } from "vitest";
import { 
  TimeService, 
  TimetableBacktrackingSolver, 
  IndependentValidator, 
  InstitutionConfig, 
  Section, 
  Teacher, 
  Room, 
  CourseOffering 
} from "./src/App";

describe("Regression & Unit Integrity Tests", () => {
  const standardConfig: InstitutionConfig = {
    institutionName: "Engineering Campus",
    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    defaultStartTime: "09:10",
    defaultEndTime: "17:10",
    defaultPeriodDuration: 60,
    breaks: [
      {
        id: "lunch",
        name: "Lunch Break",
        startMinute: 13 * 60 + 10, // 13:10
        endMinute: 14 * 60 + 10,   // 14:10
        appliesToDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
      }
    ]
  };

  it("proves the regression: 35 periods per section fits cleanly in 35 available slots", () => {
    // 5 days * 7 periods/day = exactly 35 available slots per section
    const daySlots = TimeService.buildInstitutionSlots(standardConfig);
    const slotsPerSection = standardConfig.workingDays.reduce(
      (acc, d) => acc + (daySlots.get(d)?.length || 0), 0
    );
    expect(slotsPerSection).toBe(35);

    // 4 sections * 35 slots = 140 total available periods
    const sections: Section[] = [
      { id: "s1", name: "AI/ML-1", program: "CSE", academicYear: 3, semester: 5 },
      { id: "s2", name: "AI/ML-2", program: "CSE", academicYear: 3, semester: 5 },
      { id: "s3", name: "AI/ML-3", program: "CSE", academicYear: 3, semester: 5 },
      { id: "s4", name: "AI/ML-4", program: "CSE", academicYear: 3, semester: 5 }
    ];

    const teachers: Teacher[] = [
      { id: "t1", name: "Dr. A. Sharma", maxWeeklyHours: 20, maxDailyHours: 4 },
      { id: "t2", name: "Prof. R. Verma", maxWeeklyHours: 20, maxDailyHours: 4 },
      { id: "t3", name: "Dr. Neha Gupta", maxWeeklyHours: 20, maxDailyHours: 4 },
      { id: "t4", name: "Prof. K. Singh", maxWeeklyHours: 20, maxDailyHours: 4 }
    ];

    const rooms: Room[] = [
      { id: "r1", name: "Room 101", capacity: 60, roomType: "LECTURE_HALL", isLab: false },
      { id: "r2", name: "Room 102", capacity: 60, roomType: "LECTURE_HALL", isLab: false },
      { id: "r3", name: "Room 103", capacity: 60, roomType: "LECTURE_HALL", isLab: false },
      { id: "r4", name: "Room 104", capacity: 60, roomType: "LECTURE_HALL", isLab: false }
    ];

    // Distribute 4 realistic courses per section (each 4 periods/week) = 16 periods/section
    const offerings: CourseOffering[] = [];
    sections.forEach((sec, idx) => {
      offerings.push(
        { id: `c1_${sec.id}`, subjectCode: "M1", subjectName: "Maths", sectionId: sec.id, teacherId: "t1", roomId: rooms[idx].id, weeklyPeriods: 4, isLab: false, consecutivePeriods: 1 },
        { id: `c2_${sec.id}`, subjectCode: "CS1", subjectName: "DSA", sectionId: sec.id, teacherId: "t2", roomId: rooms[idx].id, weeklyPeriods: 4, isLab: false, consecutivePeriods: 1 },
        { id: `c3_${sec.id}`, subjectCode: "CS2", subjectName: "OS", sectionId: sec.id, teacherId: "t3", roomId: rooms[idx].id, weeklyPeriods: 4, isLab: false, consecutivePeriods: 1 },
        { id: `c4_${sec.id}`, subjectCode: "CS3", subjectName: "Networks", sectionId: sec.id, teacherId: "t4", roomId: rooms[idx].id, weeklyPeriods: 4, isLab: false, consecutivePeriods: 1 }
      );
    });

    const res = TimetableBacktrackingSolver.solve(standardConfig, sections, teachers, rooms, offerings, 15000);
    expect(res.success).toBe(true);
    expect(res.diagnostics.status).toBe("OPTIMAL");
    expect(res.entries.length).toBe(64); // 4 sections * 16 periods

    const validation = IndependentValidator.validate(res.entries, offerings, teachers, rooms, sections, standardConfig);
    expect(validation.valid).toBe(true);
  });

  it("correctly identifies true infeasibility when section demand exceeds 35 periods", () => {
    const sections: Section[] = [{ id: "s1", name: "Overloaded Sec", program: "CSE", academicYear: 1, semester: 1 }];
    const teachers: Teacher[] = [{ id: "t1", name: "Prof. X", maxWeeklyHours: 40, maxDailyHours: 8 }];
    const rooms: Room[] = [{ id: "r1", name: "Hall 1", capacity: 60, roomType: "LECTURE_HALL", isLab: false }];

    // Section capacity is 35 periods, but demanding 36 periods
    const offerings: CourseOffering[] = [
      { id: "o1", subjectCode: "X1", subjectName: "Sub 1", sectionId: "s1", teacherId: "t1", roomId: "r1", weeklyPeriods: 36, isLab: false, consecutivePeriods: 1 }
    ];

    const res = TimetableBacktrackingSolver.solve(standardConfig, sections, teachers, rooms, offerings, 5000);
    expect(res.success).toBe(false);
    expect(res.diagnostics.status).toBe("INFEASIBLE");
    expect(res.diagnostics.failureReason).toContain("Demand exceeds capacity for section");
  });

  it("handles 10 academic cohorts without room or teacher collisions", () => {
    const tenSections: Section[] = Array.from({ length: 10 }, (_, i) => ({
      id: `sec_${i}`, name: `Section-${i + 1}`, program: "B.Tech", academicYear: 1, semester: 1
    }));
    const tenRooms: Room[] = Array.from({ length: 10 }, (_, i) => ({
      id: `room_${i}`, name: `Hall-${i + 1}`, capacity: 60, roomType: "LECTURE_HALL", isLab: false
    }));
    const fiveTeachers: Teacher[] = Array.from({ length: 5 }, (_, i) => ({
      id: `t_${i}`, name: `Professor-${i + 1}`, maxWeeklyHours: 24, maxDailyHours: 5
    }));

    // Each section has 2 courses of 3 periods each = 6 periods per section
    const offerings: CourseOffering[] = [];
    tenSections.forEach((sec, idx) => {
      const tA = fiveTeachers[idx % 5];
      const tB = fiveTeachers[(idx + 1) % 5];
      offerings.push(
        { id: `c1_${sec.id}`, subjectCode: "C1", subjectName: "Subject A", sectionId: sec.id, teacherId: tA.id, roomId: tenRooms[idx].id, weeklyPeriods: 3, isLab: false, consecutivePeriods: 1 },
        { id: `c2_${sec.id}`, subjectCode: "C2", subjectName: "Subject B", sectionId: sec.id, teacherId: tB.id, roomId: tenRooms[idx].id, weeklyPeriods: 3, isLab: false, consecutivePeriods: 1 }
      );
    });

    const res = TimetableBacktrackingSolver.solve(standardConfig, tenSections, fiveTeachers, tenRooms, offerings, 15000);
    expect(res.success).toBe(true);
    expect(res.entries.length).toBe(60);

    const check = IndependentValidator.validate(res.entries, offerings, fiveTeachers, tenRooms, tenSections, standardConfig);
    expect(check.valid).toBe(true);
  });
});
