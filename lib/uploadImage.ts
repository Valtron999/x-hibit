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

// import { decode } from "base64-arraybuffer";
// import * as FileSystem from "expo-file-system/legacy";
// import { supabase } from "./supabase";

// /**
//  * Uploads a locally-picked image (from expo-image-picker) into the "posts"
//  * Storage bucket, under a folder named after the user's id — required by
//  * the storage RLS policies in 003_posts.sql.
//  * Returns the public URL to store on the post row.
//  */
// export async function uploadPostImage(localUri: string, userId: string): Promise<string> {
//   const fileExt = localUri.split(".").pop()?.toLowerCase() || "jpg";
//   const path = `${userId}/${Date.now()}.${fileExt}`;
//   const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

//   // RN's fetch/Blob handling is unreliable for large binary uploads, so we
//   // read the file as base64 and decode it to an ArrayBuffer instead —
//   // the documented approach for Supabase Storage uploads from Expo.
//   const base64 = await FileSystem.readAsStringAsync(localUri, {
//     encoding: FileSystem.EncodingType.Base64,
//   });

//   const { error } = await supabase.storage
//     .from("posts")
//     .upload(path, decode(base64), { contentType, upsert: false });

//   if (error) {
//     throw error;
//   }

//   const { data } = supabase.storage.from("posts").getPublicUrl(path);
//   return data.publicUrl;
// }