import type {
  Expense,
  MediaItem,
  TimelineEvent,
  Trip,
  TripMember,
} from "@/types/models";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export function mapTrip(
  id: string,
  data: DocumentData,
): Trip {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    createdBy: String(data.createdBy ?? ""),
    inviteToken: String(data.inviteToken ?? ""),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds.map(String) : [],
    closed: data.closed === true,
    createdAt: data.createdAt,
  };
}

export function mapMember(
  userId: string,
  data: DocumentData,
): TripMember {
  return {
    userId,
    name: String(data.name ?? ""),
    email: data.email != null ? String(data.email) : null,
    role: data.role === "admin" ? "admin" : "member",
    joinedAt: data.joinedAt,
  };
}

export function mapExpense(
  id: string,
  tripId: string,
  data: DocumentData,
): Expense {
  return {
    id,
    tripId,
    amount: Number(data.amount ?? 0),
    paidBy: String(data.paidBy ?? ""),
    splitBetween: Array.isArray(data.splitBetween)
      ? data.splitBetween.map(String)
      : [],
    category: data.category != null ? String(data.category) : undefined,
    note: data.note != null ? String(data.note) : undefined,
    createdAt: data.createdAt,
  };
}

export function mapMedia(
  id: string,
  tripId: string,
  data: DocumentData,
): MediaItem {
  return {
    id,
    tripId,
    url: String(data.url ?? ""),
    uploadedBy: String(data.uploadedBy ?? ""),
    createdAt: data.createdAt,
  };
}

export function mapTimeline(
  id: string,
  tripId: string,
  data: DocumentData,
): TimelineEvent {
  const type = data.type;
  const t =
    type === "expense" || type === "media" || type === "member" ? type : "member";
  return {
    id,
    tripId,
    type: t,
    referenceId: String(data.referenceId ?? ""),
    createdAt: data.createdAt,
  };
}

export function docSnapToTrip(snap: QueryDocumentSnapshot): Trip {
  return mapTrip(snap.id, snap.data());
}
