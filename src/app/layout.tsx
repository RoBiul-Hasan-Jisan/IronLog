import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { WorkoutProvider } from "@/components/WorkoutProvider";
import { ATTRIBUTION } from "@/lib/format";

export const metadata: Metadata = {
  title: { default: "IronLog — workouts with steps & timers", template: "%s · IronLog" },
  description:
    "Browse 1,300+ exercises with animations, step-by-step instructions and timing. Build a workout and follow it with set and rest timers.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <WorkoutProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-24 text-xs text-zinc-500 md:pb-8">
            Exercise animations and images {ATTRIBUTION}. Exercise data from the open-source{" "}
            <a
              className="underline hover:text-zinc-300"
              href="https://github.com/plataformafitness/exercises-library"
              target="_blank"
              rel="noreferrer"
            >
              plataformafitness/exercises-library
            </a>
            .
          </footer>
        </WorkoutProvider>
      </body>
    </html>
  );
}
