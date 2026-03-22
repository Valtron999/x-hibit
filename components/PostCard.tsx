import { Post } from "@/data/type";
import { users } from "@/data/users";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  post: Post;
};

export default function PostCard({ post }: Props) {
  const router = useRouter();

  const user = users.find((u) => u.id === post.userId);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/screen/details/[id]",
          params: { id: post.id },
        })
      }
      style={{ margin: 6 }}
    >
      {/* Image */}
      <Image
        source={{ uri: post.image }}
        style={{
          width: "100%",
          height: 200 * post.aspectRatio, // dynamic height
          borderRadius: 12,
        }}
        resizeMode="cover"
      />

      {/* Info */}
      <View style={{ marginTop: 6 }}>
        <Text style={{ fontWeight: "600" }}>
          {user?.username || "Unknown"}
        </Text>

        <Text numberOfLines={1} style={{ fontSize: 12, color: "#555" }}>
          {post.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}