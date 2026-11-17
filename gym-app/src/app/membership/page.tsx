import type { Metadata } from "next";
import { MembershipView } from "@/components/MembershipView";

export const metadata: Metadata = { title: "Membership" };

export default function Page() {
  return <MembershipView />;
}
