import type { Metadata, Viewport } from "next";
import { DM_Sans, Permanent_Marker, Stardos_Stencil } from "next/font/google";
import { QueryProvider } from "@/shared/config/QueryProvider";
import "./globals.css";

const brand = Stardos_Stencil({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
  weight: ["400", "700"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const tag = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-tag",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Capital Gang",
    template: "%s · Capital Gang",
  },
  description:
    "Clothing · Tattoo · Culture — unión entre la calle, la tinta y la comunidad.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/brand/isotipo.png", type: "image/png" }],
    apple: [{ url: "/brand/isotipo.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Capital Gang",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#F4F2EC" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${brand.variable} ${body.variable} ${tag.variable}`}
    >
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
                if (meta) meta.setAttribute("content", dark ? "#0A0A0A" : "#F4F2EC");
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
