"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLanguage } from "@/app/translations";

type Language = "hr" | "en" | "de" | "it";

const content = {
  hr: {
    back: "Natrag na TruckDiag AI",
    title: "Instaliraj TruckDiag AI",
    intro:
      "Dodaj TruckDiag AI na početni zaslon i koristi ga kao običnu aplikaciju, bez stalnog otvaranja web-linka.",

    iphone: "iPhone",
    iphoneStep1Title: "Otvori TruckDiag AI u Safariju",
    iphoneStep1Text:
      "Na dnu Safarija pritisni gumb za dijeljenje.",
    iphoneStep1Alt: "Safari gumb za dijeljenje",

    iphoneStep2Title: "Odaberi Add to Home Screen",
    iphoneStep2Text:
      "U izborniku pronađi i pritisni Add to Home Screen.",
    iphoneStep2Alt:
      "Add to Home Screen opcija na iPhoneu",

    iphoneStep3Title: "Potvrdi dodavanje",
    iphoneStep3Text:
      "Pritisni Add. TruckDiag AI će se pojaviti na početnom zaslonu poput obične aplikacije.",

    android: "Android",
    androidStep1:
      "Otvori TruckDiag AI u pregledniku Chrome.",
    androidStep2:
      "Pritisni tri točkice ⋮ gore desno.",
    androidStep3:
      "Odaberi Install app ili Add to Home Screen.",
    androidStep4: "Potvrdi instalaciju.",

    done: "Gotovo",
    doneText:
      "Nakon instalacije otvaraj TruckDiag AI izravno preko ikone na početnom zaslonu.",
  },

  en: {
    back: "Back to TruckDiag AI",
    title: "Install TruckDiag AI",
    intro:
      "Add TruckDiag AI to your Home Screen and use it like a regular application without opening the web link every time.",

    iphone: "iPhone",
    iphoneStep1Title: "Open TruckDiag AI in Safari",
    iphoneStep1Text:
      "Tap the Share button at the bottom of Safari.",
    iphoneStep1Alt: "Safari Share button",

    iphoneStep2Title: "Select Add to Home Screen",
    iphoneStep2Text:
      "Find and tap Add to Home Screen in the menu.",
    iphoneStep2Alt:
      "Add to Home Screen option on iPhone",

    iphoneStep3Title: "Confirm installation",
    iphoneStep3Text:
      "Tap Add. TruckDiag AI will appear on your Home Screen like a regular application.",

    android: "Android",
    androidStep1: "Open TruckDiag AI in Chrome.",
    androidStep2:
      "Tap the three dots ⋮ in the top-right corner.",
    androidStep3:
      "Select Install app or Add to Home Screen.",
    androidStep4: "Confirm the installation.",

    done: "Done",
    doneText:
      "After installation, open TruckDiag AI directly from the icon on your Home Screen.",
  },

  de: {
    back: "Zurück zu TruckDiag AI",
    title: "TruckDiag AI installieren",
    intro:
      "Füge TruckDiag AI zum Home-Bildschirm hinzu und verwende es wie eine normale App, ohne jedes Mal den Web-Link zu öffnen.",

    iphone: "iPhone",
    iphoneStep1Title: "TruckDiag AI in Safari öffnen",
    iphoneStep1Text:
      "Tippe unten in Safari auf die Teilen-Schaltfläche.",
    iphoneStep1Alt: "Safari Teilen-Schaltfläche",

    iphoneStep2Title:
      "Zum Home-Bildschirm hinzufügen auswählen",
    iphoneStep2Text:
      "Suche im Menü nach Zum Home-Bildschirm hinzufügen und tippe darauf.",
    iphoneStep2Alt:
      "Option Zum Home-Bildschirm hinzufügen auf dem iPhone",

    iphoneStep3Title: "Hinzufügen bestätigen",
    iphoneStep3Text:
      "Tippe auf Hinzufügen. TruckDiag AI erscheint anschließend wie eine normale App auf deinem Home-Bildschirm.",

    android: "Android",
    androidStep1: "Öffne TruckDiag AI in Chrome.",
    androidStep2:
      "Tippe oben rechts auf die drei Punkte ⋮.",
    androidStep3:
      "Wähle App installieren oder Zum Startbildschirm hinzufügen.",
    androidStep4: "Bestätige die Installation.",

    done: "Fertig",
    doneText:
      "Nach der Installation kannst du TruckDiag AI direkt über das Symbol auf deinem Home-Bildschirm öffnen.",
  },

  it: {
    back: "Torna a TruckDiag AI",
    title: "Installa TruckDiag AI",
    intro:
      "Aggiungi TruckDiag AI alla schermata Home e utilizzala come una normale applicazione senza aprire ogni volta il link web.",

    iphone: "iPhone",
    iphoneStep1Title: "Apri TruckDiag AI in Safari",
    iphoneStep1Text:
      "Premi il pulsante Condividi nella parte inferiore di Safari.",
    iphoneStep1Alt: "Pulsante Condividi di Safari",

    iphoneStep2Title:
      "Seleziona Aggiungi alla schermata Home",
    iphoneStep2Text:
      "Trova e premi Aggiungi alla schermata Home nel menu.",
    iphoneStep2Alt:
      "Opzione Aggiungi alla schermata Home su iPhone",

    iphoneStep3Title: "Conferma l'aggiunta",
    iphoneStep3Text:
      "Premi Aggiungi. TruckDiag AI apparirà sulla schermata Home come una normale applicazione.",

    android: "Android",
    androidStep1: "Apri TruckDiag AI in Chrome.",
    androidStep2:
      "Premi i tre puntini ⋮ in alto a destra.",
    androidStep3:
      "Seleziona Installa app o Aggiungi alla schermata Home.",
    androidStep4: "Conferma l'installazione.",

    done: "Fatto",
    doneText:
      "Dopo l'installazione, apri TruckDiag AI direttamente dall'icona sulla schermata Home.",
  },
};

