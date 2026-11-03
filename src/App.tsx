import React, { useState } from "react";
import { 
  Calendar, Clock, UserCheck, DoorOpen, School, 
  Sparkles, CheckCircle2, AlertCircle, FileSpreadsheet, 
  Download, Trash2, Settings, Plus, RotateCcw 
} from "lucide-react";

type Day = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
const DAYS: Day[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

interface Teacher {
  id: string;
  name: string;
  subject: string;
  maxWeeklyHours: number;
}

interface Room {
  id: string;
  name: string;
  isLab: boolean;
}

interface Section {
  id: string;
  name: string;
}

interface Requirement {
  id: string;
  sectionId: string;
  teacherId: string;
  roomId: string;
  subject: string;
  periodsPerWeek: number;
  isLab: boolean;
}

interface TimetableSlot {
  day: Day;
  periodIndex: number;
  sectionId: string;
  teacherId: string;
  roomId: string;
  subject: string;
  isLab: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"config" | "timetable">("config");

  // Dynamic College Timings
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("16:00");
  const [periodDuration, setPeriodDuration] = useState(60);
  const [lunchAfterPeriod, setLunchAfterPeriod] = useState(3);

  // States
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Form Inputs
  const [secName, setSecName] = useState("");
  const [tName, setTName] = useState("");
  const [tSub, setTSub] = useState("");
  const [tMax, setTMax] = useState(14);

  const [rName, setRName] = useState("");
  const [rIsLab, setRIsLab] = useState(false);

  const [allocSub, setAllocSub] = useState("");
  const [allocTeacher, setAllocTeacher] = useState("");
  const [allocSection, setAllocSection] = useState("");
  const [allocRoom, setAllocRoom] = useState("");
  const [allocHrs, setAllocHrs] = useState(3);
  const [allocIsLab, setAllocIsLab] = useState(false);

  const [schedule, setSchedule] = useState<TimetableSlot[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);

  // Dynamic Period Calculation
  const getPeriodsList = () => {
    const list: string[] = [];
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let curr = startH * 60 + startM;
    const finish = endH * 60 + endM;

    let pIdx = 1;
    while (curr + periodDuration <= finish) {
      const h1 = Math.floor(curr / 60).toString().padStart(2, "0");
      const m1 = (curr % 60).toString().padStart(2, "0");
      curr += periodDuration;
      const h2 = Math.floor(curr / 60).toString().padStart(2, "0");
      const m2 = (curr % 60).toString().padStart(2, "0");
      list.push(`${h1}:${m1} - ${h2}:${m2}`);
      if (pIdx === lunchAfterPeriod) {
        curr += 45;
      }
      pIdx++;
    }
    return list;
  };

  const periodLabels = getPeriodsList();

  // Clear Handlers
  const clearAllData = () => {
    if (window.confirm("Kya sach me sara data reset karna hai?")) {
      setSections([]);
      setTeachers([]);
      setRooms([]);
      setRequirements([]);
      setSchedule([]);
      setSelectedSection("");
      setStatus("Sara data clear kar diya gaya!");
    }
  };

  const clearAllocations = () => {
    setRequirements([]);
    setSchedule([]);
    setStatus("Sare subject allocations clear kar diye gaye!");
  };

  // Add Section
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName.trim()) return;
    const newSec = { id: "sec-" + Date.now(), name: secName.trim() };
    setSections([...sections, newSec]);
    if (!selectedSection) setSelectedSection(newSec.id);
    if (!allocSection) setAllocSection(newSec.id);
    setSecName("");
  };

  // Add Teacher
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;
    const newT = { id: "t-" + Date.now(), name: tName.trim(), subject: tSub.trim() || "General", maxWeeklyHours: Number(tMax) };
    setTeachers([...teachers, newT]);
    if (!allocTeacher) setAllocTeacher(newT.id);
    setTName("");
    setTSub("");
  };

  // Add Room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim()) return;
    const newR = { id: "r-" + Date.now(), name: rName.trim(), isLab: rIsLab };
    setRooms([...rooms, newR]);
    if (!allocRoom) setAllocRoom(newR.id);
    setRName("");
    setRIsLab(false);
  };

  // Add Allocation
  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocSub.trim() || !allocSection || !allocTeacher || !allocRoom) {
      alert("Pehle Section, Teacher, aur Room add karein!");
      return;
    }
    setRequirements([
      ...requirements,
      {
        id: "req-" + Date.now(),
        sectionId: allocSection,
        teacherId: allocTeacher,
        roomId: allocRoom,
        subject: allocSub.trim(),
        periodsPerWeek: Number(allocHrs),
        isLab: allocIsLab
      }
    ]);
    setAllocSub("");
  };

  // Constraint Engine
  const handleSolve = () => {
    if (requirements.length === 0) {
      setStatus("Error: Pehle Subject Allocations add karein!");
      return;
    }

    const newSchedule: TimetableSlot[] = [];
    type Task = { 
      sectionId: string; 
      teacherId: string; 
      roomId: string; 
      subject: string; 
      isLab: boolean; 
      span: number 
    };
    const tasks: Task[] = [];

    requirements.forEach(req => {
      if (req.isLab) {
        const pairs = Math.ceil(req.periodsPerWeek / 2);
        for (let i = 0; i < pairs; i++) {
          tasks.push({ sectionId: req.sectionId, teacherId: req.teacherId, roomId: req.roomId, subject: req.subject, isLab: true, span: 2 });
        }
      } else {
        for (let i = 0; i < req.periodsPerWeek; i++) {
          tasks.push({ sectionId: req.sectionId, teacherId: req.teacherId, roomId: req.roomId, subject: req.subject, isLab: false, span: 1 });
        }
      }
    });

    tasks.sort((a, b) => (a.isLab ? -1 : 1));

    const isTeacherBusy = (tId: string, d: Day, p: number) => newSchedule.some(s => s.teacherId === tId && s.day === d && s.periodIndex === p);
    const isSectionBusy = (sId: string, d: Day, p: number) => newSchedule.some(s => s.sectionId === sId && s.day === d && s.periodIndex === p);
    const isRoomBusy = (rId: string, d: Day, p: number) => newSchedule.some(s => s.roomId === rId && s.day === d && s.periodIndex === p);

    function backtrack(idx: number): boolean {
      if (idx >= tasks.length) return true;
      const task = tasks[idx];

      for (const d of DAYS) {
        for (let p = 0; p < periodLabels.length; p++) {
          if (task.span === 2) {
            if (p === periodLabels.length - 1 || p === lunchAfterPeriod - 1) continue;
            const pNext = p + 1;
            if (
              isTeacherBusy(task.teacherId, d, p) || isTeacherBusy(task.teacherId, d, pNext) ||
              isSectionBusy(task.sectionId, d, p) || isSectionBusy(task.sectionId, d, pNext) ||
              isRoomBusy(task.roomId, d, p) || isRoomBusy(task.roomId, d, pNext)
            ) continue;

            newSchedule.push(
              { day: d, periodIndex: p, sectionId: task.sectionId, teacherId: task.teacherId, roomId: task.roomId, subject: task.subject, isLab: true },
              { day: d, periodIndex: pNext, sectionId: task.sectionId, teacherId: task.teacherId, roomId: task.roomId, subject: task.subject, isLab: true }
            );
            if (backtrack(idx + 1)) return true;
            newSchedule.pop();
            newSchedule.pop();
          } else {
            if (isTeacherBusy(task.teacherId, d, p) || isSectionBusy(task.sectionId, d, p) || isRoomBusy(task.roomId, d, p)) continue;
            newSchedule.push({ day: d, periodIndex: p, sectionId: task.sectionId, teacherId: task.teacherId, roomId: task.roomId, subject: task.subject, isLab: false });
            if (backtrack(idx + 1)) return true;
            newSchedule.pop();
          }
        }
      }
      return false;
    }

    if (backtrack(0)) {
      setSchedule(newSchedule);
      setStatus("Zero-Clash Schedule Generated Successfully!");
      setActiveTab("timetable");
    } else {
      setStatus("Infeasible: Slots kam hain ya teacher/room clash ho raha hai.");
    }
  };

  const exportCSV = () => {
    if (schedule.length === 0) return alert("Pehle timetable generate karein!");
    const secObj = sections.find(s => s.id === selectedSection);
    const secName = secObj ? secObj.name : "Timetable";
    let csv = `Timetable for ${secName}\nSlot,` + DAYS.join(",") + "\n";
    periodLabels.forEach((label, p) => {
      const row = [label];
      DAYS.forEach(d => {
        const item = schedule.find(s => s.sectionId === selectedSection && s.day === d && s.periodIndex === p);
        if (item) {
          const t = teachers.find(x => x.id === item.teacherId)?.name || "";
          const r = rooms.find(x => x.id === item.roomId)?.name || "";
          row.push(`"${item.subject} (${t} - ${r})"`);
        } else {
          row.push("Free");
        }
      });
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${secName}_Timetable.csv`;
    link.click();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#818cf8", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <Calendar size={26} /> College Timetable Studio
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>Custom Data Entry & Constraint Solver</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={clearAllData}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ef444466", backgroundColor: "#ef444422", color: "#fca5a5", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
            title="Reset Everything"
          >
            <RotateCcw size={15} /> Clear All Data
          </button>
          <button 
            onClick={() => setActiveTab("config")}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: activeTab === "config" ? "#4f46e5" : "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <Settings size={16} /> 1. Configuration Wizard
          </button>
          <button 
            onClick={() => setActiveTab("timetable")}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: activeTab === "timetable" ? "#4f46e5" : "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <Calendar size={16} /> 2. Timetable Grid
          </button>
          <button 
            onClick={handleSolve}
            style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(to right, #6366f1, #9333ea)", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <Sparkles size={16} /> Solve & Generate
          </button>
        </div>
      </header>

      {status && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", border: status.includes("Successfully") ? "1px solid #10b981" : "1px solid #f43f5e", backgroundColor: status.includes("Successfully") ? "#064e3b40" : "#88133740", color: status.includes("Successfully") ? "#6ee7b7" : "#fda4af", fontSize: "13px" }}>
          {status.includes("Successfully") ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {status}
        </div>
      )}

      {activeTab === "config" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Shift / Timings */}
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
            <h3 style={{ fontSize: "15px", color: "#e2e8f0", marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#818cf8" /> Timing & Shift Setup
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>College Start</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%", padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>College End</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%", padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Period Duration (Mins)</label>
                <input type="number" value={periodDuration} onChange={e => setPeriodDuration(Number(e.target.value))} style={{ width: "100%", padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Lunch After Period #</label>
                <input type="number" min="1" max="6" value={lunchAfterPeriod} onChange={e => setLunchAfterPeriod(Number(e.target.value))} style={{ width: "100%", padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginTop: "14px", padding: "10px", backgroundColor: "#1e293b66", borderRadius: "8px", fontSize: "12px", color: "#a5b4fc" }}>
              Total generated slots: <b>{periodLabels.length}</b> ({periodLabels.join(" • ")})
            </div>
          </div>

          {/* Add Sections */}
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", color: "#e2e8f0", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <School size={18} color="#818cf8" /> Classes / Sections ({sections.length})
              </h3>
              {sections.length > 0 && (
                <button onClick={() => setSections([])} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>Clear Sections</button>
              )}
            </div>
            <form onSubmit={handleAddSection} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input type="text" placeholder="e.g. CSE-3A, ECE-2B" value={secName} onChange={e => setSecName(e.target.value)} style={{ flex: 1, padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required />
              <button type="submit" style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Add</button>
            </form>
            <div style={{ marginTop: "12px", maxHeight: "110px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {sections.length === 0 ? <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Koi section nahi hai.</p> : sections.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#1e293b99", borderRadius: "6px", fontSize: "12px" }}>
                  <span><b>{s.name}</b></span>
                  <button onClick={() => setSections(sections.filter(x => x.id !== s.id))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Teachers */}
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", color: "#e2e8f0", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserCheck size={18} color="#818cf8" /> Faculty Registration ({teachers.length})
              </h3>
              {teachers.length > 0 && (
                <button onClick={() => setTeachers([])} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>Clear Faculty</button>
              )}
            </div>
            <form onSubmit={handleAddTeacher} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr auto", gap: "8px", marginTop: "12px" }}>
              <input type="text" placeholder="Teacher Name" value={tName} onChange={e => setTName(e.target.value)} style={{ padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required />
              <input type="text" placeholder="Subject" value={tSub} onChange={e => setTSub(e.target.value)} style={{ padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} />
              <input type="number" placeholder="Max/Wk" value={tMax} onChange={e => setTMax(Number(e.target.value))} style={{ padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} />
              <button type="submit" style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Add</button>
            </form>
            <div style={{ marginTop: "12px", maxHeight: "110px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {teachers.length === 0 ? <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Koi teacher nahi hai.</p> : teachers.map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#1e293b99", borderRadius: "6px", fontSize: "12px" }}>
                  <span><b>{t.name}</b> ({t.subject})</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#94a3b8" }}>Max: {t.maxWeeklyHours}h/wk</span>
                    <button onClick={() => setTeachers(teachers.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Rooms */}
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", color: "#e2e8f0", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <DoorOpen size={18} color="#818cf8" /> Classrooms & Labs ({rooms.length})
              </h3>
              {rooms.length > 0 && (
                <button onClick={() => setRooms([])} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>Clear Rooms</button>
              )}
            </div>
            <form onSubmit={handleAddRoom} style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
              <input type="text" placeholder="Room/Lab Name" value={rName} onChange={e => setRName(e.target.value)} style={{ flex: 1, padding: "7px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required />
              <label style={{ fontSize: "12px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "4px" }}>
                <input type="checkbox" checked={rIsLab} onChange={e => setRIsLab(e.target.checked)} /> Lab?
              </label>
              <button type="submit" style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Add</button>
            </form>
            <div style={{ marginTop: "12px", maxHeight: "110px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {rooms.length === 0 ? <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Koi room nahi hai.</p> : rooms.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "#1e293b99", borderRadius: "6px", fontSize: "12px" }}>
                  <span><b>{r.name}</b> <span style={{ color: r.isLab ? "#f472b6" : "#38bdf8", fontSize: "11px" }}>({r.isLab ? "Lab" : "Lecture Hall"})</span></span>
                  <button onClick={() => setRooms(rooms.filter(x => x.id !== r.id))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Subject */}
          <div style={{ gridColumn: "span 2", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", color: "#e2e8f0", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} color="#818cf8" /> Subject Allocation ({requirements.length})
              </h3>
              {requirements.length > 0 && (
                <button onClick={clearAllocations} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>Clear All Allocations</button>
              )}
            </div>
            <form onSubmit={handleAddAllocation} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                <input type="text" placeholder="Subject Name (e.g. Maths)" value={allocSub} onChange={e => setAllocSub(e.target.value)} style={{ padding: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required />
                <select value={allocSection} onChange={e => setAllocSection(e.target.value)} style={{ padding: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required>
                  <option value="">-- Choose Section --</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={allocTeacher} onChange={e => setAllocTeacher(e.target.value)} style={{ padding: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required>
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr auto auto", gap: "10px", alignItems: "center" }}>
                <select value={allocRoom} onChange={e => setAllocRoom(e.target.value)} style={{ padding: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} required>
                  <option value="">-- Choose Room/Lab --</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input type="number" min="1" max="8" value={allocHrs} onChange={e => setAllocHrs(Number(e.target.value))} placeholder="Weekly Classes" style={{ padding: "8px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }} />
                <label style={{ fontSize: "12px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="checkbox" checked={allocIsLab} onChange={e => setAllocIsLab(e.target.checked)} /> 2-Slot Continuous Lab?
                </label>
                <button type="submit" style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Assign Class</button>
              </div>
            </form>

            <div style={{ marginTop: "14px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {requirements.length === 0 ? <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Koi subject allocation nahi hai.</p> : requirements.map(req => (
                <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#1e293b99", borderRadius: "6px", fontSize: "12px" }}>
                  <span><b>{req.subject}</b> • {teachers.find(t=>t.id===req.teacherId)?.name} • {rooms.find(r=>r.id===req.roomId)?.name} ({sections.find(s=>s.id===req.sectionId)?.name}) - {req.periodsPerWeek}h/wk {req.isLab && "[LAB]"}</span>
                  <button onClick={() => setRequirements(requirements.filter(x => x.id !== req.id))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "timetable" && (
        <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Select Section:</span>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} style={{ padding: "6px 12px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "6px", fontSize: "13px" }}>
                {sections.length === 0 && <option value="">-- No Sections Added --</option>}
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                <FileSpreadsheet size={15} color="#34d399" /> Export Excel
              </button>
              <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                <Download size={15} color="#38bdf8" /> Print / PDF
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px", border: "1px solid #1e293b", backgroundColor: "#1e293b66", color: "#94a3b8", fontSize: "12px", width: "140px" }}>Time Slot</th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: "10px", border: "1px solid #1e293b", backgroundColor: "#1e293b66", color: "#f1f5f9", fontSize: "13px" }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodLabels.map((label, p) => (
                <tr key={p}>
                  <td style={{ padding: "10px", border: "1px solid #1e293b", backgroundColor: "#1e293b33", fontSize: "11px", color: "#94a3b8", textAlign: "center", fontFamily: "monospace" }}>
                    {label}
                    {p === lunchAfterPeriod - 1 && <div style={{ color: "#fbbf24", fontSize: "10px", marginTop: "2px" }}>(Lunch Follows)</div>}
                  </td>
                  {DAYS.map(d => {
                    const item = schedule.find(s => s.sectionId === selectedSection && s.day === d && s.periodIndex === p);
                    return (
                      <td key={d} style={{ padding: "6px", border: "1px solid #1e293b", height: "72px", width: "140px", verticalAlign: "top" }}>
                        {item ? (
                          <div style={{ height: "100%", backgroundColor: item.isLab ? "#8318434d" : "#1e1b4b99", border: item.isLab ? "1px solid #be185d80" : "1px solid #6366f166", borderRadius: "6px", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
                            <span style={{ fontWeight: 600, fontSize: "12px", color: item.isLab ? "#fbcfe8" : "#c7d2fe" }}>{item.subject}</span>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
                              <span>{teachers.find(t=>t.id===item.teacherId)?.name}</span>
                              <span style={{ color: "#38bdf8", fontWeight: 600 }}>{rooms.find(r=>r.id===item.roomId)?.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: "100%", borderRadius: "6px", border: "1px dashed #1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#475569" }}>
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
