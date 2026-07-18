import * as ImagePicker from "expo-image-picker"; // 🔧 install: npx expo install expo-image-picker
import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import { uploadProfileImage } from "../lib/uploadImage";

interface UseProfileImageUploadOptions {
  userId: string | undefined;
  onUploaded?: (url: string) => void;
}

export function useProfileImageUpload({ userId, onUploaded }: UseProfileImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(
    async (source: "camera" | "gallery") => {
      if (!userId) return;

      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) return;

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"], // MediaTypeOptions is deprecated as of SDK 52+
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);
      setError(null);

      try {
        const publicUrl = await uploadProfileImage(asset.uri, userId, asset.mimeType ?? undefined);

        // profiles table uses snake_case: profile_picture
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ profile_picture: publicUrl })
          .eq("id", userId);

        if (updateError) throw updateError;

        onUploaded?.(publicUrl);
      } catch (err: any) {
        console.error("Profile picture upload failed:", err);
        setError(err?.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [userId, onUploaded]
  );

  return { uploading, error, pickAndUpload };
}