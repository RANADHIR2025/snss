import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing create admin account request");

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super_admin using service role for accurate check
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      console.error("User is not a super admin");
      return new Response(
        JSON.stringify({ error: "Only Super Admins can create admin accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, password, fullName, phone }: CreateAdminRequest = await req.json();

    // Validate inputs
    if (!email || !email.trim()) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fullName || !fullName.trim()) {
      return new Response(
        JSON.stringify({ error: "Full name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log(`Creating admin account for: ${cleanEmail.substring(0, 3)}***`);

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      // Check if already admin
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existingProfile.user_id)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: "This user is already an admin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // User exists but is not admin - upgrade them
      const { error: upgradeError } = await supabaseAdmin
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", existingProfile.user_id);

      if (upgradeError) {
        console.error("Failed to upgrade user to admin:", upgradeError.message);
        return new Response(
          JSON.stringify({ error: "Failed to upgrade existing user to admin" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the action
      await supabaseAdmin.from("admin_audit_log").insert({
        action: "admin_created",
        target_email: cleanEmail,
        target_user_id: existingProfile.user_id,
        performed_by: user.id,
        details: { method: "upgraded_existing_user" },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Existing user upgraded to admin successfully",
          user_id: existingProfile.user_id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new user with admin auth API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
      },
    });

    if (createError) {
      console.error("Failed to create user:", createError.message);
      return new Response(
        JSON.stringify({ error: createError.message || "Failed to create user account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The handle_new_user trigger will create profile and assign 'user' role
    // We need to update the role to 'admin'
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: roleUpdateError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", newUser.user.id);

    if (roleUpdateError) {
      console.error("Failed to set admin role:", roleUpdateError.message);
      // Try to insert if update failed (trigger might not have created it yet)
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ 
          user_id: newUser.user.id, 
          role: "admin" 
        }, { 
          onConflict: "user_id" 
        });

      if (roleInsertError) {
        console.error("Failed to insert admin role:", roleInsertError.message);
      }
    }

    // Log the action
    await supabaseAdmin.from("admin_audit_log").insert({
      action: "admin_created",
      target_email: cleanEmail,
      target_user_id: newUser.user.id,
      performed_by: user.id,
      details: { method: "direct_creation", full_name: fullName.trim() },
    });

    console.log("Admin account created successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin account created successfully",
        user_id: newUser.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
