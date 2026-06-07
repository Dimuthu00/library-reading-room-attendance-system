"use server";

import { createClient } from "@supabase/supabase-js";

export async function createStaffAccount(
  email: string, 
  password: string, 
  fullName: string, 
  role: "ADMIN" | "STAFF"
) {
  // Initialize the admin-only client using the secret key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // This key NEVER goes to the browser
  );

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skips the email verification requirement
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    });

    if (error) throw error;
    
    return { success: true, message: `Successfully created ${role} account for ${fullName}.` };
  } catch (error: any) {
    console.error("Admin user creation failed:", error);
    return { success: false, message: error.message };
  }
}

export async function getStaffList() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch all profiles to display in the admin table
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("role", { ascending: true }); // Groups ADMINs first, then STAFF

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch staff list:", error);
    return { success: false, data: [] };
  }
}

export async function deleteStaffAccount(userId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Deleting from auth.users automatically deletes their row in the profiles table because of our CASCADE rule!
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) throw error;
    return { success: true, message: "Account permanently deleted." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}