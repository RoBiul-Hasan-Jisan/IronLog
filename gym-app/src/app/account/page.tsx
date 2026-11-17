import type { Metadata } from "next";
import { AccountView } from "@/components/AccountView";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Account" };

export default function Page() {
  return (
    <RequireAuth>
      <AccountView />
    </RequireAuth>
  );
}
