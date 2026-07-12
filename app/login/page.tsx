"use client";

import { useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import { t } from "@/app/translations";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function register() {
    if (!name.trim()) return alert(t("nameRequired") || "Upiši ime i prezime.");
    if (!email.trim()) return alert(t("emailRequired") || "Upiši email.");
    if (!password.trim()) return alert(t("passwordRequired") || "Upiši lozinku.");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return alert(error.message);

    const userId = data.user?.id;

    if (userId) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        name,
        phone: phone.trim() || null,
      });

      if (profileError) return alert(profileError.message);
    }

    alert(t("registrationSuccess") || "Registracija uspješna.");
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert(error.message);

    router.push("/");
    router.refresh();
  }

  async function resetPassword() {
    if (!email) return alert(t("enterEmailFirst") || "Prvo upiši email.");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) return alert(error.message);

    alert(t("passwordResetSent") || "Poslan je email za reset lozinke.");
  }

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "40px auto" }}>
      <h1>
        {t("login")} / {t("register")}
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
      >
        <input
          placeholder={`${t("name")} *`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "14px", fontSize: "18px" }}
        />

        <br /><br />

        <input
          placeholder={t("optionalPhone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", padding: "14px", fontSize: "18px" }}
        />

        <br /><br />

        <input
          type="email"
          placeholder={`${t("email")} *`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "14px", fontSize: "18px" }}
        />

        <br /><br />

        <input
          type="password"
          placeholder={`${t("password")} *`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "14px", fontSize: "18px" }}
        />

        <br /><br />

        <button
          type="submit"
          style={{
            padding: "14px 22px",
            marginRight: "10px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {t("login")}
        </button>

        <button
          type="button"
          onClick={register}
          style={{
            padding: "14px 22px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {t("register")}
        </button>

        <br /><br />

        <button
          type="button"
          onClick={resetPassword}
          style={{
            background: "transparent",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {t("forgotPassword")}
        </button>
      </form>
    </div>
  );
}