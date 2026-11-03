import React, { useState, useMemo } from "react";
import { 
  Calendar, Clock, UserCheck, DoorOpen, School, 
  Sparkles, CheckCircle2, AlertCircle, FileSpreadsheet, 
  Trash2, Settings, Plus, RotateCcw, Mic
} from "lucide-react";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
const ALL_DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface BreakDefinition {
  id: string;
  name: string;
  startMinute: number;
  endMinute: number;
  appliesToDays: DayOfWeek[];
}

interface PeriodSlot {
  id: string;
  day: DayOfWeek;
  periodIndex: number;
  startMinute: number;
  endMinute: number;
  label: string;
}

interface Section {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  isLab: boolean;
}

interface CourseOffering {
  id: string;
  subjectName: string;
  sectionId: string;
  teacherId: string;
  roomId: string;
  periodsPerWeek: number;
  maxPeriodsPerDay: number;
  isLab: boolean;
}

interface TimetableEntry {
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
}

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

function VoiceInputButton({ onSpeech }: { onSpeech: (text: string) => void }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aapka browser Speech Recognition support nahi karta. Chrome ya Edge use karein.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) onSpeech(transcript.trim());
    };

    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={startListening}
      style={{
        backgroundColor: listening ? "#ff6347" : "#1e2235",
        border: listening ? "1px solid #ff4500" : "1px solid #2e334d",
        color: listening ? "#ffffff" : "#c4b5fd",
        padding: "8px 11px",
        borderRadius: "8px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: listening ? "0 0 12px rgba(255, 99, 71, 0.6)" : "none",
        transition: "all 0.2s ease"
      }}
      title={listening ? "Listening... Bolna shuru karein" : "Bolkar type karein"}
    >
      <Mic size={16} />
    </button>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"config" | "timetable">("config");

  const [startTime, setStartTime] = useState("09:10");
  const [endTime, setEndTime] = useState("17:10");
  const [periodDuration, setPeriodDuration] = useState(60);
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
  const [breaks, setBreaks] = useState<BreakDefinition[]>([
    {
      id: "b_lunch",
      name: "Lunch Break",
      startMinute: timeToMins("13:10"),
      endMinute: timeToMins("14:10"),
      appliesToDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    }
  ]);

  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);

  const [newSecName, setNewSecName] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomIsLab, setNewRoomIsLab] = useState(false);

  const [bName, setBName] = useState("");
  const [bStart, setBStart] = useState("13:10");
  const [bEnd, setBEnd] = useState("14:10");

  const [subName, setSubName] = useState("");
  const [selectedSec, setSelectedSec] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [allocWeekPeriods, setAllocWeekPeriods] = useState(5);
  const [allocDayPeriods, setAllocDayPeriods] = useState(1);
  const [allocIsLab, setAllocIsLab] = useState(false);

  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);
  const [viewSecId, setViewSecId] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const daySlotsMap = useMemo(() => {
    const map = new Map<DayOfWeek, PeriodSlot[]>();
    const startM = timeToMins(startTime);
    const endM = timeToMins(endTime);

    for (const day of workingDays) {
      const activeBreaks = breaks.filter(b => b.appliesToDays.includes(day));
      const slots: PeriodSlot[] = [];
      let cur = startM;
      let pIdx = 0;

      while (cur + periodDuration <= endM) {
        const slotEnd = cur + periodDuration;
        const brk = activeBreaks.find(b => Math.max(cur, b.startMinute) < Math.min(slotEnd, b.endMinute));

        if (brk) {
          cur = brk.endMinute;
          continue;
        }

        slots.push({
          id: `${day}_p${pIdx}`,
          day,
          periodIndex: pIdx,
          startMinute: cur,
          endMinute: slotEnd,
          label: `${minsToTime(cur)} - ${minsToTime(slotEnd)}`
        });

        cur = slotEnd;
        pIdx++;
      }
      map.set(day, slots);
    }
    return map;
  }, [startTime, endTime, periodDuration, workingDays, breaks]);

  const slotsPerDay = daySlotsMap.get(workingDays[0])?.length || 0;
  const totalSlotsPerSection = slotsPerDay * workingDays.length;

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName.trim()) return;
    const sec: Section = { id: `sec_${Date.now()}`, name: newSecName.trim() };
    const updated = [...sections, sec];
    setSections(updated);
    if (!selectedSec) setSelectedSec(sec.id);
    if (!viewSecId) setViewSecId(sec.id);
    setNewSecName("");
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    const t: Teacher = { id: `t_${Date.now()}`, name: newTeacherName.trim() };
    const updated = [...teachers, t];
    setTeachers(updated);
    if (!selectedTeacher) setSelectedTeacher(t.id);
    setNewTeacherName("");
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const r: Room = { id: `r_${Date.now()}`, name: newRoomName.trim(), isLab: newRoomIsLab };
    const updated = [...rooms, r];
    setRooms(updated);
    if (!selectedRoom) setSelectedRoom(r.id);
    setNewRoomName("");
    setNewRoomIsLab(false);
  };

  const handleAddBreak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) return;
    const s = timeToMins(bStart);
    const en = timeToMins(bEnd);
    if (en <= s) return alert("Break end time must be after start time!");
    setBreaks([
      ...breaks,
      {
        id: `brk_${Date.now()}`,
        name: bName.trim(),
        startMinute: s,
        endMinute: en,
        appliesToDays: workingDays
      }
    ]);
    setBName("");
  };

  const handleAddOffering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    if (!selectedSec || !selectedTeacher || !selectedRoom) {
      return alert("Pehle Section, Teacher aur Room select karein!");
    }

    setOfferings([
      ...offerings,
      {
        id: `off_${Date.now()}`,
        subjectName: subName.trim(),
        sectionId: selectedSec,
        teacherId: selectedTeacher,
        roomId: selectedRoom,
        periodsPerWeek: Number(allocWeekPeriods),
        maxPeriodsPerDay: Number(allocDayPeriods),
        isLab: allocIsLab
      }
    ]);
    setSubName("");
  };

  const handleSolve = () => {
    if (offerings.length === 0) {
      setStatus("Error: Pehle Course Requirements add karein!");
      return;
    }

    for (const sec of sections) {
      const secTotal = offerings.filter(o => o.sectionId === sec.id).reduce((sum, o) => sum + o.periodsPerWeek, 0);
      if (secTotal > totalSlotsPerSection) {
        setStatus(`Error: Section "${sec.name}" ko ${secTotal} periods diye gaye hain, jabki capacity sirf ${totalSlotsPerSection} periods hai.`);
        return;
      }
    }

    type Task = {
      offeringId: string;
      subjectName: string;
      sectionId: string;
      teacherId: string;
      roomId: string;
      maxPerDay: number;
      isLab: boolean;
    };

    const tasks: Task[] = [];
    offerings.forEach(off => {
      for (let i = 0; i < off.periodsPerWeek; i++) {
        tasks.push({
          offeringId: off.id,
          subjectName: off.subjectName,
          sectionId: off.sectionId,
          teacherId: off.teacherId,
          roomId: off.roomId,
          maxPerDay: off.maxPeriodsPerDay,
          isLab: off.isLab
        });
      }
    });

    const solution: TimetableEntry[] = [];

    const isCollision = (secId: string, tId: string, rId: string, d: DayOfWeek, p: number) => {
      return solution.some(s => s.day === d && s.periodIndex === p && (s.sectionId === secId || s.teacherId === tId || s.roomId === rId));
    };

    const countOnDay = (offId: string, d: DayOfWeek) => {
      return solution.filter(s => s.offeringId === offId && s.day === d).length;
    };

    function backtrack(idx: number): boolean {
      if (idx >= tasks.length) return true;
      const task = tasks[idx];

      for (const day of workingDays) {
        if (countOnDay(task.offeringId, day) >= task.maxPerDay) continue;

        const slots = daySlotsMap.get(day) || [];
        for (let p = 0; p < slots.length; p++) {
          if (isCollision(task.sectionId, task.teacherId, task.roomId, day, p)) continue;

          const slot = slots[p];
          solution.push({
            id: `${task.offeringId}_${day}_${p}`,
            offeringId: task.offeringId,
            sectionId: task.sectionId,
            teacherId: task.teacherId,
            roomId: task.roomId,
            subjectName: task.subjectName,
            day,
            periodIndex: p,
            startMinute: slot.startMinute,
            endMinute: slot.endMinute,
            isLab: task.isLab
          });

          if (backtrack(idx + 1)) return true;
          solution.pop();
        }
      }
      return false;
    }

    if (backtrack(0)) {
      setSchedule(solution);
      setStatus(`Optimal Schedule: ${solution.length} periods generated with zero clashes!`);
      setActiveTab("timetable");
    } else {
      setStatus("Error: Infeasible configuration. Check teacher/room overlaps.");
    }
  };

  const handleExportCSV = () => {
    const sec = sections.find(s => s.id === viewSecId);
    if (!sec || schedule.length === 0) return alert("Pehle timetable generate karein!");

    const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
    const roomMap = new Map(rooms.map(r => [r.id, r.name]));

    let csv = `Timetable for Section: ${sec.name}\nSlot,` + workingDays.join(",") + "\n";
    for (let p = 0; p < slotsPerDay; p++) {
      const slot = (daySlotsMap.get(workingDays[0]) || [])[p];
      const activeLunch = breaks.find(b => b.name.toLowerCase().includes("lunch"));
      if (activeLunch && slot && slot.startMinute === activeLunch.endMinute) {
        csv += `"${minsToTime(activeLunch.startMinute)} - ${minsToTime(activeLunch.endMinute)} (LUNCH BREAK)",` + workingDays.map(() => "LUNCH BREAK").join(",") + "\n";
      }

      const row = [`Period ${p + 1} (${slot ? slot.label : ""})`];
      for (const d of workingDays) {
        const item = schedule.find(s => s.sectionId === sec.id && s.day === d && s.periodIndex === p);
        if (item) {
          row.push(`"${item.subjectName} (${teacherMap.get(item.teacherId) || ""} - ${roomMap.get(item.roomId) || ""})"`);
        } else {
          row.push("Free");
        }
      }
      csv += row.join(",") + "\n";
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sec.name}_Timetable.csv`;
    link.click();
  };

  const resetAll = () => {
    if (window.confirm("Sara user data clear karein?")) {
      setSections([]);
      setTeachers([]);
      setRooms([]);
      setOfferings([]);
      setSchedule([]);
      setViewSecId("");
      setSelectedSec("");
      setSelectedTeacher("");
      setSelectedRoom("");
      setStatus(null);
    }
  };

  return (
    <div className="studio-container" style={{ minHeight: "100vh", backgroundColor: "#090a10", color: "#f8fafc", padding: "16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .full-span { grid-column: span 2; }
        .alloc-form-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr auto auto auto; gap: 8px; align-items: center; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .responsive-table-container { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

        @media (max-width: 900px) {
          .studio-container { padding: 12px !important; }
          .grid-layout { grid-template-columns: 1fr !important; }
          .full-span { grid-column: span 1 !important; }
          .alloc-form-grid { grid-template-columns: 1fr !important; }
          .alloc-form-grid > * { width: 100% !important; }
          .header-main { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
          .header-actions { width: 100% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .header-actions button:last-child { grid-column: span 2 !important; padding: 12px !important; font-size: 14px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="header-main" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2338", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#c4b5fd", display: "flex", alignItems: "center", gap: "8px", margin: 0, letterSpacing: "-0.5px" }}>
            <Calendar size={24} color="#bef264" /> Universal Academic Timetable Studio
          </h1>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>
            Mobile Ready • Voice Inputs • <span style={{ color: "#bef264" }}>Chartreuse</span> + <span style={{ color: "#ff6347" }}>Tomato Red</span>
          </p>
        </div>

        <div className="header-actions">
          <button 
            onClick={resetAll}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255, 99, 71, 0.4)", backgroundColor: "rgba(255, 99, 71, 0.12)", color: "#ff6347", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}
          >
            <RotateCcw size={14} /> Clear
          </button>
          <button 
            onClick={() => setActiveTab("config")}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #272a40", backgroundColor: activeTab === "config" ? "#c4b5fd" : "#141724", color: activeTab === "config" ? "#090a10" : "#c4b5fd", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}
          >
            <Settings size={15} /> 1. Config
          </button>
          <button 
            onClick={() => setActiveTab("timetable")}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #272a40", backgroundColor: activeTab === "timetable" ? "#c4b5fd" : "#141724", color: activeTab === "timetable" ? "#090a10" : "#c4b5fd", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}
          >
            <Calendar size={15} /> 2. Timetable
          </button>
          <button 
            onClick={handleSolve}
            style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "#bef264", color: "#090a10", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", boxShadow: "0 4px 14px rgba(190, 242, 100, 0.35)" }}
          >
            <Sparkles size={16} color="#090a10" /> Run Solver & Verify
          </button>
        </div>
      </header>

      {/* Status Banner */}
      {status && (
        <div style={{
          marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px",
          border: status.includes("Optimal") || status.includes("Success") ? "1px solid #bef264" : "1px solid #ff6347",
          backgroundColor: status.includes("Optimal") || status.includes("Success") ? "rgba(190, 242, 100, 0.12)" : "rgba(255, 99, 71, 0.15)",
          color: status.includes("Optimal") || status.includes("Success") ? "#bef264" : "#ff6347", fontSize: "12px", fontWeight: 600
        }}>
          {status.includes("Optimal") || status.includes("Success") ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{status}</span>
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid-layout">
          
          {/* Shift & Timing */}
          <div style={{ backgroundColor: "#141724", border: "1px solid #23273c", borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ fontSize: "15px", color: "#c4b5fd", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={17} color="#bef264" /> Shift & Timing Setup
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8" }}>Shift Start</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%", padding: "7px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8" }}>Shift End</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%", padding: "7px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8" }}>Period Duration (Mins)</label>
                <input type="number" min="15" value={periodDuration} onChange={e => setPeriodDuration(Number(e.target.value))} style={{ width: "100%", padding: "7px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#94a3b8" }}>Working Days</label>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "3px" }}>
                  {ALL_DAYS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const next = workingDays.includes(d) ? workingDays.filter(x => x !== d) : [...workingDays, d];
                        if (next.length > 0) setWorkingDays(next);
                      }}
                      style={{
                        padding: "3px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                        backgroundColor: workingDays.includes(d) ? "#c4b5fd" : "#0c0e17",
                        color: workingDays.includes(d) ? "#090a10" : "#94a3b8",
                        border: "1px solid #2c324e"
                      }}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", borderTop: "1px solid #23273c", paddingTop: "12px" }}>
              <h4 style={{ fontSize: "12px", color: "#e2e8f0", margin: "0 0 8px 0" }}>Breaks (Tea / Lunch)</h4>
              <form onSubmit={handleAddBreak} style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                <input type="text" placeholder="Break Name" value={bName} onChange={e => setBName(e.target.value)} style={{ flex: 1, padding: "7px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "11px" }} required />
                <VoiceInputButton onSpeech={text => setBName(text)} />
                <input type="time" value={bStart} onChange={e => setBStart(e.target.value)} style={{ padding: "6px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "11px" }} />
                <input type="time" value={bEnd} onChange={e => setBEnd(e.target.value)} style={{ padding: "6px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "11px" }} />
                <button type="submit" style={{ backgroundColor: "#bef264", color: "#090a10", border: "none", padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "800" }}>+ Add</button>
              </form>
              {breaks.map(b => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "rgba(12, 14, 23, 0.7)", border: "1px solid #23273c", borderRadius: "8px", fontSize: "11px", marginTop: "5px" }}>
                  <span><b style={{ color: "#ff6347" }}>{b.name}</b>: {minsToTime(b.startMinute)} - {minsToTime(b.endMinute)}</span>
                  <button onClick={() => setBreaks(breaks.filter(x => x.id !== b.id))} style={{ background: "none", border: "none", color: "#ff6347", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "rgba(196, 181, 253, 0.08)", border: "1px solid rgba(196, 181, 253, 0.2)", borderRadius: "10px", fontSize: "11px", color: "#c4b5fd" }}>
              Total slots: <b style={{ color: "#bef264" }}>{totalSlotsPerSection} periods/week</b> ({workingDays.length} days × {slotsPerDay}/day)
            </div>
          </div>

          {/* Academic Sections */}
          <div style={{ backgroundColor: "#141724", border: "1px solid #23273c", borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ fontSize: "15px", color: "#c4b5fd", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <School size={17} color="#bef264" /> Academic Sections ({sections.length})
            </h3>
            <form onSubmit={handleAddSection} style={{ display: "flex", gap: "6px", marginTop: "12px", alignItems: "center" }}>
              <input 
                type="text" 
                placeholder="Section (e.g. CSE-3A, AI/ML-1)" 
                value={newSecName} 
                onChange={e => setNewSecName(e.target.value)} 
                style={{ flex: 1, padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} 
                required 
              />
              <VoiceInputButton onSpeech={text => setNewSecName(text)} />
              <button type="submit" style={{ backgroundColor: "#c4b5fd", color: "#090a10", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "11px" }}>+ Add</button>
            </form>
            <div style={{ marginTop: "10px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
              {sections.length === 0 ? <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Koi section nahi hai.</p> : sections.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", backgroundColor: "#0c0e17", border: "1px solid #23273c", borderRadius: "8px", fontSize: "11px" }}>
                  <span><b>{s.name}</b></span>
                  <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} style={{ background: "none", border: "none", color: "#ff6347", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Registration */}
          <div style={{ backgroundColor: "#141724", border: "1px solid #23273c", borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ fontSize: "15px", color: "#c4b5fd", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={17} color="#bef264" /> Faculty Registration ({teachers.length})
            </h3>
            <form onSubmit={handleAddTeacher} style={{ display: "flex", gap: "6px", marginTop: "12px", alignItems: "center" }}>
              <input 
                type="text" 
                placeholder="Teacher Name (e.g. Dr. A. Sharma)" 
                value={newTeacherName} 
                onChange={e => setNewTeacherName(e.target.value)} 
                style={{ flex: 1, padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} 
                required 
              />
              <VoiceInputButton onSpeech={text => setNewTeacherName(text)} />
              <button type="submit" style={{ backgroundColor: "#c4b5fd", color: "#090a10", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "11px" }}>+ Add</button>
            </form>
            <div style={{ marginTop: "10px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
              {teachers.length === 0 ? <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Koi faculty nahi hai.</p> : teachers.map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", backgroundColor: "#0c0e17", border: "1px solid #23273c", borderRadius: "8px", fontSize: "11px" }}>
                  <span><b>{t.name}</b></span>
                  <button onClick={() => setTeachers(teachers.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: "#ff6347", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities & Labs */}
          <div style={{ backgroundColor: "#141724", border: "1px solid #23273c", borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ fontSize: "15px", color: "#c4b5fd", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <DoorOpen size={17} color="#bef264" /> Facilities & Labs ({rooms.length})
            </h3>
            <form onSubmit={handleAddRoom} style={{ display: "flex", gap: "6px", marginTop: "12px", alignItems: "center" }}>
              <input 
                type="text" 
                placeholder="Room Name (e.g. Room 101)" 
                value={newRoomName} 
                onChange={e => setNewRoomName(e.target.value)} 
                style={{ flex: 1, padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} 
                required 
              />
              <VoiceInputButton onSpeech={text => setNewRoomName(text)} />
              <label style={{ fontSize: "11px", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "3px" }}>
                <input type="checkbox" checked={newRoomIsLab} onChange={e => setNewRoomIsLab(e.target.checked)} /> Lab?
              </label>
              <button type="submit" style={{ backgroundColor: "#c4b5fd", color: "#090a10", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "11px" }}>+ Add</button>
            </form>
            <div style={{ marginTop: "10px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
              {rooms.length === 0 ? <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Koi room nahi hai.</p> : rooms.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", backgroundColor: "#0c0e17", border: "1px solid #23273c", borderRadius: "8px", fontSize: "11px" }}>
                  <span><b>{r.name}</b> <span style={{ color: r.isLab ? "#bef264" : "#c4b5fd" }}>({r.isLab ? "Lab" : "Lecture Hall"})</span></span>
                  <button onClick={() => setRooms(rooms.filter(x => x.id !== r.id))} style={{ background: "none", border: "none", color: "#ff6347", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Course Allocation Card */}
          <div className="full-span" style={{ backgroundColor: "#141724", border: "1px solid #23273c", borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ fontSize: "15px", color: "#c4b5fd", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={17} color="#bef264" /> Course Requirements Allocation ({offerings.length})
            </h3>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 12px 0" }}>
              Voice mic se bole ya select karke weekly/daily allocation set karein.
            </p>

            <form onSubmit={handleAddOffering} className="alloc-form-grid">
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input 
                  type="text" 
                  placeholder="Subject (e.g. Mathematics)" 
                  value={subName} 
                  onChange={e => setSubName(e.target.value)} 
                  style={{ flex: 1, padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} 
                  required 
                />
                <VoiceInputButton onSpeech={text => setSubName(text)} />
              </div>
              
              <select value={selectedSec} onChange={e => setSelectedSec(e.target.value)} style={{ padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} required>
                <option value="">-- Section --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{ padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} required>
                <option value="">-- Faculty --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{ padding: "8px 10px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} required>
                <option value="">-- Room --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>Period/Week</span>
                <input 
                  type="number" 
                  min="1" 
                  value={allocWeekPeriods} 
                  onChange={e => setAllocWeekPeriods(Number(e.target.value))} 
                  style={{ width: "100%", padding: "7px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>Max/Day</span>
                <input 
                  type="number" 
                  min="1" 
                  max="4"
                  value={allocDayPeriods} 
                  onChange={e => setAllocDayPeriods(Number(e.target.value))} 
                  style={{ width: "100%", padding: "7px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#f8fafc", borderRadius: "8px", fontSize: "12px" }} 
                />
              </div>

              <button type="submit" style={{ backgroundColor: "#bef264", color: "#090a10", border: "none", padding: "9px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "12px" }}>+ Assign</button>
            </form>

            <div style={{ marginTop: "14px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {offerings.length === 0 ? <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>Koi subject allocation nahi hai.</p> : offerings.map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#0c0e17", border: "1px solid #23273c", borderRadius: "8px", fontSize: "11px" }}>
                  <span><b style={{ color: "#c4b5fd" }}>{o.subjectName}</b> • {sections.find(s=>s.id===o.sectionId)?.name} • {teachers.find(t=>t.id===o.teacherId)?.name} • {rooms.find(r=>r.id===o.roomId)?.name} (<b style={{ color: "#bef264" }}>{o.periodsPerWeek}</b>/week | max <b>{o.maxPeriodsPerDay}</b>/day)</span>
                  <button onClick={() => setOfferings(offerings.filter(x => x.id !== o.id))} style={{ background: "none", border: "none", color: "#ff6347", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timetable Grid View */}
      {activeTab === "timetable" && (
        <div style={{ backgroundColor: "#141724", border: "1px solid #23273c", borderRadius: "14px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Section:</span>
              <select value={viewSecId} onChange={e => setViewSecId(e.target.value)} style={{ padding: "6px 12px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#c4b5fd", fontWeight: 600, borderRadius: "8px", fontSize: "12px" }}>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0c0e17", border: "1px solid #2c324e", color: "#bef264", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>
              <FileSpreadsheet size={14} color="#bef264" /> Export CSV
            </button>
          </div>

          <div className="responsive-table-container">
            <table style={{ width: "100%", minWidth: "650px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px", border: "1px solid #23273c", backgroundColor: "#0c0e17", color: "#94a3b8", fontSize: "11px", width: "130px" }}>Period / Time</th>
                  {workingDays.map(d => (
                    <th key={d} style={{ padding: "10px", border: "1px solid #23273c", backgroundColor: "#0c0e17", color: "#c4b5fd", fontSize: "12px" }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: slotsPerDay }).map((_, pIdx) => {
                  const daySlots = daySlotsMap.get(workingDays[0]) || [];
                  const slot = daySlots[pIdx];

                  const activeLunch = breaks.find(b => b.name.toLowerCase().includes("lunch"));
                  const isLunchBefore = activeLunch && slot && slot.startMinute === activeLunch.endMinute;

                  return (
                    <React.Fragment key={pIdx}>
                      {isLunchBefore && (
                        <tr style={{ backgroundColor: "rgba(255, 99, 71, 0.12)", border: "1px solid rgba(255, 99, 71, 0.4)" }}>
                          <td style={{ padding: "8px", textAlign: "center", fontSize: "11px", color: "#ff6347", fontFamily: "monospace", fontWeight: "bold" }}>
                            {minsToTime(activeLunch.startMinute)} - {minsToTime(activeLunch.endMinute)}
                          </td>
                          <td colSpan={workingDays.length} style={{ padding: "8px", textAlign: "center", fontSize: "11px", color: "#ff6347", fontWeight: "bold", letterSpacing: "1.5px" }}>
                            🍴 LUNCH BREAK (13:10 - 14:10)
                          </td>
                        </tr>
                      )}

                      <tr>
                        <td style={{ padding: "10px", border: "1px solid #23273c", backgroundColor: "#0c0e17", fontSize: "11px", color: "#94a3b8", textAlign: "center", fontFamily: "monospace" }}>
                          <div style={{ color: "#c4b5fd", fontWeight: 700 }}>Period {pIdx + 1}</div>
                          <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>{slot ? slot.label : ""}</div>
                        </td>
                        {workingDays.map(d => {
                          const item = schedule.find(s => s.sectionId === viewSecId && s.day === d && s.periodIndex === pIdx);

                          return (
                            <td key={d} style={{ padding: "5px", border: "1px solid #23273c", height: "70px", width: "130px", verticalAlign: "top" }}>
                              {item ? (
                                <div style={{ 
                                  height: "100%", 
                                  backgroundColor: "rgba(196, 181, 253, 0.08)", 
                                  border: "1px solid rgba(196, 181, 253, 0.3)", 
                                  borderRadius: "8px", 
                                  padding: "6px 7px", 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  justifyContent: "space-between" 
                                }}>
                                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#c4b5fd" }}>{item.subjectName}</span>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#94a3b8" }}>
                                    <span>{teachers.find(t=>t.id===item.teacherId)?.name}</span>
                                    <span style={{ color: "#bef264", fontWeight: 700 }}>{rooms.find(r=>r.id===item.roomId)?.name}</span>
                                  </div>
                                  <span style={{ fontSize: "9px", color: "#64748b", fontFamily: "monospace" }}>{slot?.label}</span>
                                </div>
                              ) : (
                                <div style={{ height: "100%", borderRadius: "8px", border: "1px dashed #23273c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#475569" }}>
                                  <span>Free</span>
                                  <span style={{ fontSize: "8px", color: "#334155", marginTop: "2px" }}>{slot?.label}</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
