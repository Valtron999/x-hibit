import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import { comments as allComments } from "@/data/comments";
import { postsData } from "@/data/posts";
import { users } from "@/data/users";
import MasonryList from "@react-native-seoul/masonry-list";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Details = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  // ─── Route params ─────────────────────────────────────────────────────────
  const { id } = useLocalSearchParams<{ id: string }>();

  // ─── Derived data ─────────────────────────────────────────────────────────
  const post = postsData.find((p) => p.id === id);
  const user = users.find((u) => u.id === post?.userId);
  const moreByArtist = postsData.filter(
    (p) => p.userId === post?.userId && p.id !== post?.id
  );
  const baseComments = allComments.filter((c) => c.postId === post?.id);

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (!post || !user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#030303",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff" }}>Post not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "#D4D2D3" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getCommentUser = (userId: string) =>
    users.find((u) => u.id === userId);

  const [localLikes, setLocalLikes] = useState(post.likes ?? 0);

      const toggleLike = () => {
    setIsLiked((prev) => !prev);
    setLocalLikes((likes) => (isLiked ? likes - 1 : likes + 1));
  };

  // ─── Share / Download ─────────────────────────────────────────────────────
  const shareUrl = `https://x-hibit.vercel.app/screen/details/${id}`;
  const message = `Check out this artwork on X-Hibit 👇\n${shareUrl}`;

  const shareToFacebook = () =>
    Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`);

  const shareToX = () =>
    Linking.openURL(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
    );

  const shareToWhatsApp = () =>
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);

  const openInstagram = () => Linking.openURL("https://www.instagram.com/");

  const copyLink = async () => {
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const Clipboard = await import("expo-clipboard");
        await Clipboard.setStringAsync(shareUrl);
      }
      alert("Link copied!");
    } catch {
      alert("Failed to copy link");
    }
  };

  const systemShare = async () => {
    try {
      await Share.share({ message });
    } catch (error) {
      console.log(error);
    }
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      if (Platform.OS === "web") {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "x-hibit-image.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        alert("Download started!");
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission needed to save image");
        return;
      }
      const fileUri = FileSystem.documentDirectory + "x-hibit-image.jpg";
      const downloaded = await FileSystem.downloadAsync(imageUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      alert("Image saved to gallery!");
    } catch (error) {
      console.log(error);
      alert("Download failed");
    }
  };

  // ─── Header (no modals inside) ────────────────────────────────────────────
  const Header = () => (
    <>
      {/* Hero Image with Gradient */}
      <View style={{ width: "100%", height: 500 }}>
        <ImageBackground
          source={{ uri: post.image }}
          style={{ width: "100%", height: "100%" }}
        />
        <LinearGradient
          colors={["#030303", "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "60%",
          }}
        />
      </View>

      {/* Content Section */}
      <View style={{ width: "100%", marginTop: -100 }}>

        {/* Title & Description */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 50,
          }}
        >
          <Text style={{ color: "#fefefe", fontSize: 26, textAlign: "center" }}>
            {post.title}
          </Text>
          <Text style={{ color: "#D4D2D3", textAlign: "center", marginTop: 6 }}>
            {post.description}
          </Text>
        </View>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            paddingHorizontal: 10,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#4B4B4D",
              height: 56,
              flex: 1,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Artist</Text>
            <Text style={{ fontWeight: "bold", color: "#fefefe" }} numberOfLines={1}>
              {user.name}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#4B4B4D",
              height: 56,
              flex: 1,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              marginHorizontal: 10,
            }}
          >
            <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Type</Text>
            <Text style={{ fontWeight: "bold", color: "#fefefe" }} numberOfLines={1}>
              {post.category ?? "Painting"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#4B4B4D",
              height: 56,
              flex: 1,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Likes</Text>
            <Text
              style={{ fontWeight: "bold", color: "#fefefe", textAlign: "center" }}
            >
              {localLikes?.toLocaleString() ?? 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Like / Comment / Share Row */}
        <View
          style={{
            marginTop: 10,
            paddingHorizontal: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={toggleLike}>
              <Image
                source={isLiked ? Icons.heartActive : Icons.heartInactive}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
            <Text style={{ color: "#D4D2D3", marginHorizontal: 5 }}>
              {localLikes?.toLocaleString() ?? 0}
            </Text>
            <TouchableOpacity onPress={() => setCommentVisible(true)}>
              <Image source={Icons.comment} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
            <Text style={{ color: "#D4D2D3", marginHorizontal: 5 }}>
              {baseComments.length}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShareVisible(true)}>
            <Image source={Icons.share} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
        </View>

        {/* More by Artist */}
        {moreByArtist.length > 0 && (
          <View style={{ marginTop: 20, paddingLeft: 10 }}>
            <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
              More by {user.name}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
            >
              {moreByArtist.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/screen/details/${p.id}`)}
                >
                  <Image
                    source={{ uri: p.image }}
                    style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommendations */}
        <View style={{ marginTop: 20, paddingLeft: 10 }}>
          <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
            Recommendation
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
          >
            {postsData
              .filter((p) => p.userId !== post.userId && p.id !== post.id)
              .slice(0, 10)
              .map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/screen/details/${p.id}`)}
                >
                  <Image
                    source={{ uri: p.image }}
                    style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }}
                  />
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* More to Explore label */}
        <View style={{ marginTop: 20, paddingLeft: 10, paddingBottom: 10 }}>
          <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
            More to Explore
          </Text>
        </View>
      </View>
    </>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#030303" }}>

      <MasonryList
        data={postsData.filter((p) => p.id !== post.id)}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PostCard post={item as any} />}
        ListHeaderComponent={<Header />}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 40 }}
        nestedScrollEnabled
      />

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          zIndex: 100,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image source={Icons.back} style={{ width: 20, height: 20 }} />
      </TouchableOpacity>

      {/* ── SHARE MODAL ── */}
      <Modal
        visible={shareVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(24, 1, 1, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "#000000",
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fefefe", fontWeight: "bold", fontSize: 16 }}>
                Share
              </Text>
              <TouchableOpacity
                onPress={() => setShareVisible(false)}
                style={{
                  backgroundColor: "#1A1919",
                  width: 35,
                  height: 35,
                  borderRadius: 6,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={Icons.close}
                  style={{ width: 15, height: 15, tintColor: "#fefefe" }}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={{ color: "#686666", fontWeight: "bold", fontSize: 16, marginTop: 20 }}
            >
              Share link via
            </Text>
            <View
              style={{
                marginTop: 5,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {[
                { onPress: shareToFacebook, icon: Icons.facebook },
                { onPress: shareToWhatsApp, icon: Icons.whatsapp },
                { onPress: shareToX, icon: Icons.x },
                { onPress: openInstagram, icon: Icons.instagram },
                { onPress: () => downloadImage(post.image), icon: Icons.download },
              ].map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={btn.onPress}
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#1A1919",
                    padding: 10,
                    borderRadius: 12,
                    flex: 1,
                    marginLeft: idx === 0 ? 0 : 5,
                  }}
                >
                  <Image
                    source={btn.icon}
                    style={{ width: 30, height: 30, resizeMode: "contain" }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={{ color: "#686666", fontWeight: "bold", fontSize: 16, marginTop: 20 }}
            >
              Page Direct
            </Text>
            <TouchableOpacity
              onPress={copyLink}
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#1A1919",
                padding: 20,
                borderRadius: 12,
                marginTop: 10,
                marginHorizontal: 10,
                marginBottom: 10,
              }}
            >
              <Image
                source={Icons.copy}
                style={{ width: 30, height: 20, tintColor: "#00acee", marginRight: 5 }}
              />
              <Text style={{ color: "#fefefe", fontWeight: "bold", marginLeft: 5 }}>
                Copy Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── COMMENT MODAL ── */}
      <Modal
        visible={commentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentVisible(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          {/* Tap overlay to dismiss */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setCommentVisible(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "90%",         // ← always 90% of screen, anchored at bottom
            }}
          >
            <View
              style={{
                flex: 1,                   // ← fills the full 90% height of KAV
                backgroundColor: "#000",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden",
              }}
            >

              {/* Sheet header — fixed height */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#1A1919",
                }}
              >
                <Text style={{ color: "#fefefe", fontWeight: "bold", fontSize: 16 }}>
                  Comments
                </Text>
                <TouchableOpacity
                  onPress={() => setCommentVisible(false)}
                  style={{
                    backgroundColor: "#615a5a",
                    width: 35,
                    height: 35,
                    borderRadius: 6,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={Icons.close}
                    style={{ width: 15, height: 15, tintColor: "#fefefe" }}
                  />
                </TouchableOpacity>
              </View>

              {/* Comments list — flex:1 fills all remaining space */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  paddingTop: 12,
                  paddingBottom: 20,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {baseComments.length > 0 ? (
                  baseComments.map((comment) => {
                    const commentUser = getCommentUser(comment.userId);
                    return (
                      <View
                        key={comment.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <Image
                          source={{ uri: commentUser?.profilePicture }}
                          style={{
                            width: 35,
                            height: 35,
                            borderRadius: 20,
                            marginRight: 10,
                          }}
                        />
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: "#1A1919",
                            padding: 10,
                            borderEndEndRadius: 12,
                          }}
                        >
                          <Text style={{ color: "#fefefe", fontWeight: "bold" }}>
                            {commentUser?.name ?? "Unknown"}
                          </Text>
                          <Text style={{ color: "#D4D2D3", marginTop: 4 }}>
                            {comment.content}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text
                    style={{
                      color: "#686666",
                      textAlign: "center",
                      marginTop: 40,
                    }}
                  >
                    No comments yet. Be the first!
                  </Text>
                )}
              </ScrollView>

              {/* Input bar — fixed at the bottom of the sheet */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                  borderTopWidth: 1,
                  borderTopColor: "#333",
                  backgroundColor: "#000",
                }}
              >
                <TextInput
                  placeholder="Comment this artwork"
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  style={{
                    flex: 1,
                    backgroundColor: "#1A1A1A",
                    borderRadius: 10,
                    paddingHorizontal: 15,
                    color: "#fff",
                    height: 50,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (commentText.trim()) {
                      console.log("Submit comment:", commentText);
                      setCommentText("");
                    }
                  }}
                  style={{
                    marginLeft: 10,
                    width: 50,
                    height: 50,
                    backgroundColor: "#ED3237",
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image source={Icons.add} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
};

export default Details;
