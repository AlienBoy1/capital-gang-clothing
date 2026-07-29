import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { QueryProvider } from "@/shared/config/QueryProvider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Capital Gang Clothing",
    template: "%s · Capital Gang Clothing",
  },
  description:
    "Ropa urbana, tattoo shop y galería profesional de tatuajes — una sola identidad premium.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Capital Gang",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem("cgc-theme");
                const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
                const root = document.documentElement;
                root.classList.toggle("dark", dark);
                root.classList.toggle("light", !dark);
                root.style.colorScheme = dark ? "dark" : "light";
                const meta = document.querySelector('meta[name="theme-color"]');
                if (meta) meta.setAttribute("content", dark ? "#0b0b0b" : "#f4f2ec");
              } catch (error) {}
            `,
          }}
        />
      </head>
      <body className="font-body text-fg">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
