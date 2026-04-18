"use client";

import type { Trip } from "@/types/models";
import {
  fetchPublicImageUrl,
  uploadImageToFolder,
} from "./drive-api";
import { getGoogleDriveAccessToken } from "./token";
import { ensureTripDriveFolder } from "./trip-folder";

export async function uploadTripImageToDrive(params: {
  trip: Trip;
  tripId: string;
  file: File;
  nameHint: string;
  memberEmails: string[];
}): Promise<{ url: string; driveFileId: string }> {
  const { folderId } = await ensureTripDriveFolder(
    params.trip,
    params.tripId,
    params.memberEmails,
  );
  const token = await getGoogleDriveAccessToken();
  const up = await uploadImageToFolder(
    token,
    folderId,
    params.file,
    params.nameHint,
  );
  const url = await fetchPublicImageUrl(token, up.id);
  return {
    driveFileId: up.id,
    url,
  };
}
