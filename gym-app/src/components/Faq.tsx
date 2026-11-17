import { FAQ } from "@/lib/gym";

export function Faq() {
  return (
    <div className="faq">
      {FAQ.map((f) => (
        <details key={f.q} className="faq-item">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
