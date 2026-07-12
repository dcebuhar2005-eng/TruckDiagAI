import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/src/lib/supabaseServer";
import { deleteFault, deleteService } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";
const ITEMS_PER_PAGE = 20;

type Service = {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
  created_at: string | null;
};

type Fault = {
  id: string;
  brand: string | null;
  model: string | null;
  engine: string | null;
  symptoms: string | null;
  final_fault: string | null;
  created_at: string | null;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;

  const requestedPage = Number(params.page ?? "1");

  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Korisnik nije prijavljen
  if (userError || !user) {
    redirect("/login");
  }

  const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin =
    adminProfile?.is_admin === true || adminProfile?.role === "admin";

  // Korisnik je prijavljen, ali nije administrator
  if (adminProfileError || !isAdmin) {
    redirect("/");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sevenDaysAgoIso = sevenDaysAgo.toISOString();
  const [
    profilesResult,
    servicesResult,
    faultCasesResult,
    faultsResult,
    servicesListResult,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),

    supabaseAdmin.from("services").select("id", { count: "exact", head: true }),

    supabaseAdmin
      .from("fault_cases")
      .select("id", { count: "exact", head: true }),

    supabaseAdmin
      .from("fault_cases")
      .select(
        `
        id,
        brand,
        model,
        engine,
        symptoms,
        final_fault,
        created_at
      `,
      )
      .gte("created_at", sevenDaysAgoIso)
      .order("created_at", { ascending: false })
      .range(from, to),

    supabaseAdmin
      .from("services")
      .select(
        `
        id,
        name,
        city,
        phone,
        created_at
      `,
      )
      .order("created_at", { ascending: false }),
  ]);

  const errors = [
    profilesResult.error,
    servicesResult.error,
    faultCasesResult.error,
    faultsResult.error,
    servicesListResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("Admin dashboard error:", errors);

    return (
      <main
        className="min-h-screen p-6"
        style={{
          backgroundColor: "#f3f4f6",
          color: "#111827",
        }}
      >
        <div
          className="mx-auto max-w-7xl rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: "#ffffff" }}
        >
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>
            Admin dashboard
          </h1>

          <p className="mt-4" style={{ color: "#dc2626" }}>
            Dogodila se greška pri učitavanju podataka.
          </p>
        </div>
      </main>
    );
  }

  const stats = [
    {
      title: "Korisnici",
      value: profilesResult.count ?? 0,
    },
    {
      title: "Servisi",
      value: servicesResult.count ?? 0,
    },
    {
      title: "Kvarovi",
      value: faultCasesResult.count ?? 0,
    },
  ];

  const faults = faultsResult.data ?? ([] as Fault[]);
  const services = servicesListResult.data ?? ([] as Service[]);
  const totalFaults = faultCasesResult.count ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalFaults / ITEMS_PER_PAGE));

  return (
    <main
      className="min-h-screen p-6"
      style={{
        backgroundColor: "#f3f4f6",
        color: "#111827",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <header>
          <h1 className="text-3xl font-bold" style={{ color: "#111827" }}>
            TruckDiag AI Admin
          </h1>

          <p className="mt-2 text-base" style={{ color: "#4b5563" }}>
            Pregled korisnika, servisa i objavljenih kvarova.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.title}
              className="rounded-2xl border p-6 shadow-sm"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#e5e7eb",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "#6b7280" }}>
                {stat.title}
              </p>

              <p
                className="mt-3 text-4xl font-bold"
                style={{ color: "#111827" }}
              >
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <div
            className="overflow-hidden rounded-2xl border shadow-sm"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e5e7eb",
            }}
          >
            <div
              className="border-b px-6 py-5"
              style={{ borderColor: "#e5e7eb" }}
            >
              <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
                Kvarovi objavljeni u zadnjih 7 dana
              </h2>

              <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
                Kvarova u zadnjih 7 dana: {faults.length}
              </p>
            </div>

            {faults.length === 0 ? (
              <div className="p-6">
                <p style={{ color: "#6b7280" }}>
                  Trenutno nema objavljenih kvarova.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead style={{ backgroundColor: "#f9fafb" }}>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Marka
                      </th>

                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Model
                      </th>

                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Motor
                      </th>

                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Simptomi
                      </th>

                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Konačni kvar
                      </th>

                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Datum
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Akcije
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {faults.map((fault) => (
                      <tr
                        key={fault.id}
                        className="border-t"
                        style={{ borderColor: "#e5e7eb" }}
                      >
                        <td
                          className="px-6 py-4 text-sm font-semibold"
                          style={{ color: "#111827" }}
                        >
                          {fault.brand || "—"}
                        </td>

                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#374151" }}
                        >
                          {fault.model || "—"}
                        </td>

                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#374151" }}
                        >
                          {fault.engine || "—"}
                        </td>

                        <td
                          className="max-w-xs px-6 py-4 text-sm"
                          style={{ color: "#374151" }}
                        >
                          <p className="line-clamp-2">
                            {fault.symptoms || "—"}
                          </p>
                        </td>

                        <td
                          className="max-w-xs px-6 py-4 text-sm"
                          style={{ color: "#374151" }}
                        >
                          <p className="line-clamp-2">
                            {fault.final_fault || "—"}
                          </p>
                        </td>

                        <td
                          className="whitespace-nowrap px-6 py-4 text-sm"
                          style={{ color: "#6b7280" }}
                        >
                          {fault.created_at
                            ? new Intl.DateTimeFormat("hr-HR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }).format(new Date(fault.created_at))
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <form action={deleteFault}>
                            <input
                              type="hidden"
                              name="faultId"
                              value={fault.id}
                            />

                            <button
                              type="submit"
                              className="rounded-lg px-4 py-2 text-sm font-semibold"
                              style={{
                                backgroundColor: "#dc2626",
                                color: "#ffffff",
                              }}
                            >
                              Obriši
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  className="flex items-center justify-between border-t px-6 py-4"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <p className="text-sm" style={{ color: "#6b7280" }}>
                    Stranica {currentPage} od {totalPages}
                  </p>

                  <div className="flex gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={`/admin?page=${currentPage - 1}`}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold"
                        style={{
                          borderColor: "#d1d5db",
                          color: "#374151",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        Prethodna
                      </Link>
                    ) : (
                      <span
                        className="cursor-not-allowed rounded-lg border px-4 py-2 text-sm font-semibold opacity-40"
                        style={{
                          borderColor: "#d1d5db",
                          color: "#374151",
                        }}
                      >
                        Prethodna
                      </span>
                    )}

                    {currentPage < totalPages ? (
                      <Link
                        href={`/admin?page=${currentPage + 1}`}
                        className="rounded-lg px-4 py-2 text-sm font-semibold"
                        style={{
                          backgroundColor: "#111827",
                          color: "#ffffff",
                        }}
                      >
                        Sljedeća
                      </Link>
                    ) : (
                      <span
                        className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold opacity-40"
                        style={{
                          backgroundColor: "#111827",
                          color: "#ffffff",
                        }}
                      >
                        Sljedeća
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div
            className="overflow-hidden rounded-2xl border shadow-sm"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e5e7eb",
            }}
          >
            <div
              className="border-b px-6 py-5"
              style={{ borderColor: "#e5e7eb" }}
            >
              <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
                Servisi na karti
              </h2>

              <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
                Ukupno servisa: {services.length}
              </p>
            </div>

            {services.length === 0 ? (
              <div className="p-6">
                <p style={{ color: "#6b7280" }}>
                  Trenutno nema servisa na karti.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead style={{ backgroundColor: "#f9fafb" }}>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Naziv
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Grad
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Telefon
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Datum
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm font-semibold"
                        style={{ color: "#374151" }}
                      >
                        Akcije
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-t"
                        style={{ borderColor: "#e5e7eb" }}
                      >
                        <td
                          className="px-6 py-4 text-sm font-semibold"
                          style={{ color: "#111827" }}
                        >
                          {service.name || "—"}
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#374151" }}
                        >
                          {service.city || "—"}
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#374151" }}
                        >
                          {service.phone || "—"}
                        </td>
                        <td
                          className="whitespace-nowrap px-6 py-4 text-sm"
                          style={{ color: "#6b7280" }}
                        >
                          {service.created_at
                            ? new Intl.DateTimeFormat("hr-HR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }).format(new Date(service.created_at))
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <form action={deleteService}>
                            <input
                              type="hidden"
                              name="serviceId"
                              value={service.id}
                            />
                            <button
                              type="submit"
                              className="rounded-lg px-4 py-2 text-sm font-semibold"
                              style={{
                                backgroundColor: "#dc2626",
                                color: "#ffffff",
                              }}
                            >
                              Obriši servis
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}