/**
 * The original hard-coded routine from legacy/index.html, used to seed
 * a new account's first routine ("The Daily Line").
 */

export interface StarterCategory {
  key: string;
  name: string;
  color: string;
}

export interface StarterBlock {
  dayOfWeek: number;
  catKey: string;
  title: string;
  detail: string;
  room?: string;
  startMin: number;
  endMin: number;
}

export const STARTER_NAME = "The Daily Line";

export const STARTER_DAY_TAGS: Record<number, string> = {
  0: "Weekend Clean-up",
  1: "Predictable Scale",
  2: "High-Flex Day",
  3: "Predictable Scale",
  4: "Campus Marathon",
  5: "ML & Recovery Fortress",
  6: "Heavy Academic Day",
};

export const STARTER_CATEGORIES: StarterCategory[] = [
  { key: "cto", name: "CTO Core", color: "#f5a623" },
  { key: "spacend", name: "Spacend", color: "#f472b6" },
  { key: "ml", name: "ML Track", color: "#22d3ee" },
  { key: "flex", name: "Flex Zone", color: "#a78bfa" },
  { key: "class", name: "Class", color: "#60a5fa" },
  { key: "study", name: "Study", color: "#818cf8" },
  { key: "buffer", name: "Buffer", color: "#14b8a6" },
  { key: "free", name: "Free", color: "#4ade80" },
  { key: "routine", name: "Routine", color: "#94a3b8" },
  { key: "reading", name: "Reading", color: "#c4b5fd" },
  { key: "sleep", name: "Sleep", color: "#5f6b7a" },
];

const MON_WED: Omit<StarterBlock, "dayOfWeek">[] = [
  { startMin: 570, endMin: 600, catKey: "routine", title: "Wake up", detail: "Breakfast · pacing" },
  { startMin: 600, endMin: 780, catKey: "cto", title: "CTO Core", detail: "Technical architecture · developer management" },
  { startMin: 780, endMin: 870, catKey: "spacend", title: "Spacend UI", detail: "High-ticket designs · hand-offs to Asif & Rith" },
  { startMin: 870, endMin: 1080, catKey: "buffer", title: "Buffer", detail: "Commute · meals · gym · Slack check-ins" },
  { startMin: 1080, endMin: 1170, catKey: "class", title: "ECO104", detail: "Lecture", room: "NAC403" },
  { startMin: 1170, endMin: 1230, catKey: "routine", title: "Return commute · dinner", detail: "" },
  { startMin: 1230, endMin: 1380, catKey: "ml", title: "ML Track", detail: "Stanford lectures · algorithm coding" },
  { startMin: 1380, endMin: 1530, catKey: "free", title: "Free buffer", detail: "Decompression · time with Rith" },
  { startMin: 1530, endMin: 1560, catKey: "reading", title: "Book wind-down", detail: "Screen cutoff · 30 min" },
];

