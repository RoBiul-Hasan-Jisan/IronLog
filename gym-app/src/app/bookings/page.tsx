import type { Metadata } from "next";
import { BookingsView } from "@/components/BookingsView";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return (
    <RequireAuth>
      <BookingsView />
    </RequireAuth>
  );
}
