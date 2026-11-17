import type { Metadata } from "next";
import Link from "next/link";
import { ClassTimetable } from "@/components/ClassTimetable";
import { Faq } from "@/components/Faq";
import { NextClasses } from "@/components/NextClasses";
import { PlansPreview } from "@/components/PlansPreview";
import { Plate } from "@/components/Plate";
import { TrainerCards } from "@/components/TrainerCards";
import { exerciseIndex } from "@/lib/data";
import { GYM } from "@/lib/gym";

export const metadata: Metadata = {
  title: { absolute: `${GYM.name}: classes, coaching and training tools` },
  description: `${GYM.tagline} Group classes, expert trainers, a guided workout library and progress tracking.`,
};

const FEATURES = [
  { title: "Group classes", text: "Strength, HIIT, yoga, boxing and cycling every day. Book your spot online and cancel up to 2 hours before.", href: "/classes", cta: "See timetable" },
  { title: "Expert coaches", text: "Qualified trainers for beginners and lifters alike, from technique coaching to one-to-one programmes.", href: "/trainers", cta: "Meet the team" },
  { title: "Guided workout library", text: `${exerciseIndex.length.toLocaleString()} exercises with animations, numbered steps and timers. Build a session and follow it on your phone.`, href: "/train", cta: "Open the library" },
  { title: "Track your progress", text: "Log weight and measurements, see charts, and keep a history of every workout you finish.", href: "/progress", cta: "See how it works" },
  { title: "Fast check-in", text: "Show your personal code at the front desk. We track your visits and your weekly streak.", href: "/register", cta: "Create account" },
  { title: "Gym shop", text: "Supplements, gear and apparel, ready to collect at the front desk or delivered.", href: "/shop", cta: "Visit the shop" },
];

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <Plate bodyPart="chest" size={18} hole="var(--paper)" />
            Open 7 days a week
          </p>
          <h1 className="hero-title">{GYM.tagline}</h1>
          <p className="hero-text">
            Group classes, real coaches and a training app that shows you exactly what to do, how many sets, and how long to rest. Everything in one membership.
          </p>
          <div className="hero-cta">
            <Link href="/register" className="btn btn--primary btn--lg">
              Join now
            </Link>
            <Link href="/contact" className="btn btn--secondary btn--lg">
              Book a free trial
            </Link>
          </div>
          <ul className="hero-points">
            <li>No joining fee on any plan</li>
            <li>Cancel classes online</li>
            <li>Beginner friendly</li>
          </ul>
        </div>
        <NextClasses />
      </section>

      <section className="pub-section" aria-labelledby="why">
        <h2 id="why" className="pub-h2">
          Everything you need to train properly
        </h2>
        <ul className="features">
          {FEATURES.map((f) => (
            <li key={f.title} className="feature">
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <Link href={f.href}>{f.cta} →</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="pub-section pub-section--tint" aria-labelledby="classes">
        <div className="pub-head">
          <h2 id="classes" className="pub-h2">
            This week&apos;s classes
          </h2>
          <Link href="/classes" className="btn btn--secondary">
            Full timetable
          </Link>
        </div>
        <ClassTimetable days={3} limit={8} filters={false} />
      </section>

      <section className="pub-section" aria-labelledby="plans">
        <div className="pub-head">
          <h2 id="plans" className="pub-h2">
            Simple memberships
          </h2>
        </div>
        <PlansPreview />
      </section>

      <section className="pub-section pub-section--tint" aria-labelledby="team">
        <div className="pub-head">
          <h2 id="team" className="pub-h2">
            Your coaches
          </h2>
          <Link href="/trainers" className="btn btn--secondary">
            Everyone on the team
          </Link>
        </div>
        <TrainerCards limit={4} />
      </section>

      <section className="pub-section" aria-labelledby="faq">
        <h2 id="faq" className="pub-h2">
          Questions, answered
        </h2>
        <Faq />
      </section>

      <section className="cta-band">
        <h2>Ready for your first session?</h2>
        <p>Visit us for a free trial: a tour, a short intro workout and a plan that fits you.</p>
        <Link href="/contact" className="btn btn--primary btn--lg">
          Book a free trial
        </Link>
      </section>
    </>
  );
}
