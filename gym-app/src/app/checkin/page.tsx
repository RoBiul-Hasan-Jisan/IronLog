import type { Metadata } from "next";
import { CheckInView } from "@/components/CheckInView";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Check-in" };

export default function Page() {
  return (
    <RequireAuth>
      <CheckInView />
    </RequireAuth>
  );
}
