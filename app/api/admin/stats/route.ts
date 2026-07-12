import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { requireAdmin } from "@/src/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const [
      usersResult,
      servicesResult,
      faultsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("services")
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("fault_cases")
        .select("id", { count: "exact", head: true }),
    ]);

    if (usersResult.error) {
      throw usersResult.error;
    }

    if (servicesResult.error) {
      throw servicesResult.error;
    }

    if (faultsResult.error) {
      throw faultsResult.error;
    }

    return NextResponse.json({
      users: usersResult.count ?? 0,
      services: servicesResult.count ?? 0,
      faults: faultsResult.count ?? 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Greška kod učitavanja statistike.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}