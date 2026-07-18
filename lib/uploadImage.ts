import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { supabase } from "./supabase";

/**
 * Uploads a locally-picked image (from expo-image-picker) into the "posts"
 * Storage bucket, under a folder named after the user's id — required by
 * the storage RLS policies in 003_posts.sql.
 * Returns the public URL to store on the post row.
 */
export async function uploadPostImage(localUri: string, userId: string): Promise<string> {
  const fileExt = localUri.split(".").pop()?.toLowerCase().split("?")[0] || "jpg";
  const path = `${userId}/${Date.now()}.${fileExt}`;
  const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

  let fileData: ArrayBuffer | Blob;

  if (Platform.OS === "web") {
    // On web, expo-image-picker gives us a blob:/data: URL, and
    // expo-file-system has no web implementation — FileSystem.readAsStringAsync
    // will throw. fetch()/Blob works natively in the browser instead.
    const response = await fetch(localUri);
    fileData = await response.blob();
  } else {
    // RN's fetch/Blob handling is unreliable for large binary uploads, so we
    // read the file as base64 and decode it to an ArrayBuffer instead —
    // the documented approach for Supabase Storage uploads from Expo.
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    fileData = decode(base64);
  }

  const { error } = await supabase.storage
    .from("posts")
    .upload(path, fileData, { contentType, upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  return data.publicUrl;
}

function extFromMimeType(mimeType?: string): string {
  if (!mimeType) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg"; // covers image/jpeg and anything unrecognized
}

/**
 * Uploads a locally-picked image into the "posts" Storage bucket (the one
 * you already have working, under {userId}/... — same RLS policy applies),
 * using a distinct "avatar-" filename prefix so it's easy to tell apart
 * from post images in the bucket listing.
 *
 * mimeType is required (not parsed from the URI) because on web,
 * expo-image-picker returns a `blob:http://localhost:.../<uuid>` URI with
 * no real file extension — parsing "the bit after the last dot" grabs
 * garbage from the URL itself and corrupts the storage path.
 *
 * 🔧 If you'd rather keep avatars in their own bucket for organization,
 * create an "avatars" bucket + matching RLS policy in Supabase, then change
 * both `.from("posts")` calls below to `.from("avatars")`.
 */
export async function uploadProfileImage(
  localUri: string,
  userId: string,
  mimeType?: string
): Promise<string> {
  const fileExt = extFromMimeType(mimeType);
  const path = `${userId}/avatar-${Date.now()}.${fileExt}`;
  const contentType = mimeType || (fileExt === "png" ? "image/png" : "image/jpeg");

  let fileData: ArrayBuffer | Blob;

  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    fileData = await response.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    fileData = decode(base64);
  }

  const { error } = await supabase.storage
    .from("posts")
    .upload(path, fileData, { contentType, upsert: true });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  return data.publicUrl;
}