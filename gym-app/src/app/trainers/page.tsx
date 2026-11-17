import type { Metadata } from "next";
import Link from "next/link";
import { TrainerCards } from "@/components/TrainerCards";

export const metadata: Metadata = { title: "Our trainers" };

export default function Page() {
  return (
    <div className="pub-page">
      <h1 className="pub-title">Our trainers</h1>
      <p className="pub-lead">Qualified coaches who will help you train safely and reach your goal.</p>
      <TrainerCards />
      <p style={{ marginTop: 32 }}>
        Want one-to-one coaching? <Link href="/contact">Get in touch</Link>.
      </p>
    </div>
  );
}
