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