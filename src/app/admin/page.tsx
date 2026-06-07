"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createStaffAccount } from "@/app/actions/staff"; // IMPORT OUR NEW BACKEND ACTION

type AttendanceLog = {
  id: string;
  student_id: string;
  check_in_time: string;
  check_out_time: string | null;
  status: "IN" | "OUT";
  students: { full_name: string } | null;
};

export default function AdminDashboard() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"ADMIN" | "STAFF" | null>(null);

  // States for QR Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");

  // NEW States for Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "STAFF",
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState<{
    success: boolean;
    msg: string;
  } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // 1. Authenticate and get Role
    const fetchUserAndRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("1. Logged in user:", user?.email); // DEBUG LINE

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log("2. Profile data fetched:", profile); // DEBUG LINE
        console.log("3. Any errors?", error); // DEBUG LINE

        if (profile) setUserRole(profile.role);
      }
    };

    // 2. Fetch the attendance logs
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select(
          `id, student_id, check_in_time, check_out_time, status, students ( full_name )`,
        )
        .order("check_in_time", { ascending: false })
        .limit(50);

      if (!error) setLogs(data as unknown as AttendanceLog[]);
      setLoading(false);
    };

    fetchUserAndRole();
    fetchLogs();

    // 3. Subscribe to live changes
    const channel = supabase
      .channel("live-attendance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        () => {
          fetchLogs();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const activeCount = logs.filter((log) => log.status === "IN").length;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // NEW: CSV Export Function
  const exportToCSV = () => {
    if (logs.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 1. Define the CSV headers
    const headers = [
      "Student Name",
      "ID Number",
      "Status",
      "Check In Time",
      "Check Out Time",
    ];

    // 2. Map the log data into rows
    const csvRows = logs.map((log) => {
      const checkIn = new Date(log.check_in_time).toLocaleString();
      const checkOut = log.check_out_time
        ? new Date(log.check_out_time).toLocaleString()
        : "Still Inside";

      return [
        `"${log.students?.full_name || "Unknown"}"`, // Quotes prevent issues if a name has a comma
        `"${log.student_id}"`,
        `"${log.status}"`,
        `"${checkIn}"`,
        `"${checkOut}"`,
      ].join(",");
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Create a downloadable Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // 5. Trigger the download with today's date in the filename
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Library_Attendance_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header section updated with Sign Out and Role Badge */}
        <header className="flex justify-between items-end mb-8 border-b pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Reading Room Dashboard
              </h1>
              {/* Show their Role Badge */}
              {userRole && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                    userRole === "ADMIN"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {userRole}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              Live attendance monitoring system
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-gray-700">
                System Live
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-900 underline"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* ADMIN ONLY CONTROLS */}
        {userRole === "ADMIN" && (
          <div className="mb-8 flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setShowQRModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              + Generate Student Pass
            </button>
            {/* NEW BUTTON */}
            <button
              onClick={() => setShowStaffModal(true)}
              className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              + Create Staff Account
            </button>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium mb-1">
              Currently Inside
            </h3>
            <p className="text-4xl font-bold text-blue-600">{activeCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium mb-1">
              Total Scans (Today)
            </h3>
            <p className="text-4xl font-bold text-gray-800">{logs.length}</p>
          </div>
        </div>

        {/* Table Header & Export Controls */}
        <div className="flex justify-between items-end mb-4 mt-8">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Attendance Logs
          </h2>
          <button
            onClick={exportToCSV}
            disabled={logs.length === 0 || loading}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export to CSV
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">ID Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading secure data...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No attendance records found yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {log.students?.full_name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">
                        {log.student_id}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                            log.status === "IN"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(log.check_in_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.check_out_time
                          ? new Date(log.check_out_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR GENERATOR MODAL (Hidden by default) */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowQRModal(false);
                setNewStudentId("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Generate Student Pass</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter the exact Student ID (e.g., ENG/2026/001) to generate their
              secure QR code.
            </p>

            <input
              type="text"
              value={newStudentId}
              onChange={(e) => setNewStudentId(e.target.value)}
              placeholder="Enter Student ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 font-mono focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            />

            <div className="flex justify-center bg-gray-50 p-6 rounded-xl border border-gray-100">
              {newStudentId.length > 3 ? (
                <QRCodeSVG
                  value={newStudentId.toUpperCase()}
                  size={200}
                  level="H"
                />
              ) : (
                <div className="w-50 h-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm text-center p-4">
                  Type an ID above to generate code
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ... (Keep the existing QR Generator Modal here) ... */}

      {/* STAFF CREATION MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowStaffModal(false);
                setStaffFeedback(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-2">Create System User</h2>
            <p className="text-sm text-gray-500 mb-6">
              Generate a new login for library personnel.
            </p>

            {staffFeedback && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 border ${staffFeedback.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
              >
                {staffFeedback.msg}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setStaffLoading(true);
                setStaffFeedback(null);

                const result = await createStaffAccount(
                  staffForm.email,
                  staffForm.password,
                  staffForm.fullName,
                  staffForm.role as "ADMIN" | "STAFF",
                );
                setStaffFeedback({
                  success: result.success,
                  msg: result.message,
                });

                if (result.success) {
                  setStaffForm({
                    email: "",
                    password: "",
                    fullName: "",
                    role: "STAFF",
                  }); // Reset form
                }
                setStaffLoading(false);
              }}
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.fullName}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="STAFF">Staff (View Only)</option>
                    <option value="ADMIN">Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={staffLoading}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {staffLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
