import mongoose from "mongoose";
import { env } from "./env.js";
import { ClassSession, Plan, Product, Trainer } from "./models.js";

await mongoose.connect(env.mongoUri);

if ((await Plan.countDocuments()) === 0) {
  await Plan.insertMany([
    { name: "Monthly", description: "Pay as you go.", priceCents: 2999, durationDays: 30, features: ["Unlimited workouts", "Workout sync across devices"] },
    { name: "Quarterly", description: "Save 15%.", priceCents: 7599, durationDays: 90, features: ["Everything in Monthly", "Priority support"] },
    { name: "Yearly", description: "Best value.", priceCents: 24999, durationDays: 365, features: ["Everything in Quarterly", "Free shaker bottle"] },
  ]);
  console.log("Seeded plans");
}
if ((await Product.countDocuments()) === 0) {
  await Product.insertMany([
    { name: "Whey Protein 2 kg", category: "supplements", description: "Chocolate, 66 servings.", priceCents: 5499, stock: 40 },
    { name: "Creatine Monohydrate 500 g", category: "supplements", description: "Unflavoured, 100 servings.", priceCents: 2499, stock: 60 },
    { name: "Adjustable Dumbbell Pair", category: "equipment", description: "2 to 24 kg per hand.", priceCents: 18999, stock: 8 },
    { name: "Resistance Band Set", category: "equipment", description: "5 bands, door anchor and handles.", priceCents: 1999, stock: 35 },
    { name: "Lifting Straps", category: "accessories", description: "Padded cotton straps.", priceCents: 1299, stock: 50 },
    { name: "Training Tee", category: "apparel", description: "Breathable, regular fit.", priceCents: 2499, stock: 25 },
  ]);
  console.log("Seeded products");
}
if ((await Trainer.countDocuments()) === 0) {
  const trainers = await Trainer.insertMany([
    { name: "Maya Rahman", title: "Head Strength Coach", bio: "Ten years coaching powerlifting and general strength. Loves teaching a clean squat.", specialties: ["Strength", "Powerlifting", "Technique"] },
    { name: "Arif Hossain", title: "Conditioning Coach", bio: "Runs our HIIT and boxing sessions. Former national boxer.", specialties: ["HIIT", "Boxing", "Fat loss"] },
    { name: "Nadia Karim", title: "Yoga and Mobility", bio: "Certified yoga teacher focused on mobility and recovery for lifters.", specialties: ["Yoga", "Mobility", "Recovery"] },
    { name: "Imran Sheikh", title: "Personal Trainer", bio: "Helps beginners build confidence and a routine they can keep.", specialties: ["Beginners", "Weight loss", "Nutrition basics"] },
  ]);
  // Two weeks of a typical weekly timetable (dow: 1 = Monday ... 6 = Saturday).
  const template = [
    { dow: 1, hour: 7, title: "Morning Strength", category: "strength", t: 0, dur: 60, cap: 16, level: "all" },
    { dow: 1, hour: 18, title: "HIIT Burn", category: "hiit", t: 1, dur: 45, cap: 20, level: "intermediate" },
    { dow: 2, hour: 7, title: "Mobility Flow", category: "mobility", t: 2, dur: 45, cap: 18, level: "all" },
    { dow: 2, hour: 19, title: "Boxing Fundamentals", category: "boxing", t: 1, dur: 60, cap: 14, level: "beginner" },
    { dow: 3, hour: 18, title: "Strength Basics", category: "strength", t: 3, dur: 60, cap: 12, level: "beginner" },
    { dow: 4, hour: 7, title: "Morning Strength", category: "strength", t: 0, dur: 60, cap: 16, level: "all" },
    { dow: 4, hour: 19, title: "Vinyasa Yoga", category: "yoga", t: 2, dur: 60, cap: 20, level: "all" },
    { dow: 5, hour: 18, title: "HIIT Burn", category: "hiit", t: 1, dur: 45, cap: 20, level: "intermediate" },
    { dow: 6, hour: 9, title: "Saturday Power", category: "strength", t: 0, dur: 75, cap: 16, level: "advanced" },
    { dow: 6, hour: 11, title: "Cycling Intervals", category: "cycling", t: 3, dur: 45, cap: 15, level: "all" },
  ] as const;
  const docs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let day = 0; day < 14; day++) {
    const date = new Date(today.getTime() + day * 86_400_000);
    for (const c of template.filter((x) => x.dow === date.getDay())) {
      const startsAt = new Date(date);
      startsAt.setHours(c.hour, 0, 0, 0);
      if (startsAt.getTime() < Date.now()) continue;
      docs.push({ title: c.title, category: c.category, level: c.level, trainer: trainers[c.t]._id, startsAt, durationMin: c.dur, capacity: c.cap, room: c.category === "cycling" ? "Cycle room" : "Studio" });
    }
  }
  await ClassSession.insertMany(docs);
  console.log(`Seeded ${trainers.length} trainers and ${docs.length} classes`);
}
await mongoose.disconnect();
