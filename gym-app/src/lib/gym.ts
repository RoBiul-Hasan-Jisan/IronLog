/**
 * The gym's public details. Edit this one file to rebrand the site:
 * name, address, opening hours and contact appear on the landing page, contact page and footer.
 */
export const GYM = {
  name: "IronLog Fitness",
  tagline: "Train smarter. Show up stronger.",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1209",
  phone: "+880 1700 000000",
  email: "hello@ironlog.example",
  hours: [
    { days: "Sunday to Thursday", time: "5:30 AM to 11:00 PM" },
    { days: "Friday", time: "2:00 PM to 10:00 PM" },
    { days: "Saturday", time: "7:00 AM to 9:00 PM" },
  ],
} as const;

export const FAQ: { q: string; a: string }[] = [
  { q: "Can I try the gym before I join?", a: "Yes. Send a free-trial request on the contact page and we will book you a free visit with a tour and a short intro session." },
  { q: "Do I need experience?", a: "No. Our beginner classes and personal trainers start from the basics, and every exercise in the app shows animated steps." },
  { q: "How do I book a class?", a: "Create an account, choose a membership, then book from the class timetable. You can cancel up to 2 hours before the class starts." },
  { q: "How does check-in work?", a: "Every member gets a personal 6-character code in the app. Show it at the front desk and the team checks you in." },
  { q: "Can I pause or change my membership?", a: "Memberships extend when you renew early. Talk to the front desk if you need to change plans." },
  { q: "What should I bring?", a: "A towel, water and indoor shoes. Lockers and showers are available." },
];

export const CATEGORY_LABEL: Record<string, string> = {
  strength: "Strength",
  cardio: "Cardio",
  hiit: "HIIT",
  yoga: "Yoga",
  mobility: "Mobility",
  boxing: "Boxing",
  cycling: "Cycling",
};