export default function InstallPage() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    function updateLanguage() {
      const currentLanguage = getLanguage();

      if (
        currentLanguage === "hr" ||
        currentLanguage === "en" ||
        currentLanguage === "de" ||
        currentLanguage === "it"
      ) {
        setLanguage(currentLanguage);
      }
    }

    updateLanguage();

    window.addEventListener("storage", updateLanguage);
    window.addEventListener("languageChanged", updateLanguage);

    return () => {
      window.removeEventListener("storage", updateLanguage);
      window.removeEventListener(
        "languageChanged",
        updateLanguage
      );
    };
  }, []);

  const text = content[language];

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px 18px 140px",
      }}
    >
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginBottom: "20px",
          color: "#60a5fa",
          textDecoration: "none",
          fontWeight: "bold",
        }}
      >
        ← {text.back}
      </Link>

      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>
          📲 {text.title}
        </h1>

        <p
          style={{
            fontSize: "17px",
            lineHeight: 1.6,
            marginBottom: 0,
          }}
        >
          {text.intro}
        </p>
      </section>

      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          🍎 {text.iphone}
        </h2>

        <div style={{ marginBottom: "32px" }}>
          <h3>1. {text.iphoneStep1Title}</h3>

          <p>{text.iphoneStep1Text} ⬆️</p>

          <Image
          src="/install/iphone-step-1(1).jpg"
            alt={text.iphoneStep1Alt}
            width={707}
            height={1536}
            priority
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "390px",
              display: "block",
              margin: "16px auto 0",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <h3>2. {text.iphoneStep2Title}</h3>

          <p>{text.iphoneStep2Text}</p>

          <Image
           src="/install/iphone-step-2(1).jpg"
            alt={text.iphoneStep2Alt}
            width={1320}
            height={2249}
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "390px",
              display: "block",
              margin: "16px auto 0",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        <div>
          <h3>3. {text.iphoneStep3Title}</h3>
          <p>{text.iphoneStep3Text}</p>
        </div>
      </section>

      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          🤖 {text.android}
        </h2>

        {[text.androidStep1, text.androidStep2,
          text.androidStep3, text.androidStep4].map(
          (step, index) => (
            <div
              key={step}
              style={{
                padding: "14px",
                marginBottom: "12px",
                borderRadius: "12px",
                background:
                  "rgba(37, 99, 235, 0.10)",
              }}
            >
              <strong>{index + 1}.</strong> {step}
            </div>
          )
        )}
      </section>

      <section
        style={{
          padding: "20px",
          borderRadius: "16px",
          background: "#16a34a",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          ✅ {text.done}
        </h2>

        <p style={{ marginBottom: 0 }}>
          {text.doneText}
        </p>
      </section>
    </main>
  );
}