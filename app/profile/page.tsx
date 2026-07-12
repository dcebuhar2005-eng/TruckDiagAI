"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      alert("Greška kod učitavanja profila: " + error.message);
      return;
    }

    setName(data.name || "");
    setPhone(data.phone || "");
    setCompany(data.company || "");
    setCity(data.city || "");
    setBio(data.bio || "");
  }

  async function saveProfile() {
    if (!userId || saving) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        phone,
        company,
        city,
        bio,
      })
      .eq("id", userId);

    if (error) {
      alert("Greška kod spremanja profila: " + error.message);
      setSaving(false);
      return;
    }

    alert("Profil spremljen!");
    setSaving(false);
  }

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>👤 Moj profil</h1>

      <input
        placeholder="Ime i prezime"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "14px", fontSize: "18px" }}
      />
      <br /><br />

      <input
        placeholder="Telefon"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ width: "100%", padding: "14px", fontSize: "18px" }}
      />
      <br /><br />

      <input
        placeholder="Firma / radionica"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        style={{ width: "100%", padding: "14px", fontSize: "18px" }}
      />
      <br /><br />

      <input
        placeholder="Grad"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={{ width: "100%", padding: "14px", fontSize: "18px" }}
      />
      <br /><br />

      <textarea
        placeholder="Opis profila / specijalizacija"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={5}
        style={{ width: "100%", padding: "14px", fontSize: "18px" }}
      />
      <br /><br />

      <button
        onClick={saveProfile}
        disabled={saving}
        style={{
          background: saving ? "#777" : "#16a34a",
          color: "white",
          border: "none",
          padding: "14px 22px",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "⏳ SPREMAM..." : "💾 SPREMI PROFIL"}
      </button>
    </div>
  );
}