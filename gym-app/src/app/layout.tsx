import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Narrow } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { WorkoutProvider } from "@/components/WorkoutProvider";

// Archivo for reading text, its narrow cut for headlines and big numbers.
const body = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const display = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo-narrow",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "IronLog: workouts with steps and timers", template: "%s · IronLog" },
  description:
    "Browse 1,300+ exercises with animations, step-by-step instructions and timing. Build a workout and follow it with set and rest timers.",
};

export const viewport: Viewport = {
  themeColor: "#e9ebee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>
        <WorkoutProvider>
          <AppShell>{children}</AppShell>
        </WorkoutProvider>
      </body>
    </html>
  );
}
