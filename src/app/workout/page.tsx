import type { Metadata } from "next";
import { WorkoutBuilder } from "@/components/WorkoutBuilder";

export const metadata: Metadata = { title: "My workout" };

export default function WorkoutPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">My workout</h1>
      <WorkoutBuilder />
    </div>
  );
}
