import type { Timestamp } from "firebase/firestore";

export type MemberRole = "admin" | "member";

export type TimelineEventType = "expense" | "media" | "member";

export interface Trip {
  id: string;
  name: string;
  description: string;
  /** ISO date string (YYYY-MM-DD) for display and filtering */
  date: string;
  createdBy: string;
  inviteToken: string;
  memberIds: string[];
  closed?: boolean;
  createdAt: Timestamp;
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
