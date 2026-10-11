import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Ljuska from "@/components/Ljuska";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: "Lovački dnevnik", template: "%s · Lovački dnevnik" },
  description: "Evidencija izlazaka, odstrela, lovišta i dozvola – s prognozom vjetra i solunarnim kalendarom.",
  applicationName: "Lovački dnevnik",
  appleWebApp: { capable: true, title: "Lovni dnevnik", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b100c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Postavlja temu prije prvog iscrtavanja kako ne bi bljesnula pogrešna boja.
const skriptaTeme = `try{var t=localStorage.getItem("lovacki-dnevnik:tema")||"tamna";if(t==="auto")t=matchMedia("(prefers-color-scheme: dark)").matches?"tamna":"svijetla";document.documentElement.dataset.tema=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="hr"
      data-tema="tamna"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${fraunces.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skriptaTeme }} />
      </head>
      <body>
        <Ljuska>{children}</Ljuska>
      </body>
    </html>
  );
}
