import { createClient } from "./supabase";

export interface ScanResponse {
  success: boolean;
  message: string;
  studentName?: string;
  type?: "CHECK_IN" | "CHECK_OUT";
}

export async function handleQRScan(studentId: string): Promise<ScanResponse> {
  // Initialize the Supabase client inside the function
  const supabase = createClient();

  try {
    // 1. Verify if the student exists in the system
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("full_name")
      .eq("student_id", studentId)
      .single();

    if (studentError || !student) {
      return {
        success: false,
        message: `Invalid ID: Student record not found for ${studentId}.`,
      };
    }

    // 2. Check for an active session (Checked in, but not checked out yet)
    const { data: activeLog, error: logError } = await supabase
      .from("attendance_logs")
      .select("id")
      .eq("student_id", studentId)
      .is("check_out_time", null)
      .maybeSingle(); // Returns null instead of an error if no row is found

    if (logError) throw logError;

    const currentTime = new Date().toISOString();

    if (activeLog) {
      // 3. STATE: MATCH FOUND -> Perform Check-Out
      const { error: updateError } = await supabase
        .from("attendance_logs")
        .update({
          check_out_time: currentTime,
          status: "OUT",
        })
        .eq("id", activeLog.id);

      if (updateError) throw updateError;

      return {
        success: true,
        message: `Goodbye, see you next time!`,
        studentName: student.full_name,
        type: "CHECK_OUT",
      };
    } else {
      // 4. STATE: NO MATCH FOUND -> Perform Check-In
      const { error: insertError } = await supabase
        .from("attendance_logs")
        .insert({
          student_id: studentId,
          check_in_time: currentTime,
          status: "IN",
        });

      if (insertError) throw insertError;

      return {
        success: true,
        message: `Welcome to the Reading Room!`,
        studentName: student.full_name,
        type: "CHECK_IN",
      };
    }
  } catch (error) {
    console.error("Database operation failed:", error);
    return {
      success: false,
      message: "System error processing your request. Please try again.",
    };
  }
}
