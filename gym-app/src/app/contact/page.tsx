import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { LeadForm } from "@/components/LeadForm";
import { GYM } from "@/lib/gym";

export const metadata: Metadata = { title: "Contact and free trial" };

export default function Page() {
  return (
    <div className="pub-page">
      <h1 className="pub-title">Contact and free trial</h1>
      <p className="pub-lead">Tell us what you are looking for and the team will reply within one working day.</p>
      <div className="two-col contact">
        <LeadForm />
        <section className="panel-box">
          <h2 className="h2">Visit us</h2>
          <p>{GYM.address}</p>
          <p>
            {GYM.phone}
            <br />
            {GYM.email}
          </p>
          <h3 className="fgroup-title" style={{ marginTop: 20 }}>
            Opening hours
          </h3>
          <ul className="kv">
            {GYM.hours.map((h) => (
              <li key={h.days}>
                <span>{h.days}</span>
                <strong>{h.time}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <h2 className="pub-h2" style={{ marginTop: 56 }}>
        Frequently asked questions
      </h2>
      <Faq />
    </div>
  );
}
