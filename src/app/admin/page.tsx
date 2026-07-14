"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createClient } from "@/lib/supabase";
import {
  createStaffAccount,
  deleteStaffAccount,
  getStaffList,
} from "@/app/actions/staff";
import { sendStudentQrPassEmail } from "../actions/students";

type UserRole = "ADMIN" | "STAFF";
type DashboardView = "overview" | "live";
type Gender = "MALE" | "FEMALE" | "OTHER";
type Department = "ELECTRICAL" | "MECHANICAL" | "CIVIL" | "COMPUTER";

type AttendanceLog = {
  id: string;
  student_id: string;
  check_in_time: string;
  check_out_time: string | null;
  status: "IN" | "OUT";
  students: {
    full_name: string;
    email: string | null;
    gender: Gender | null;
    department: Department | null;
  } | null;
};

type StaffMember = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
};

type StaffFeedback = {
  success: boolean;
  msg: string;
};

const ROOM_CAPACITY = 50;
const MAX_LOGS = 500;

function isSameLocalDay(value: string, date = new Date()) {
  const parsed = new Date(value);
  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth() &&
    parsed.getDate() === date.getDate()
  );
}

function formatTime(value: string | null, includeSeconds = false) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
  });
}

function formatDuration(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "0m";

  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getSessionMinutes(log: AttendanceLog, now: number) {
  const start = new Date(log.check_in_time).getTime();
  const end = log.check_out_time
    ? new Date(log.check_out_time).getTime()
    : now;

  return Math.max(0, (end - start) / 60000);
}

function formatGender(gender: Gender | null | undefined) {
  if (gender === "MALE") return "Male";
  if (gender === "FEMALE") return "Female";
  if (gender === "OTHER") return "Other";
  return "Unspecified";
}

function formatDepartment(department: Department | null | undefined) {
  if (department === "ELECTRICAL") return "Electrical";
  if (department === "MECHANICAL") return "Mechanical";
  if (department === "CIVIL") return "Civil";
  if (department === "COMPUTER") return "Computer";
  return "Unspecified";
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
  | "users"
  | "calendar"
  | "clock"
  | "capacity"
  | "download"
  | "logout"
  | "plus"
  | "close"
  | "activity"
  | "list"
  | "mail";
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  const paths: Record<typeof name, React.ReactNode> = {
    users: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeWidth="1.8" d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 7v5l3 2" />
      </>
    ),
    capacity: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 20V10m5 10V4m5 16v-7m5 7V7" />
      </>
    ),
    download: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v12m0 0l-4-4m4 4l4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
      </>
    ),
    logout: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 17l5-5-5-5M15 12H3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
      </>
    ),
    plus: <path strokeLinecap="round" strokeWidth="2" d="M12 5v14M5 12h14" />,
    close: <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />,
    activity: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12h4l2-7 4 14 2-7h6" />
    ),
    list: (
      <>
        <path strokeLinecap="round" strokeWidth="1.8" d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m4 7 8 6 8-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [view, setView] = useState<DashboardView>("overview");
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [now, setNow] = useState(Date.now());

  const [showQRModal, setShowQRModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentGender, setNewStudentGender] = useState<Gender>("MALE");
  const [newStudentDepartment, setNewStudentDepartment] =
    useState<Department>("ELECTRICAL");
  const [qrSending, setQrSending] = useState(false);
  const [qrFeedback, setQrFeedback] = useState<StaffFeedback | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "STAFF" as UserRole,
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffFeedback, setStaffFeedback] =
    useState<StaffFeedback | null>(null);

  const refreshStaffList = async () => {
    const result = await getStaffList();
    if (result.success) {
      setStaffList((result.data ?? []) as StaffMember[]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchUserAndRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted || !user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!mounted || !profile) return;

      const role = profile.role as UserRole;
      setUserRole(role);

      if (role === "ADMIN") {
        await refreshStaffList();
      }
    };

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select(
          "id, student_id, check_in_time, check_out_time, status, students ( full_name, email, gender, department )",
        )
        .order("check_in_time", { ascending: false })
        .limit(MAX_LOGS);

      if (!mounted) return;

      if (error) {
        console.error(error);
        setErrorMessage("Unable to load attendance data. Please try again.");
      } else {
        setLogs((data ?? []) as unknown as AttendanceLog[]);
        setErrorMessage("");
      }

      setLoading(false);
    };

    void fetchUserAndRole();
    void fetchLogs();

    const channel = supabase
      .channel("admin-dashboard-attendance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        () => void fetchLogs(),
      )
      .subscribe();

    const clock = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => {
      mounted = false;
      window.clearInterval(clock);
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const activeLogs = useMemo(
    () => logs.filter((log) => log.status === "IN" && !log.check_out_time),
    [logs],
  );

  const todayLogs = useMemo(
    () => logs.filter((log) => isSameLocalDay(log.check_in_time)),
    [logs],
  );

  const completedToday = useMemo(
    () => todayLogs.filter((log) => Boolean(log.check_out_time)),
    [todayLogs],
  );

  const averageSessionMinutes = useMemo(() => {
    const source = completedToday.length > 0 ? completedToday : todayLogs;
    if (source.length === 0) return 0;

    return (
      source.reduce((sum, log) => sum + getSessionMinutes(log, now), 0) /
      source.length
    );
  }, [completedToday, now, todayLogs]);

  const occupancyPercent = Math.min(
    100,
    Math.round((activeLogs.length / ROOM_CAPACITY) * 100),
  );

  const hourlyTraffic = useMemo(() => {
    const values = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

    for (const log of todayLogs) {
      values[new Date(log.check_in_time).getHours()].count += 1;
    }

    return values;
  }, [todayLogs]);

  const busiestHourCount = Math.max(1, ...hourlyTraffic.map((item) => item.count));

  const departmentData = useMemo(() => {
    const departments: Department[] = [
      "ELECTRICAL",
      "MECHANICAL",
      "CIVIL",
      "COMPUTER",
    ];

    return departments.map((department) => {
      const count = activeLogs.filter(
        (log) => log.students?.department === department,
      ).length;

      return {
        key: department,
        name: formatDepartment(department),
        count,
        percentage:
          activeLogs.length === 0
            ? 0
            : Math.round((count / activeLogs.length) * 100),
      };
    });
  }, [activeLogs]);

  const genderData = useMemo(() => {
    const genders: Gender[] = ["MALE", "FEMALE", "OTHER"];

    return genders.map((gender) => {
      const count = activeLogs.filter(
        (log) => log.students?.gender === gender,
      ).length;

      return {
        key: gender,
        name: formatGender(gender),
        count,
        percentage:
          activeLogs.length === 0
            ? 0
            : Math.round((count / activeLogs.length) * 100),
      };
    });
  }, [activeLogs]);

  const unspecifiedGenderCount = activeLogs.filter(
    (log) => !log.students?.gender,
  ).length;

  const unspecifiedDepartmentCount = activeLogs.filter(
    (log) => !log.students?.department,
  ).length;

  const lastScan = logs[0] ?? null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;

    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const headers = [
      "Student Name",
      "ID Number",
      "Gender",
      "Department",
      "Status",
      "Check In Time",
      "Check Out Time",
      "Session Duration",
    ];

    const rows = logs.map((log) => [
      escapeCell(log.students?.full_name || "Unknown"),
      escapeCell(log.student_id),
      escapeCell(formatGender(log.students?.gender)),
      escapeCell(formatDepartment(log.students?.department)),
      escapeCell(log.status),
      escapeCell(new Date(log.check_in_time).toLocaleString()),
      escapeCell(
        log.check_out_time
          ? new Date(log.check_out_time).toLocaleString()
          : "Still inside",
      ),
      escapeCell(formatDuration(getSessionMinutes(log, now))),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Library_Attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveStudentProfile = async () => {
    const studentId = newStudentId.trim().toUpperCase();
    const fullName = newStudentName.trim();
    const email = newStudentEmail.trim().toLowerCase();

    if (studentId.length < 4) {
      throw new Error("Enter a valid student ID.");
    }

    if (!fullName) {
      throw new Error("Enter the student's full name.");
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Enter a valid student email address.");
    }

    const { error } = await supabase.from("students").upsert(
      {
        student_id: studentId,
        full_name: fullName,
        email,
        gender: newStudentGender,
        department: newStudentDepartment,
      },
      { onConflict: "student_id" },
    );

    if (error) {
      console.error("Unable to save student profile:", error);
      throw new Error(
        "Unable to save the student. Check the students table columns and Supabase policies.",
      );
    }
  };

  const createStudentPassDataUrl = async () => {
    const qrCanvas = qrCanvasRef.current;
    const studentId = newStudentId.trim().toUpperCase();
    const studentName = newStudentName.trim();

    if (!qrCanvas || studentId.length < 4) {
      throw new Error("Enter a valid student ID before creating the pass.");
    }

    const passCanvas = document.createElement("canvas");
    passCanvas.width = 900;
    passCanvas.height = 1120;

    const context = passCanvas.getContext("2d");
    if (!context) {
      throw new Error("Your browser could not create the QR pass image.");
    }

    context.fillStyle = "#fff8df";
    context.fillRect(0, 0, passCanvas.width, passCanvas.height);

    context.fillStyle = "#5f0a0c";
    context.fillRect(0, 0, passCanvas.width, 250);

    try {
      const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("University logo could not be loaded."));
        image.src = "/ruhuna-logo.png";
      });

      context.save();
      context.beginPath();
      context.arc(450, 105, 72, 0, Math.PI * 2);
      context.clip();
      context.drawImage(logo, 378, 33, 144, 144);
      context.restore();

      context.lineWidth = 6;
      context.strokeStyle = "#f5ba1d";
      context.beginPath();
      context.arc(450, 105, 75, 0, Math.PI * 2);
      context.stroke();
    } catch (error) {
      console.warn(error);
    }

    context.textAlign = "center";
    context.fillStyle = "#f5ba1d";
    context.font = "700 34px Arial, sans-serif";
    context.fillText("READING ROOM STUDENT PASS", 450, 215);

    context.fillStyle = "#5f0a0c";
    context.font = "700 42px Arial, sans-serif";
    context.fillText(studentName || "Student Pass", 450, 315);

    context.fillStyle = "#7d5b4a";
    context.font = "500 25px Arial, sans-serif";
    context.fillText("Faculty of Engineering · University of Ruhuna", 450, 358);

    context.fillStyle = "#ffffff";
    context.fillRect(140, 400, 620, 620);
    context.drawImage(qrCanvas, 175, 435, 550, 550);

    context.fillStyle = "#5f0a0c";
    context.font = "700 38px monospace";
    context.fillText(studentId, 450, 1065);

    context.fillStyle = "#8a715f";
    context.font = "500 19px Arial, sans-serif";
    context.fillText("Present this QR code at the reading room scanner.", 450, 1097);

    return passCanvas.toDataURL("image/png", 1);
  };

  const downloadStudentPass = async () => {
    setQrFeedback(null);

    try {
      await saveStudentProfile();
      const dataUrl = await createStudentPassDataUrl();
      const studentId = newStudentId.trim().toUpperCase();
      const anchor = document.createElement("a");

      anchor.href = dataUrl;
      anchor.download = `${studentId.replaceAll("/", "-")}-reading-room-pass.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setQrFeedback({
        success: true,
        msg: "The student QR pass was downloaded successfully.",
      });
    } catch (error) {
      setQrFeedback({
        success: false,
        msg: error instanceof Error ? error.message : "Unable to download the QR pass.",
      });
    }
  };

  const sendStudentPassByEmail = async () => {
    const studentId = newStudentId.trim().toUpperCase();
    const email = newStudentEmail.trim().toLowerCase();

    setQrFeedback(null);

    if (studentId.length < 4) {
      setQrFeedback({ success: false, msg: "Enter a valid student ID." });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setQrFeedback({ success: false, msg: "Enter a valid student email address." });
      return;
    }

    setQrSending(true);

    try {
      await saveStudentProfile();
      const qrDataUrl = await createStudentPassDataUrl();
      const result = await sendStudentQrPassEmail({
        studentId,
        studentName: newStudentName.trim(),
        email,
        qrDataUrl,
      });

      setQrFeedback({
        success: result.success,
        msg: result.message,
      });
    } catch (error) {
      setQrFeedback({
        success: false,
        msg: error instanceof Error ? error.message : "The email could not be sent.",
      });
    } finally {
      setQrSending(false);
    }
  };

  const handleCreateStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStaffLoading(true);
    setStaffFeedback(null);

    const result = await createStaffAccount(
      staffForm.email,
      staffForm.password,
      staffForm.fullName,
      staffForm.role,
    );

    setStaffFeedback({ success: result.success, msg: result.message });

    if (result.success) {
      setStaffForm({
        email: "",
        password: "",
        fullName: "",
        role: "STAFF",
      });
      await refreshStaffList();
    }

    setStaffLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#4b1719]">
      <div className="border-b border-[#7a1517] bg-[#5f0a0c] text-[#f5ba1d]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.12em]">
            Faculty of Engineering · University of Ruhuna
          </p>
          <p className="text-[#ffe6a2]">Reading Room Attendance System</p>
        </div>
      </div>

      <header className="border-b-4 border-[#5f0a0c] bg-[#f5ba1d] shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#5f0a0c] bg-[#fff8df] text-sm font-extrabold tracking-tight text-[#5f0a0c] shadow-sm">
              UOR
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#3b0809] sm:text-3xl">
                  Reading Room Dashboard
                </h1>
                {userRole && (
                  <span className="rounded-full border border-[#5f0a0c]/25 bg-[#5f0a0c] px-3 py-1 text-xs font-bold tracking-[0.08em] text-[#f5ba1d]">
                    {userRole}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-[#6b2c24] sm:text-base">
                Live attendance monitoring system
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#5f0a0c]/20 bg-[#fff8df] px-4 py-2.5 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-bold text-[#5f0a0c]">System Live</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5f0a0c] px-4 py-2.5 text-sm font-bold text-[#f5ba1d] shadow-sm transition hover:bg-[#760f12]"
            >
              <Icon name="logout" className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">

        <section className="mb-7 flex flex-col gap-4 rounded-xl border border-[#e2d3ad] border-t-4 border-t-[#5f0a0c] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {userRole === "ADMIN" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#f5ba1d] px-4 py-2.5 font-bold text-[#5f0a0c] shadow-sm transition hover:bg-[#e0a400]"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Generate Student Pass
                </button>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#5f0a0c]/25 bg-white px-4 py-2.5 font-bold text-[#5f0a0c] transition hover:bg-[#fff2c9]"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Create Staff Account
                </button>
              </>
            )}
          </div>

          <div className="inline-flex w-full rounded-lg bg-[#fff0b8] p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setView("overview")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${view === "overview"
                  ? "bg-[#5f0a0c] text-[#f5ba1d] shadow-sm"
                  : "text-[#5f0a0c]/70 hover:text-[#5f0a0c]"
                }`}
            >
              <Icon name="activity" className="h-4 w-4" />
              Overview
            </button>
            <button
              type="button"
              onClick={() => setView("live")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${view === "live"
                  ? "bg-[#5f0a0c] text-[#f5ba1d] shadow-sm"
                  : "text-[#5f0a0c]/70 hover:text-[#5f0a0c]"
                }`}
            >
              <Icon name="users" className="h-4 w-4" />
              Live View
            </button>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        {view === "overview" ? (
          <>
            <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Currently Inside"
                value={activeLogs.length.toString()}
                detail={`${Math.max(0, ROOM_CAPACITY - activeLogs.length)} seats available`}
                icon="users"
              />
              <MetricCard
                label="Today's Check-ins"
                value={todayLogs.length.toString()}
                detail="Recorded since midnight"
                icon="calendar"
              />
              <MetricCard
                label="Average Session"
                value={formatDuration(averageSessionMinutes)}
                detail={
                  completedToday.length > 0
                    ? `${completedToday.length} completed sessions`
                    : "Based on today's active sessions"
                }
                icon="clock"
              />
              <MetricCard
                label="Room Capacity"
                value={`${occupancyPercent}%`}
                detail={`${activeLogs.length} of ${ROOM_CAPACITY} seats occupied`}
                icon="capacity"
              />
            </section>

            <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
              <div className="overflow-hidden rounded-xl border border-[#e2d3ad] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#efe4c3] px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-[#5f0a0c]">Recent Activity</h2>
                    <p className="mt-0.5 text-xs text-[#87776a]">
                      Latest check-ins and check-outs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("live")}
                    className="rounded-lg border border-[#dec98d] px-3 py-1.5 text-xs font-semibold transition hover:bg-[#fff8e1]"
                  >
                    View live
                  </button>
                </div>

                <div className="divide-y divide-[#f3ead1]">
                  {loading ? (
                    <EmptyState text="Loading recent activity..." />
                  ) : logs.length === 0 ? (
                    <EmptyState text="No attendance activity yet." />
                  ) : (
                    logs.slice(0, 7).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-[#fff9e9]"
                      >
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${log.status === "IN" ? "bg-emerald-500" : "bg-[#d58a14]"
                            }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-[#5f0a0c]">
                            <span className="font-semibold">
                              {log.students?.full_name || "Unknown student"}
                            </span>{" "}
                            {log.status === "IN" ? "checked in" : "checked out"}
                          </p>
                          <p className="mt-1 text-xs text-[#8e7e70]">
                            {log.student_id} · {formatTime(log.check_in_time)}
                            {log.check_out_time
                              ? ` – ${formatTime(log.check_out_time)}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-[#7d6b5d]">
                          {formatDuration(getSessionMinutes(log, now))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-[#e2d3ad] bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-[#5f0a0c]">Library Capacity</h2>
                      <p className="mt-0.5 text-xs text-[#87776a]">Live occupancy</p>
                    </div>
                    <p className="text-2xl font-bold text-[#5f0a0c]">
                      {activeLogs.length}
                      <span className="ml-1 text-sm font-medium text-[#87776a]">
                        / {ROOM_CAPACITY}
                      </span>
                    </p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#efe7cf]">
                    <div
                      className="h-full rounded-full bg-[#5f0a0c] transition-[width] duration-500"
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-[#87776a]">
                    <span>0</span>
                    <span className="font-semibold text-[#5f0a0c]">
                      {occupancyPercent}% occupied
                    </span>
                    <span>{ROOM_CAPACITY}</span>
                  </div>
                </div>

                <DistributionCard
                  title="Current Students by Department"
                  subtitle="Electrical, Mechanical, Civil and Computer"
                  rows={departmentData}
                  emptyText="No students are currently inside."
                  unspecifiedCount={unspecifiedDepartmentCount}
                  unspecifiedLabel="Department not assigned"
                />

                <DistributionCard
                  title="Current Students by Gender"
                  subtitle="Live gender distribution inside the reading room"
                  rows={genderData}
                  emptyText="No students are currently inside."
                  unspecifiedCount={unspecifiedGenderCount}
                  unspecifiedLabel="Gender not assigned"
                />
              </div>
            </section>

            <section className="mb-7 rounded-xl border border-[#e2d3ad] bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-[#5f0a0c]">Today's Hourly Traffic</h2>
                  <p className="mt-0.5 text-xs text-[#87776a]">Check-ins per hour</p>
                </div>
                <span className="text-xs font-medium text-[#7d6b5d]">
                  {todayLogs.length} total check-ins
                </span>
              </div>

              <div className="flex h-40 items-end gap-1.5 sm:gap-2">
                {hourlyTraffic.map((item) => (
                  <div
                    key={item.hour}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${item.hour.toString().padStart(2, "0")}:00 — ${item.count} check-in${item.count === 1 ? "" : "s"}`}
                  >
                    <div className="relative flex h-[116px] w-full items-end rounded-t-md bg-[#fff8e1]">
                      <div
                        className="w-full rounded-t-md bg-[#f5ba1d] transition-all group-hover:bg-[#d89a00]"
                        style={{
                          height: `${Math.max(
                            item.count > 0 ? 7 : 2,
                            (item.count / busiestHourCount) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#87776a]">
                      {item.hour % 3 === 0
                        ? item.hour.toString().padStart(2, "0")
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
            <div className="overflow-hidden rounded-xl border border-[#e2d3ad] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efe4c3] px-5 py-4">
                <div>
                  <h2 className="font-semibold text-[#5f0a0c]">Currently Inside</h2>
                  <p className="mt-0.5 text-xs text-[#87776a]">
                    Live student sessions
                  </p>
                </div>
                <span className="rounded-full bg-[#fff0b8] px-3 py-1 text-sm font-bold text-[#5f0a0c]">
                  {activeLogs.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-[#efe4c3] bg-[#fff9e9] text-xs uppercase tracking-[0.08em] text-[#7d6b5d]">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Student</th>
                      <th className="px-5 py-3.5 font-semibold">Gender</th>
                      <th className="px-5 py-3.5 font-semibold">Department</th>
                      <th className="px-5 py-3.5 font-semibold">Check-in</th>
                      <th className="px-5 py-3.5 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ead1]">
                    {loading ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState text="Loading live attendance..." />
                        </td>
                      </tr>
                    ) : activeLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState text="No students are currently inside." />
                        </td>
                      </tr>
                    ) : (
                      activeLogs.map((log) => (
                        <tr key={log.id} className="transition hover:bg-[#fff9e9]">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[#5f0a0c]">
                              {log.students?.full_name || "Unknown student"}
                            </p>
                            <p className="mt-1 font-mono text-xs text-[#87776a]">
                              {log.student_id}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#f8eadf] px-2.5 py-1 text-xs font-semibold text-[#5f0a0c]">
                              {formatGender(log.students?.gender)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#fff0b8] px-2.5 py-1 text-xs font-semibold text-[#5f0a0c]">
                              {formatDepartment(log.students?.department)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[#766558]">
                            {formatTime(log.check_in_time)}
                          </td>
                          <td className="px-5 py-4 font-medium text-[#4b1719]">
                            {formatDuration(getSessionMinutes(log, now))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-[#e2d3ad] bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-[#6e5f52]">Live Occupancy</p>
                <p className="mt-4 text-6xl font-bold tracking-tight text-[#5f0a0c]">
                  {activeLogs.length}
                </p>
                <p className="mt-2 text-sm text-[#87776a]">
                  students currently in the reading room
                </p>

                <div className="mt-7 h-3 overflow-hidden rounded-full bg-[#efe7cf]">
                  <div
                    className="h-full rounded-full bg-[#5f0a0c] transition-[width] duration-500"
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-[#87776a]">
                  <span>0</span>
                  <span className="font-semibold text-[#5f0a0c]">
                    {occupancyPercent}% of capacity
                  </span>
                  <span>{ROOM_CAPACITY}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#e2d3ad] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7d6b5d]">
                  Last scan
                </p>
                {lastScan ? (
                  <div className="mt-4">
                    <p className="font-semibold text-[#5f0a0c]">
                      {lastScan.students?.full_name || "Unknown student"}
                    </p>
                    <p className="mt-1 text-sm text-[#7d6b5d]">
                      {lastScan.student_id}
                    </p>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-[#fff7dd] px-4 py-3 text-sm">
                      <span
                        className={`font-semibold ${lastScan.status === "IN"
                            ? "text-emerald-700"
                            : "text-[#7a4a1e]"
                          }`}
                      >
                        {lastScan.status === "IN" ? "Checked in" : "Checked out"}
                      </span>
                      <span className="text-[#766558]">
                        {formatTime(
                          lastScan.check_out_time || lastScan.check_in_time,
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#87776a]">No scans recorded yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#5f0a0c]">
                Recent Attendance Logs
              </h2>
              <p className="mt-1 text-sm text-[#7d6b5d]">
                Complete check-in and check-out history
              </p>
            </div>
            <button
              type="button"
              onClick={exportToCSV}
              disabled={logs.length === 0 || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-[#f2faf6] px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-[#e8f6ef] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="download" className="h-4 w-4" />
              Export to CSV
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e2d3ad] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="border-b border-[#efe4c3] bg-[#fff9e9] text-[#5f0a0c]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">ID Number</th>
                    <th className="px-6 py-4 font-semibold">Gender</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Check In</th>
                    <th className="px-6 py-4 font-semibold">Check Out</th>
                    <th className="px-6 py-4 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3ead1]">
                  {loading ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState text="Loading secure data..." />
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState text="No attendance records found yet." />
                      </td>
                    </tr>
                  ) : (
                    logs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="transition hover:bg-[#fff9e9]">
                        <td className="px-6 py-4 font-semibold text-[#5f0a0c]">
                          {log.students?.full_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 font-mono text-[#7d6b5d]">
                          {log.student_id}
                        </td>
                        <td className="px-6 py-4 text-[#766558]">
                          {formatGender(log.students?.gender)}
                        </td>
                        <td className="px-6 py-4 text-[#766558]">
                          {formatDepartment(log.students?.department)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider ${log.status === "IN"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-[#fff0c2] text-[#7a4a1e]"
                              }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#766558]">
                          {formatTime(log.check_in_time, true)}
                        </td>
                        <td className="px-6 py-4 text-[#766558]">
                          {formatTime(log.check_out_time, true)}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#4b1719]">
                          {formatDuration(getSessionMinutes(log, now))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {userRole === "ADMIN" && (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-[#5f0a0c]">Staff Directory</h2>
              <p className="mt-1 text-sm text-[#7d6b5d]">
                Manage authorized dashboard users
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e2d3ad] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-[#efe4c3] bg-[#fff9e9] text-[#5f0a0c]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ead1]">
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState text="No staff accounts found." />
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff) => (
                        <tr key={staff.id} className="transition hover:bg-[#fff9e9]">
                          <td className="px-6 py-4 font-semibold text-[#5f0a0c]">
                            {staff.full_name}
                          </td>
                          <td className="px-6 py-4 text-[#766558]">{staff.email}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-[#fff0b8] px-3 py-1 text-xs font-bold tracking-wider text-[#5f0a0c]">
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Delete ${staff.full_name}'s account? This action cannot be undone.`,
                                );
                                if (!confirmed) return;

                                const result = await deleteStaffAccount(staff.id);
                                if (result.success) {
                                  setStaffList((current) =>
                                    current.filter((item) => item.id !== staff.id),
                                  );
                                } else {
                                  window.alert(result.message);
                                }
                              }}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 border-t border-[#dec98d] py-6 text-center text-xs text-[#7d6b5d]">
          <p className="font-semibold text-[#5f0a0c]">Faculty of Engineering · University of Ruhuna</p>
          <p className="mt-1">Reading Room Attendance Management System</p>
        </footer>
      </div>

      {showQRModal && (
        <Modal
          title="Generate and Email Student Pass"
          description="Create a branded QR pass, download it, or email it directly to the student."
          onClose={() => {
            setShowQRModal(false);
            setNewStudentId("");
            setNewStudentName("");
            setNewStudentEmail("");
            setNewStudentGender("MALE");
            setNewStudentDepartment("ELECTRICAL");
            setQrFeedback(null);
          }}
        >
          {qrFeedback && (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${qrFeedback.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
            >
              {qrFeedback.msg}
            </div>
          )}

          <div className="space-y-4">
            <FormField label="Student ID">
              <input
                type="text"
                value={newStudentId}
                onChange={(event) => {
                  setNewStudentId(event.target.value);
                  setQrFeedback(null);
                }}
                placeholder="EG/2026/001"
                className="form-input font-mono uppercase"
              />
            </FormField>

            <FormField label="Student Full Name">
              <input
                type="text"
                value={newStudentName}
                onChange={(event) => setNewStudentName(event.target.value)}
                placeholder="Student full name"
                className="form-input"
              />
            </FormField>

            <FormField label="Student Email">
              <input
                type="email"
                value={newStudentEmail}
                onChange={(event) => {
                  setNewStudentEmail(event.target.value);
                  setQrFeedback(null);
                }}
                placeholder="student@example.com"
                className="form-input"
              />
            </FormField>
            <FormField label="Gender">
              <select
                value={newStudentGender}
                onChange={(event) =>
                  setNewStudentGender(event.target.value as Gender)
                }
                className="form-input bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>

            <FormField label="Department">
              <select
                value={newStudentDepartment}
                onChange={(event) =>
                  setNewStudentDepartment(event.target.value as Department)
                }
                className="form-input bg-white"
              >
                <option value="ELECTRICAL">Electrical Engineering</option>
                <option value="MECHANICAL">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
                <option value="COMPUTER">Computer Engineering</option>
              </select>
            </FormField>
          </div>

          <div className="mt-6 flex min-h-72 items-center justify-center rounded-2xl border border-[#efe4c3] bg-[#fff9e9] p-6">
            {newStudentId.trim().length > 3 ? (
              <div className="rounded-2xl border border-[#ead8a9] bg-white p-4 shadow-sm">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={newStudentId.trim().toUpperCase()}
                  size={240}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#5f0a0c"
                  title={`Reading room pass for ${newStudentId.trim().toUpperCase()}`}
                />
              </div>
            ) : (
              <p className="max-w-52 text-center text-sm text-[#87776a]">
                Enter a valid student ID to generate the QR code.
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void downloadStudentPass()}
              disabled={
                newStudentId.trim().length < 4 ||
                !newStudentName.trim() ||
                !newStudentEmail.trim() ||
                qrSending
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5f0a0c]/25 bg-white px-4 py-3 font-bold text-[#5f0a0c] transition hover:bg-[#fff2c9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="download" className="h-4 w-4" />
              Download PNG
            </button>

            <button
              type="button"
              onClick={() => void sendStudentPassByEmail()}
              disabled={
                newStudentId.trim().length < 4 ||
                !newStudentName.trim() ||
                !newStudentEmail.trim() ||
                qrSending
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5f0a0c] px-4 py-3 font-bold text-[#f5ba1d] transition hover:bg-[#760f12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="mail" className="h-4 w-4" />
              {qrSending ? "Sending..." : "Save & Email QR"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[#87776a]">
            The student receives a branded PNG attachment and does not need dashboard access.
          </p>
        </Modal>
      )}

      {showStaffModal && (
        <Modal
          title="Create Staff Account"
          description="Create a secure login for library personnel."
          onClose={() => {
            setShowStaffModal(false);
            setStaffFeedback(null);
          }}
        >
          {staffFeedback && (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${staffFeedback.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
            >
              {staffFeedback.msg}
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="space-y-4">
            <FormField label="Full Name">
              <input
                type="text"
                required
                value={staffForm.fullName}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="form-input"
              />
            </FormField>

            <FormField label="Email Address">
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="form-input"
              />
            </FormField>

            <FormField label="Temporary Password">
              <input
                type="password"
                required
                minLength={6}
                value={staffForm.password}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="form-input"
              />
            </FormField>

            <FormField label="System Role">
              <select
                value={staffForm.role}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    role: event.target.value as UserRole,
                  }))
                }
                className="form-input bg-white"
              >
                <option value="STAFF">Staff (view access)</option>
                <option value="ADMIN">Admin (full access)</option>
              </select>
            </FormField>

            <button
              type="submit"
              disabled={staffLoading}
              className="mt-2 w-full rounded-xl bg-[#5f0a0c] px-4 py-3 font-semibold text-white transition hover:bg-[#760f12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {staffLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </Modal>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #ddcc9a;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #5f0a0c;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .form-input:focus {
          border-color: #f5ba1d;
          box-shadow: 0 0 0 4px rgba(234, 216, 201, 0.65);
        }
      `}</style>
    </main>
  );
}

function DistributionCard({
  title,
  subtitle,
  rows,
  emptyText,
  unspecifiedCount,
  unspecifiedLabel,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ key: string; name: string; count: number; percentage: number }>;
  emptyText: string;
  unspecifiedCount?: number;
  unspecifiedLabel?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0) +
    (unspecifiedCount ?? 0);

  return (
    <div className="rounded-xl border border-[#e2d3ad] bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-[#5f0a0c]">{title}</h2>
      <p className="mt-0.5 text-xs text-[#87776a]">{subtitle}</p>

      <div className="mt-5 space-y-3">
        {total === 0 ? (
          <p className="py-4 text-center text-sm text-[#87776a]">{emptyText}</p>
        ) : (
          <>
            {rows.map((row) => (
              <div key={row.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#4b1719]">{row.name}</span>
                  <span className="text-[#7d6b5d]">
                    {row.count} · {row.percentage}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#efe7cf]">
                  <div
                    className="h-full rounded-full bg-[#f5ba1d]"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {(unspecifiedCount ?? 0) > 0 && (
              <div className="rounded-lg bg-[#fff8e1] px-3 py-2 text-xs text-[#7d6b5d]">
                {unspecifiedLabel}: <strong>{unspecifiedCount}</strong>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: "users" | "calendar" | "clock" | "capacity";
}) {
  return (
    <article className="rounded-xl border border-[#e2d3ad] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#7d6b5d]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#5f0a0c]">
            {value}
          </p>
          <p className="mt-2 text-xs text-[#8e7e70]">{detail}</p>
        </div>
        <span className="rounded-xl bg-[#fff0b8] p-2.5 text-[#5f0a0c]">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center text-sm text-[#87776a]">{text}</div>;
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c0809]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#e2d3ad] bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-[#87776a] transition hover:bg-[#fff2c9] hover:text-[#5f0a0c]"
          aria-label="Close modal"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
        <h2 className="pr-10 text-xl font-bold text-[#5f0a0c]">{title}</h2>
        <p className="mb-6 mt-1 text-sm text-[#7d6b5d]">{description}</p>
        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#5f0a0c]">
        {label}
      </span>
      {children}
    </label>
  );
}