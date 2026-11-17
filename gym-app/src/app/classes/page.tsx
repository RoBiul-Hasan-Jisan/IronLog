import type { Metadata } from "next";
import { ClassTimetable } from "@/components/ClassTimetable";

export const metadata: Metadata = { title: "Class timetable" };

export default function Page() {
  return (
    <div className="pub-page">
      <h1 className="pub-title">Class timetable</h1>
      <p className="pub-lead">Book your spot in any class. Members can cancel up to 2 hours before it starts.</p>
      <ClassTimetable days={14} />
    </div>
  );
}
