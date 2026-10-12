import type { Metadata } from "next";
import { WorkoutPlayer } from "@/components/WorkoutPlayer";

export const metadata: Metadata = { title: "Workout in progress" };

export default function PlayPage() {
  return <WorkoutPlayer />;
}
