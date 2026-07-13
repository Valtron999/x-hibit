import { PostWithAuthor } from "@/lib/mapPost";
import { useRouter } from "expo-router";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  post: PostWithAuthor;
  cardWidth?: number; // width of the column this card is rendered in
};

const FALLBACK_WIDTH = Dimensions.get("window").width / 2 - 12;

export default function PostCard({ post, cardWidth }: Props) {
  const router = useRouter();

  const width = cardWidth ?? FALLBACK_WIDTH;

  // aspectRatio = width / height. Guard so we never divide by 0/undefined.
  const ratio =
    post.aspectRatio && post.aspectRatio > 0 ? post.aspectRatio : 1;
  const imageHeight = width / ratio;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/screen/details/[id]",
          params: { id: post.id },
        })
      }
      style={{ margin: 6, width }}
    >
      {/* Image */}
      <Image
        source={{ uri: post.image }}
        style={{
          width,
          height: imageHeight,
          borderRadius: 12,
        }}
        resizeMode="cover"
      />

      {/* Info */}
      <View style={{ marginTop: 6 }}>
        <Text style={{ fontWeight: "400", color: "#eeeeee" }}>
          {post.authorUsername || "Unknown"}
        </Text>

        <Text numberOfLines={1} style={{ fontSize: 12, color: "#555" }}>
          {post.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// import { PostWithAuthor } from "@/lib/mapPost";
// import { useRouter } from "expo-router";
// import { Image, Text, TouchableOpacity, View } from "react-native";

// type Props = {
//   post: PostWithAuthor;
// };

// export default function PostCard({ post }: Props) {
//   const router = useRouter();

//   return (
//     <TouchableOpacity
//       activeOpacity={0.9}
//       onPress={() =>
//         router.push({
//           pathname: "/screen/details/[id]",
//           params: { id: post.id },
//         })
//       }
//       style={{ margin: 6 }}
//     >
//       {/* Image */}
//       <Image
//         source={{ uri: post.image }}
//         style={{
//           width: "100%",
//           height: 200 * post.aspectRatio,
//           borderRadius: 12,
//         }}
//         resizeMode="cover"
//       />

//       {/* Info */}
//       <View style={{ marginTop: 6 }}>
//         <Text style={{ fontWeight: "400", color: "#eeeeee" }}>
//           {post.authorUsername || "Unknown"}
//         </Text>

//         <Text numberOfLines={1} style={{ fontSize: 12, color: "#555" }}>
//           {post.description}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
// }


// import { Post } from "@/data/type";
// import { users } from "@/data/users";
// import { useRouter } from "expo-router";
// import { Image, Text, TouchableOpacity, View } from "react-native";

// type Props = {
//   post: Post;
// };

// export default function PostCard({ post }: Props) {
//   const router = useRouter();

//   const user = users.find((u) => u.id === post.userId);

//   return (
//     <TouchableOpacity
//       activeOpacity={0.9}
//       onPress={() =>
//         router.push({
//           pathname: "/screen/details/[id]",
//           params: { id: post.id },
//         })
//       }
//       style={{ margin: 6 }}
//     >
//       {/* Image */}
//       <Image
//         source={{ uri: post.image }}
//         style={{
//           width: "100%",
//           height: 200 * post.aspectRatio,
//           borderRadius: 12,
//         }}
//         resizeMode="cover"
//       />

//       {/* Info */}
//       <View style={{ marginTop: 6 }}>
//         <Text style={{ fontWeight: "400", color: "#eeeeee" }}>
//           {user?.username || "Unknown"}
//         </Text>

//         <Text numberOfLines={1} style={{ fontSize: 12, color: "#555" }}>
//           {post.description}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
// }