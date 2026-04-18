import { getAdminAuth, getAdminDb, FieldValue } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization bearer token" }, { status: 401 });
    }

    let body: { inviteToken?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const inviteToken = body.inviteToken?.trim();
    if (!inviteToken) {
      return NextResponse.json({ error: "inviteToken is required" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const name =
      (decoded.name as string | undefined) ||
      decoded.email?.split("@")[0] ||
      "Member";
    const email = decoded.email ?? null;

    const db = getAdminDb();
    const lookupRef = db.collection("inviteLookups").doc(inviteToken);
    const lookupSnap = await lookupRef.get();
    if (!lookupSnap.exists) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
    }
    const tripId = lookupSnap.data()?.tripId as string | undefined;
    if (!tripId) {
      return NextResponse.json({ error: "Malformed invite" }, { status: 500 });
    }

    const tripRef = db.collection("trips").doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    const trip = tripSnap.data()!;
    if (trip.closed === true) {
      return NextResponse.json({ error: "This trip is closed" }, { status: 403 });
    }

    const memberIds = (trip.memberIds as string[]) ?? [];
    if (memberIds.includes(uid)) {
      return NextResponse.json({ ok: true, tripId, alreadyMember: true });
    }

    const memberRef = tripRef.collection("members").doc(uid);
    const timelineRef = tripRef.collection("timelineEvents").doc();

    const batch = db.batch();
    batch.set(memberRef, {
      userId: uid,
      name,
      email,
      role: "member",
      joinedAt: FieldValue.serverTimestamp(),
    });
    batch.update(tripRef, {
      memberIds: FieldValue.arrayUnion(uid),
    });
    batch.set(timelineRef, {
      type: "member",
      referenceId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ ok: true, tripId });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
