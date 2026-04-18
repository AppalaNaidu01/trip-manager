import type {
  ChecklistItem,
  Expense,
  MediaItem,
  TimelineEvent,
  Trip,
  TripMember,
  TripRoute,
} from "@/types/models";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export function mapTrip(
  id: string,
  data: DocumentData,
): Trip {
  const legacyDate = data.date != null ? String(data.date) : "";
  const startDate =
    data.startDate != null ? String(data.startDate) : legacyDate;
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    startDate,
    endDate:
      data.endDate != null && String(data.endDate).length > 0
        ? String(data.endDate)
        : null,
    createdBy: String(data.createdBy ?? ""),
    inviteToken: String(data.inviteToken ?? ""),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds.map(String) : [],
    closed: data.closed === true,
    groupSync: data.groupSync === false ? false : true,
    coverImageUrl:
      data.coverImageUrl != null ? String(data.coverImageUrl) : null,
    backgroundImageUrl:
      data.backgroundImageUrl != null
        ? String(data.backgroundImageUrl)
        : null,
    driveFolderId:
      data.driveFolderId != null ? String(data.driveFolderId) : null,
    driveFolderWebViewLink:
      data.driveFolderWebViewLink != null
        ? String(data.driveFolderWebViewLink)
        : null,
    coverDriveFileId:
      data.coverDriveFileId != null ? String(data.coverDriveFileId) : null,
    backgroundDriveFileId:
      data.backgroundDriveFileId != null
        ? String(data.backgroundDriveFileId)
        : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
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
  const rawSeg = data.routeSegmentId;
  return {
    id,
    tripId,
    url: String(data.url ?? ""),
    driveFileId:
      data.driveFileId != null ? String(data.driveFileId) : null,
    routeSegmentId:
      rawSeg != null && String(rawSeg).length > 0 ? String(rawSeg) : null,
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

export function mapTripRoute(
  tripId: string,
  data: DocumentData,
): TripRoute {
  const rawStops = data.stops;
  const stops: TripRoute["stops"] = Array.isArray(rawStops)
    ? rawStops
        .map((s: unknown, i: number) => {
          if (!s || typeof s !== "object") return null;
          const o = s as Record<string, unknown>;
          return {
            name: String(o.name ?? ""),
            order: typeof o.order === "number" ? o.order : i,
            notes:
              o.notes != null && String(o.notes).length > 0
                ? String(o.notes)
                : undefined,
          };
        })
        .filter(Boolean) as TripRoute["stops"]
    : [];
  stops.sort((a, b) => a.order - b.order);
  return {
    tripId,
    startLocation: String(data.startLocation ?? ""),
    destination: String(data.destination ?? ""),
    stops,
    distanceText: String(data.distanceText ?? ""),
    durationText: String(data.durationText ?? ""),
    avgSpeedText:
      data.avgSpeedText != null && String(data.avgSpeedText).length > 0
        ? String(data.avgSpeedText)
        : undefined,
    routeNotes: String(data.routeNotes ?? ""),
    createdBy: String(data.createdBy ?? ""),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function mapChecklistItem(
  id: string,
  tripId: string,
  data: DocumentData,
): ChecklistItem {
  return {
    id,
    tripId,
    text: String(data.text ?? ""),
    notes:
      data.notes != null && String(data.notes).length > 0
        ? String(data.notes)
        : null,
    category: String(data.category ?? "Other"),
    isCompleted: data.isCompleted === true,
    assignedTo:
      data.assignedTo != null && String(data.assignedTo).length > 0
        ? String(data.assignedTo)
        : null,
    completedBy:
      data.completedBy != null && String(data.completedBy).length > 0
        ? String(data.completedBy)
        : null,
    createdBy: String(data.createdBy ?? ""),
    completedAt: data.completedAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
