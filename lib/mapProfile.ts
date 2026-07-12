import type { User } from "../data/type"; // adjust to wherever your Post/User/Comment types live

export type ProfileRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone_number: string | null;
  profile_picture: string;
  bio: string | null;
  category: User["category"];
  gender: User["gender"] | null;
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  is_private: boolean;
  interests: string[];
  created_at: string;
  updated_at: string;
};

export function mapRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phoneNumber: row.phone_number ?? undefined,
    profilePicture: row.profile_picture,
    bio: row.bio ?? undefined,
    category: row.category,
    gender: row.gender ?? undefined,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    followers: [], // real relations come from the follows table (future step)
    following: [],
    posts: [], // real relations come from the posts table (future step)
    savedPosts: [],
    isVerified: row.is_verified,
    isPrivate: row.is_private,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    interests: row.interests,
  };
}