"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { t } from "./translations";

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  let mounted = true;

  async function checkAdmin(userId: string | null) {
    if (!userId) {
      if (mounted) {
        setIsAdmin(false);
      }
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", userId)
      .single();

    if (!mounted) return;

    if (error) {
      console.error("Admin provjera nije uspjela:", error);
      setIsAdmin(false);
      return;
    }

    const admin =
      data?.is_admin === true ||
      data?.role === "admin";

    setIsAdmin(admin);
  }

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (!mounted) return;

    if (error || !data.user) {
      setEmail(null);
      setIsAdmin(false);
      return;
    }

    setEmail(data.user.email || null);
    await checkAdmin(data.user.id);
  }

  loadUser();

  const { data: listener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!mounted) return;

      const user = session?.user ?? null;

      setEmail(user?.email || null);
      await checkAdmin(user?.id || null);
    }
  );

  return () => {
    mounted = false;
    listener.subscription.unsubscribe();
  };
}, []);

  async function logout() {
    await supabase.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  const headerIconButtonStyle = {
    height: "44px",
    minWidth: "44px",
    padding: "0 12px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "linear-gradient(180deg, var(--card), rgba(255,255,255,0.04))",
    color: "var(--text)",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.16)",
    transition: "all 0.22s ease",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const menuButtonStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "linear-gradient(180deg, var(--card), rgba(255,255,255,0.04))",
    color: "var(--text)",
    cursor: "pointer",
    textAlign: "left" as const,
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.22s ease",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  };

  return (
    <>
      <header
        style={{
          padding: "8px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--text)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="TruckDiag AI"
            style={{
              height: "70px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={headerIconButtonStyle}>
            <LanguageSwitcher />
          </div>

          <div style={headerIconButtonStyle}>
            <ThemeSwitcher />
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            style={{
              ...headerIconButtonStyle,
              fontSize: "22px",
            }}
          >
            ☰
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(3px)",
            zIndex: 90,
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(50vw, 360px)",
          minWidth: "280px",
          background: "var(--card)",
          color: "var(--text)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-12px 0 35px rgba(0,0,0,0.35)",
          zIndex: 100,
          padding: "18px",
          transform: menuOpen ? "translateX(0)" : "translateX(110%)",
          transition: "transform 0.28s ease",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <strong style={{ fontSize: "18px" }}>{t("menu")}</strong>

          <button
            onClick={() => setMenuOpen(false)}
            style={{
              ...headerIconButtonStyle,
               width: "40px",
  height: "40px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "24px",
  color: "var(--text)",
            }}
          >
            ✕
          </button>
        </div>

        {email && (
          <p
            style={{
              fontSize: "13px",
              opacity: 0.75,
              wordBreak: "break-all",
              margin: 0,
            }}
          >
            {email}
          </p>
        )}

        <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
          <Link href="/profile" onClick={() => setMenuOpen(false)}>
            <button style={menuButtonStyle}>{t("profileMenu")}</button>
          </Link>

          <Link href="/add" onClick={() => setMenuOpen(false)}>
          <button style={menuButtonStyle}>{t("addFaultMenu")}</button>
          </Link>

          <Link href="/services" onClick={() => setMenuOpen(false)}>
           <button style={menuButtonStyle}>{t("servicesMenu")}</button>
          </Link>

          <Link href="/ai" onClick={() => setMenuOpen(false)}>
           <button style={menuButtonStyle}>{t("aiToolsMenu")}</button>
          </Link>
          
          {isAdmin && (
  <Link href="/admin" onClick={() => setMenuOpen(false)}>
    <button
      style={{
        ...menuButtonStyle,
        background:
          "linear-gradient(180deg, #f59e0b, #d97706)",
        color: "#ffffff",
        border: "1px solid #fbbf24",
      }}
    >
      🛡️ Admin dashboard
    </button>
  </Link>
)}

          {email ? (
            <button onClick={logout} style={menuButtonStyle}>
              {t("logout")}
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <button style={menuButtonStyle}>{t("login")}</button>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}