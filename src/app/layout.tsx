import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

// Cogapp brand faces, shared with dagster-dashboard: Civil (ABC Dinamo) for
// body and UI, Untitled Serif (Klim) for headings.
const civil = localFont({
  variable: "--font-civil",
  display: "optional",
  src: [
    { path: "../fonts/civil/CivilPremium-Light2.woff2", weight: "300" },
    {
      path: "../fonts/civil/CivilPremium-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    { path: "../fonts/civil/CivilPremium-Regular2.woff2", weight: "400" },
    {
      path: "../fonts/civil/CivilPremium-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
    { path: "../fonts/civil/CivilPremium-Medium2.woff2", weight: "500" },
    {
      path: "../fonts/civil/CivilPremium-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    { path: "../fonts/civil/CivilPremium-SemiBold2.woff2", weight: "600" },
    {
      path: "../fonts/civil/CivilPremium-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    { path: "../fonts/civil/CivilPremium-Bold2.woff2", weight: "700" },
    {
      path: "../fonts/civil/CivilPremium-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const untitledSerif = localFont({
  variable: "--font-untitled-serif",
  display: "optional",
  src: [
    {
      path: "../fonts/untitled-serif/untitled-serif-regular.woff2",
      weight: "400",
    },
    {
      path: "../fonts/untitled-serif/untitled-serif-regular-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/untitled-serif/untitled-serif-bold.woff2",
      weight: "700",
    },
  ],
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "Storiiies Editor | Cogapp",
  description: "Create and edit IIIF stories with annotations",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en" className={`${civil.variable} ${untitledSerif.variable}`}>
    <body>
      <LanguageProvider>{children}</LanguageProvider>
    </body>
  </html>
);

export default RootLayout;