export const STARTER_BLOCKS: StarterBlock[] = [
  ...MON_WED.map((b) => ({ ...b, dayOfWeek: 1 })),
  ...MON_WED.map((b) => ({ ...b, dayOfWeek: 3 })),
  // Tuesday
  { dayOfWeek: 2, startMin: 570, endMin: 600, catKey: "routine", title: "Wake up", detail: "Breakfast" },
  { dayOfWeek: 2, startMin: 600, endMin: 780, catKey: "spacend", title: "Spacend Dev", detail: "WordPress & Elementor core development" },
  { dayOfWeek: 2, startMin: 780, endMin: 1080, catKey: "flex", title: "Flex zone", detail: "CTO visits / product shoots · else client work" },
  { dayOfWeek: 2, startMin: 1080, endMin: 1230, catKey: "buffer", title: "Buffer", detail: "Dinner · gym · errands" },
  { dayOfWeek: 2, startMin: 1230, endMin: 1380, catKey: "ml", title: "ML Track", detail: "Stanford project execution" },
  { dayOfWeek: 2, startMin: 1380, endMin: 1530, catKey: "free", title: "Free buffer", detail: "Decompression" },
  { dayOfWeek: 2, startMin: 1530, endMin: 1560, catKey: "reading", title: "Book wind-down", detail: "Screen cutoff · 30 min" },
  // Thursday
  { dayOfWeek: 4, startMin: 510, endMin: 580, catKey: "routine", title: "Wake · commute to NSU", detail: "Quick breakfast" },
  { dayOfWeek: 4, startMin: 580, endMin: 670, catKey: "class", title: "CSE173 Discrete Math", detail: "Lecture", room: "SAC311" },
  { dayOfWeek: 4, startMin: 680, endMin: 770, catKey: "class", title: "MAT125 Linear Algebra", detail: "Lecture", room: "NAC314" },
  { dayOfWeek: 4, startMin: 780, endMin: 885, catKey: "study", title: "Study block", detail: "NSU Library · MAT125 matrices" },
  { dayOfWeek: 4, startMin: 885, endMin: 975, catKey: "cto", title: "CTO async", detail: "Startup checks · vendor tracking (library desk)" },
  { dayOfWeek: 4, startMin: 980, endMin: 1070, catKey: "class", title: "EEE154 Drawing Lab", detail: "Lab", room: "LIB608" },
  { dayOfWeek: 4, startMin: 1080, endMin: 1170, catKey: "class", title: "POL101 Political Economy", detail: "Lecture", room: "NAC210" },
  { dayOfWeek: 4, startMin: 1170, endMin: 1230, catKey: "routine", title: "Return commute · dinner", detail: "" },
  { dayOfWeek: 4, startMin: 1230, endMin: 1530, catKey: "free", title: "Open evening", detail: "Workouts · Rith · rest" },
  { dayOfWeek: 4, startMin: 1530, endMin: 1560, catKey: "reading", title: "Book wind-down", detail: "Screen cutoff · 30 min" },
  // Friday
  { dayOfWeek: 5, startMin: 540, endMin: 570, catKey: "routine", title: "Wake up", detail: "Breakfast" },
  { dayOfWeek: 5, startMin: 570, endMin: 810, catKey: "ml", title: "Deep ML sprint", detail: "4h technical focus · programming" },
  { dayOfWeek: 5, startMin: 810, endMin: 1530, catKey: "free", title: "Total free buffer", detail: "Gym · downtime · no work guilt" },
  { dayOfWeek: 5, startMin: 1530, endMin: 1560, catKey: "reading", title: "Book wind-down", detail: "Screen cutoff · 30 min" },
  // Saturday
  { dayOfWeek: 6, startMin: 510, endMin: 580, catKey: "routine", title: "Wake · commute to NSU", detail: "Quick breakfast" },
  { dayOfWeek: 6, startMin: 580, endMin: 670, catKey: "class", title: "CSE173 Discrete Math", detail: "Lecture", room: "SAC311" },
  { dayOfWeek: 6, startMin: 680, endMin: 770, catKey: "class", title: "MAT125 Linear Algebra", detail: "Lecture", room: "NAC314" },
  { dayOfWeek: 6, startMin: 770, endMin: 810, catKey: "routine", title: "Lunch on campus", detail: "" },
  { dayOfWeek: 6, startMin: 810, endMin: 990, catKey: "study", title: "Study block", detail: "NSU Library · CSE173 truth tables & proofs" },
  { dayOfWeek: 6, startMin: 990, endMin: 1080, catKey: "spacend", title: "Spacend UI revisions", detail: "Visual review with Wasit" },
  { dayOfWeek: 6, startMin: 1080, endMin: 1170, catKey: "class", title: "POL101 Political Economy", detail: "Lecture", room: "NAC210" },
  { dayOfWeek: 6, startMin: 1185, endMin: 1275, catKey: "study", title: "ECO104 papers", detail: "Draft & submit · campus desk" },
  { dayOfWeek: 6, startMin: 1275, endMin: 1530, catKey: "free", title: "Dinner · downtime", detail: "Wind-down after campus" },
  { dayOfWeek: 6, startMin: 1530, endMin: 1560, catKey: "reading", title: "Book wind-down", detail: "Screen cutoff · 30 min" },
  // Sunday
  { dayOfWeek: 0, startMin: 540, endMin: 570, catKey: "routine", title: "Wake up", detail: "Breakfast" },
  { dayOfWeek: 0, startMin: 570, endMin: 780, catKey: "study", title: "Weekly math review", detail: "EEE154 lab portfolio updates" },
  { dayOfWeek: 0, startMin: 780, endMin: 1020, catKey: "flex", title: "Flex zone", detail: "Startup emergencies · Spacend core code" },
  { dayOfWeek: 0, startMin: 1020, endMin: 1080, catKey: "routine", title: "Dinner · break", detail: "" },
  { dayOfWeek: 0, startMin: 1080, endMin: 1320, catKey: "ml", title: "Deep ML project", detail: "Lab architecture · 4h build" },
  { dayOfWeek: 0, startMin: 1320, endMin: 1530, catKey: "free", title: "Downtime · reset", detail: "Prep for the upcoming week" },
  { dayOfWeek: 0, startMin: 1530, endMin: 1560, catKey: "reading", title: "Book wind-down", detail: "Screen cutoff · 30 min" },
];
