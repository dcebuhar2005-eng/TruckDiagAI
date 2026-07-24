"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import Rating from "./Rating";
import { t } from "./translations";

type VehicleType = "all" | "truck" | "van" | "car";

export default function FaultList({ data }: any) {
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("all");
  const [faults, setFaults] = useState<any[]>(data || []);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const perPage = 9;

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      const { data: profileData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error(
          "Greška kod učitavanja profila:",
          profilesError.message
        );
      } else {
        setProfiles(profileData || []);
      }

      const { data: faultData, error: faultsError } = await supabase
        .from("fault_cases")
        .select("*")
        .order("id", { ascending: false });

      if (faultsError) {
        console.error(
          "Greška kod učitavanja kvarova:",
          faultsError.message
        );

        setFaults(data || []);
      } else {
        setFaults(faultData || []);
      }

      setLoading(false);
    }

    loadData();
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [search, vehicleType]);

  const filtered = faults.filter((item: any) => {
    const searchableText = `
      ${item.brand || ""}
      ${item.model || ""}
      ${item.engine || ""}
      ${item.final_fault || ""}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(
      search.trim().toLowerCase()
    );

    const matchesVehicleType =
      vehicleType === "all" || item.vehicle_type === vehicleType;

    return matchesSearch && matchesVehicleType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const visibleFaults = filtered.slice(start, start + perPage);

  function getProfile(userId: string) {
    return profiles.find((profile: any) => profile.id === userId);
  }

  function getVehicleIcon(type: string | null) {
    if (type === "truck") return "🚛";
    if (type === "van") return "🚐";
    if (type === "car") return "🚗";

    return "🚘";
  }

  function getVehicleLabel(type: string | null) {
    if (type === "truck") return t("truck");
    if (type === "van") return t("van");
    if (type === "car") return t("car");

    return null;
  }

  async function deleteFault(id: number) {
    const confirmDelete = window.confirm(
      "Jesi siguran da želiš obrisati ovaj kvar?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("fault_cases")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Greška kod brisanja: " + error.message);
      return;
    }

    setFaults((currentFaults) =>
      currentFaults.filter((item: any) => item.id !== id)
    );

    alert("Kvar obrisan!");
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
        }}
      >
        {t("loadingFaults")}
      </div>
    );
  }

  const filterButtons: {
    value: VehicleType;
    label: string;
  }[] = [
    {
      value: "all",
      label: `🌍 ${t("allVehicles")}`,
    },
    {
      value: "truck",
      label: `🚛 ${t("trucks")}`,
    },
    {
      value: "van",
      label: `🚐 ${t("vans")}`,
    },
    {
      value: "car",
      label: `🚗 ${t("cars")}`,
    },
  ];

  return (
    <div>
      {/* PRETRAGA */}
      <input
        type="text"
        placeholder={t("searchFault")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "14px",
          width: "100%",
          marginBottom: "12px",
          borderRadius: "8px",
          fontSize: "18px",
          boxSizing: "border-box",
        }}
      />

      {/* FILTER VRSTE VOZILA */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "18px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {filterButtons.map((option) => {
          const isActive = vehicleType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setVehicleType(option.value)}
              style={{
                flexShrink: 0,
                padding: "10px 14px",
                borderRadius: "999px",
                border: isActive
                  ? "1px solid #16a34a"
                  : "1px solid var(--border)",
                background: isActive ? "#16a34a" : "var(--card)",
                color: isActive ? "#ffffff" : "var(--text)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 4px 14px rgba(22, 163, 74, 0.3)"
                  : "none",
                transition: "all 0.2s ease",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* BROJ REZULTATA */}
      <p
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          opacity: 0.75,
        }}
      >
        {t("faultsFound")}: <b>{filtered.length}</b>
      </p>

      {/* LISTA KVAROVA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "15px",
        }}
      >
        {visibleFaults.map((item: any) => {
          const isOwner =
            currentUserId !== null && item.user_id === currentUserId;

          const profile = getProfile(item.user_id);

          const shortFault =
            item.final_fault?.length > 70
              ? item.final_fault.substring(0, 70) + "..."
              : item.final_fault;

          const itemVehicleLabel = getVehicleLabel(item.vehicle_type);
          const itemVehicleIcon = getVehicleIcon(item.vehicle_type);

          return (
            <div
              key={item.id}
              className="card-hover"
              style={{
                padding: "14px",
                borderRadius: "12px",
                minHeight: "330px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt="Slika kvara"
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      marginBottom: "10px",
                      border: "1px solid var(--border)",
                    }}
                  />
                )}

                <h2
                  style={{
                    fontSize: "20px",
                    marginBottom: "8px",
                  }}
                >
                  {itemVehicleIcon} {item.brand} {item.model}
                </h2>

                {itemVehicleLabel && (
                  <span
                    style={{
                      display: "inline-block",
                      marginBottom: "10px",
                      padding: "5px 9px",
                      borderRadius: "999px",
                      background: "rgba(37, 99, 235, 0.12)",
                      border: "1px solid rgba(37, 99, 235, 0.3)",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {itemVehicleIcon} {itemVehicleLabel}
                  </span>
                )}

                <p style={{ marginBottom: "6px" }}>
                  <b>⚙️ {t("engine")}:</b> {item.engine || "-"}
                </p>

                <p style={{ marginBottom: "8px" }}>
                  <b>❗ {t("fault")}:</b> {shortFault || "-"}
                </p>

                <Rating faultId={item.id} />

                {item.user_id && (
                  <Link
                    href={`/user/${item.user_id}`}
                    style={{
                      textDecoration: "none",
                    }}
                  >
                    <p
                      style={{
                        cursor: "pointer",
                        color: "#60a5fa",
                        fontWeight: "bold",
                        marginTop: "8px",
                        fontSize: "14px",
                      }}
                    >
                      👤 {profile?.name || t("unknownUser")}
                    </p>
                  </Link>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                <Link href={`/fault/${item.id}`}>
                  <button
                    type="button"
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {t("openDetails")}
                  </button>
                </Link>

                {isOwner && (
                  <>
                    <Link href={`/edit/${item.id}`}>
                      <button
                        type="button"
                        style={{
                          backgroundColor: "#2563eb",
                          color: "white",
                          border: "none",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        {t("edit")}
                      </button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteFault(item.id)}
                      style={{
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      {t("delete")}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleFaults.length === 0 && (
        <div
          style={{
            padding: "30px 15px",
            textAlign: "center",
            opacity: 0.75,
          }}
        >
          {t("noFaultsForVehicle")}
        </div>
      )}

      {filtered.length > perPage && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "25px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setPage((currentPage) => Math.max(1, currentPage - 1))
            }
            disabled={page === 1}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ◀ {t("previous")}
          </button>

          <b>
            {page} / {totalPages}
          </b>

          <button
            type="button"
            onClick={() =>
              setPage((currentPage) =>
                Math.min(totalPages, currentPage + 1)
              )
            }
            disabled={page === totalPages}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            {t("next")} ▶
          </button>
        </div>
      )}
    </div>
  );
}