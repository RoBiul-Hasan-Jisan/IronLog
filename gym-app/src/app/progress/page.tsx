import type { Metadata } from "next";
import { ProgressView } from "@/components/ProgressView";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return (
    <RequireAuth>
      <ProgressView />
    </RequireAuth>
  );
}
