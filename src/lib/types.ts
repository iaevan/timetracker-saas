export interface Routine {
  id: string;
  userId: string;
  name: string;
  dayTags: Record<number, string>; // day of week (0=Sun) -> tagline
  isActive: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface Category {
  id: string;
  routineId: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface Block {
  id: string;
  routineId: string;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  categoryId: string | null;
  title: string;
  detail: string;
  room: string;
  startMin: number; // minutes from midnight
  endMin: number; // may exceed 1440 (runs past midnight)
  sortOrder: number;
}

export interface RoutineBundle {
  routine: Routine;
  categories: Category[];
  blocks: Block[];
}

/** A block with its category resolved (falls back to neutral when uncategorized). */
export interface ResolvedBlock extends Block {
  categoryName: string;
  categoryColor: string;
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const; // Monday-first display

export const UNCATEGORIZED = { name: "Uncategorized", color: "#8b98a8" } as const;
