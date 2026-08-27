import { PostWithAuthor } from "@/lib/mapPost";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  post: PostWithAuthor;
  cardWidth?: number; // width of the column this card is rendered in
};

const FALLBACK_WIDTH = Dimensions.get("window").width / 2 - 12;

// Must match CARD_GAP in Home.tsx (split evenly left/right = CARD_GAP / 2
// each), and CARD_GAP / 2 again for the bottom gap between rows.
const CARD_MARGIN_HORIZONTAL = 8;
const CARD_MARGIN_BOTTOM = 16;

function PostCard({ post, cardWidth }: Props) {
  const router = useRouter();

  const width = cardWidth ?? FALLBACK_WIDTH;

  // aspectRatio = width / height. Guard so we never divide by 0/undefined.
  const ratio = post.aspectRatio && post.aspectRatio > 0 ? post.aspectRatio : 1;
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
      style={{
        width,
        marginHorizontal: CARD_MARGIN_HORIZONTAL,
        marginBottom: CARD_MARGIN_BOTTOM,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#14141400",
      }}
    >
      {/* Image — no radius here, the card container clips it */}
      <Image
        source={{ uri: post.image }}
        style={{ width, height: imageHeight }}
        resizeMode="cover"
      />

      {/* Info — padded inside the same card surface as the image */}
      <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
        <Text
          numberOfLines={1}
          style={{ fontWeight: "500", fontSize: 13, color: "#eeeeee" }}
        >
          {post.authorUsername || "Unknown"}
        </Text>

        <Text numberOfLines={1} style={{ fontSize: 12, color: "#807E7E", marginTop: 1 }}>
          {post.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Skips re-rendering a card when neither its post data nor its width
// changed — this is the single biggest win from the perf list, since
// without it every keystroke/re-render re-renders every visible card.
function arePropsEqual(prev: Props, next: Props) {
  return (
    prev.cardWidth === next.cardWidth &&
    prev.post.id === next.post.id &&
    prev.post.likes === next.post.likes &&
    prev.post.commentsCount === next.post.commentsCount &&
    prev.post.image === next.post.image &&
    prev.post.description === next.post.description &&
    prev.post.authorUsername === next.post.authorUsername
  );
}

export default memo(PostCard, arePropsEqual);