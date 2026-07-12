import { useState } from "react";
import type { Post } from "../data/type";
import { mapRowToPost, PostRow } from "../lib/mapPost";
import { supabase } from "../lib/supabase";
import { uploadPostImage } from "../lib/uploadImage";

type CreatePostParams = {
  userId: string;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  location?: string;
};

export function useCreatePost() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (params: CreatePostParams): Promise<Post | null> => {
    setSubmitting(true);
    setError(null);

    try {
      const imageUrl = await uploadPostImage(params.imageUri, params.userId);
      const aspectRatio = params.imageWidth / params.imageHeight;

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: params.userId,
          image: imageUrl,
          width: params.imageWidth,
          height: params.imageHeight,
          aspect_ratio: aspectRatio,
          type: "image",
          title: params.title,
          description: params.description,
          category: params.category,
          tags: params.tags,
          location: params.location ?? null,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      return mapRowToPost(data as PostRow);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while publishing your post.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { createPost, submitting, error };
}