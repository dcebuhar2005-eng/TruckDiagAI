import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      authorized: false,
      status: 401,
      error: "Niste prijavljeni.",
      user: null,
    };
  }

  const accessToken = authorization.replace("Bearer ", "").trim();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      authorized: false,
      status: 401,
      error: "Prijava nije važeća.",
      user: null,
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Admin profile error:", profileError);

    return {
      authorized: false,
      status: 500,
      error: "Greška kod provjere administratorskih ovlasti.",
      user: null,
    };
  }

  if (!profile?.is_admin || profile.role !== "admin") {
    return {
      authorized: false,
      status: 403,
      error: "Nemate administratorske ovlasti.",
      user: null,
    };
  }

  return {
    authorized: true,
    status: 200,
    error: null,
    user,
  };
}