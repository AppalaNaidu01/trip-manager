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
  /** Google Drive folder for trip media (created on first upload) */
  driveFolderId?: string | null;
  driveFolderWebViewLink?: string | null;
  coverDriveFileId?: string | null;
  backgroundDriveFileId?: string | null;
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
  /** Optional display text, e.g. "42 km/h" */
  avgSpeedText?: string;
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
  /** Optional detail line (e.g. brand, size). */
  notes?: string | null;
  category: string;
  isCompleted: boolean;
  assignedTo: string | null;
  /** Set when marked complete (for “Completed by …”). */
  completedBy?: string | null;
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
  /** Set when file is stored in Google Drive */
  driveFileId?: string | null;
  /** Checkpoint on the saved route (start / stop-N / destination); omit for older uploads */
  routeSegmentId?: string | null;
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
