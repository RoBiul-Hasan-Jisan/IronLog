import type { Metadata } from "next";
import { WorkoutBuilder } from "@/components/WorkoutBuilder";

export const metadata: Metadata = { title: "My workout" };

export default function WorkoutPage() {
  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">My workout</h1>
      </div>
      <WorkoutBuilder />
    </div>
  );
}
