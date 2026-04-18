import type { Timestamp } from "firebase/firestore";

export type MemberRole = "admin" | "member";

export type TimelineEventType = "expense" | "media" | "member";

export interface Trip {
  id: string;
  name: string;
  description: string;
  /** ISO YYYY-MM-DD; legacy docs may only have `date` — see mapTrip */
  startDate: string;
  /** ISO YYYY-MM-DD, optional */
  endDate?: string | null;
  createdBy: string;
  inviteToken: string;
  memberIds: string[];
  closed?: boolean;
  coverImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** Route stop (manual entry, Phase 2) */
export interface RouteStop {
  name: string;
  order: number;
  notes?: string;
}

/** Single document at trips/{tripId}/route/summary */
export interface TripRoute {
  tripId: string;
  startLocation: string;
  destination: string;
  stops: RouteStop[];
  distanceText: string;
  durationText: string;
  routeNotes: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const CHECKLIST_CATEGORIES = [
  "Documents",
  "Safety",
  "Clothing",
  "Bike essentials",
  "Food / water",
  "Electronics",
  "Other",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

export interface ChecklistItem {
  id: string;
  tripId: string;
  text: string;
  category: string;
  isCompleted: boolean;
  assignedTo: string | null;
  createdBy: string;
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface TripMember {
  userId: string;
  name: string;
  email: string | null;
  role: MemberRole;
  joinedAt: Timestamp;
}

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  category?: string;
  note?: string;
  createdAt: Timestamp;
}

export interface MediaItem {
  id: string;
  tripId: string;
  url: string;
  uploadedBy: string;
  createdAt: Timestamp;
}

export interface TimelineEvent {
  id: string;
  tripId: string;
  type: TimelineEventType;
  referenceId: string;
  createdAt: Timestamp;
}
