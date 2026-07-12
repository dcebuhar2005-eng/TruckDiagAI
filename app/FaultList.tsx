"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import Rating from "./Rating";
import { t } from "./translations";

export default function FaultList({ data }: any) {
  const [search, setSearch] = useState("");
  const [faults, setFaults] = useState(data);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const perPage = 9;

  useEffect(() => {
    async function loadUserAndProfiles() {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*");

      setProfiles(profileData || []);
    }

    loadUserAndProfiles();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = faults.filter((item: any) =>
    `${item.brand} ${item.model} ${item.engine} ${item.final_fault}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const visibleFaults = filtered.slice(start, start + perPage);

  function getProfile(userId: string) {
    return profiles.find((profile: any) => profile.id === userId);
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

    setFaults(faults.filter((item: any) => item.id !== id));
    alert("Kvar obrisan!");
  }

  return (
    <div>
      <input
        type="text"
        placeholder={t("searchFault")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "14px",
          width: "100%",
          marginBottom: "20px",
          borderRadius: "8px",
          fontSize: "18px",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "15px",
        }}
      >
        {visibleFaults.map((item: any) => {
          const isOwner = currentUserId && item.user_id === currentUserId;
          const profile = getProfile(item.user_id);

          const shortFault =
            item.final_fault?.length > 70
              ? item.final_fault.substring(0, 70) + "..."
              : item.final_fault;

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

                <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
                  🚛 {item.brand} {item.model}
                </h2>

                <p style={{ marginBottom: "6px" }}>
                  <b>⚙️ {t("engine")}:</b> {item.engine || "-"}
                </p>

                <p style={{ marginBottom: "8px" }}>
                  <b>❗ {t("fault")}:</b> {shortFault || "-"}
                </p>

                <Rating faultId={item.id} />

                <Link href={`/user/${item.user_id}`}>
                  <p
                    style={{
                      cursor: "pointer",
                      color: "#60a5fa",
                      fontWeight: "bold",
                      marginTop: "8px",
                      fontSize: "14px",
                    }}
                  >
                    👤 {profile?.name || "Nepoznat korisnik"}
                  </p>
                </Link>
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
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            cursor: page === 1 ? "not-allowed" : "pointer",
            opacity: page === 1 ? 0.5 : 1,
          }}
        >
          ◀ Prethodna
        </button>

        <b>
          {page} / {totalPages}
        </b>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            cursor: page === totalPages ? "not-allowed" : "pointer",
            opacity: page === totalPages ? 0.5 : 1,
          }}
        >
          Sljedeća ▶
        </button>
      </div>
    </div>
  );
}