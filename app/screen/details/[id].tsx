import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import type { Post, User } from "@/data/type";
import { useAllPosts } from "@/hooks/useAllPosts";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { usePost } from "@/hooks/usePost";
import { usePostLike } from "@/hooks/usePostLike";
import { useUserPosts } from "@/hooks/useUserPosts";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { PostWithAuthor } from "@/lib/mapPost";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* =========================
   🔥 RESPONSIVE BREAKPOINTS + MASONRY
   Plain flexbox columns instead of an onLayout-measured masonry library —
   items live in normal document flow inside their column, so they
   physically cannot overlap each other, even if images load at different
   times / sizes.
========================= */
const BREAKPOINTS = { tablet: 768, laptop: 1024, desktop: 1440 };

function getColumnCount(width: number) {
  if (width >= BREAKPOINTS.desktop) return 6;
  if (width >= BREAKPOINTS.laptop) return 5;
  if (width >= BREAKPOINTS.tablet) return 3;
  return 2;
}

function distributeToColumns<T>(items: T[], columnCount: number): T[][] {
  const cols: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => cols[i % columnCount].push(item));
  return cols;
}

// ── Small shared bits ─────────────────────────────────────────────────────
function CenteredMessage({
  children,
  color = "#fff",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#030303",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {typeof children === "string" ? (
        <Text style={{ color }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// Small horizontal thumbnail used in "More by artist" / "Recommendation" rows
const HorizontalThumb = memo(function HorizontalThumb({
  post,
  onPress,
}: {
  post: PostWithAuthor;
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity onPress={() => onPress(post.id)}>
      <Image
        source={{ uri: post.image }}
        style={{ width: 150, height: 200, borderRadius: 10, marginRight: 10 }}
      />
    </TouchableOpacity>
  );
});

// ── Scrollable row with chevron buttons ────────────────────────────────────
// Replaces a plain FlatList so desktop users get a click target instead of
// relying only on trackpad/drag scrolling. FlatList horizontal has no clean
// "scroll by N px" API, so this uses ScrollView + a ref, tracking the
// current offset in a ref (not state, so scrolling doesn't trigger
// re-renders) and adding/subtracting a fixed step from it per click.
const ScrollableRow = memo(function ScrollableRow({
  title,
  items,
  onPress,
  isDesktop,
}: {
  title: string;
  items: PostWithAuthor[];
  onPress: (id: string) => void;
  isDesktop: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const STEP = (150 + 10) * 3; // scroll roughly 3 thumbnails per click

  const scrollByAmount = useCallback((dir: 1 | -1) => {
    const next = Math.max(0, offsetRef.current + dir * STEP);
    scrollRef.current?.scrollTo({ x: next, animated: true });
    offsetRef.current = next;
  }, []);

  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: 20, paddingLeft: isDesktop ? 0 : 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: isDesktop ? 0 : 10,
        }}
      >
        <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>{title}</Text>

        {/* Chevrons only make sense with a mouse — mobile keeps native swipe */}
        {isDesktop && (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={() => scrollByAmount(-1)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#1A1919",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fefefe", fontSize: 14 }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => scrollByAmount(1)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#1A1919",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fefefe", fontSize: 14 }}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          offsetRef.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        style={{ marginTop: 10 }}
      >
        {items.map((item) => (
          <HorizontalThumb key={item.id} post={item} onPress={onPress} />
        ))}
      </ScrollView>
    </View>
  );
});

// ── Memoized header ───────────────────────────────────────────────────────
type DetailsHeaderProps = {
  post: Post;
  author: User;
  localLikes: number;
  isLiked: boolean;
  commentsCount: number;
  moreByArtist: PostWithAuthor[];
  recommendations: PostWithAuthor[];
  isDesktop: boolean;
  onImagePress: () => void;
  onAuthorPress: () => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onPressExploreItem: (id: string) => void;
};

const DetailsHeader = memo(function DetailsHeader({
  post,
  author,
  localLikes,
  isLiked,
  commentsCount,
  moreByArtist,
  recommendations,
  isDesktop,
  onImagePress,
  onAuthorPress,
  onToggleLike,
  onOpenComments,
  onOpenShare,
  onPressExploreItem,
}: DetailsHeaderProps) {
  const statsRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
        ...(isDesktop ? {} : { justifyContent: "center", paddingHorizontal: 10 }),
      }}
    >
      <TouchableOpacity
        onPress={onAuthorPress}
        style={{
          backgroundColor: "#4B4B4D",
          height: 56,
          flex: isDesktop ? undefined : 1,
          width: isDesktop ? 140 : undefined,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Artist</Text>
        <Text style={{ fontWeight: "bold", color: "#fefefe" }} numberOfLines={1}>
          {author.name}
        </Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: "#4B4B4D",
          height: 56,
          flex: isDesktop ? undefined : 1,
          width: isDesktop ? 140 : undefined,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Type</Text>
        <Text style={{ fontWeight: "bold", color: "#fefefe" }} numberOfLines={1}>
          {post.category ?? "Painting"}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#4B4B4D",
          height: 56,
          flex: isDesktop ? undefined : 1,
          width: isDesktop ? 140 : undefined,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Likes</Text>
        <Text style={{ fontWeight: "bold", color: "#fefefe", textAlign: "center" }}>
          {localLikes?.toLocaleString() ?? 0}
        </Text>
      </View>
    </View>
  );

  const actionRow = (
    <View
      style={{
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isDesktop ? "flex-start" : "space-between",
        gap: isDesktop ? 20 : 0,
        ...(isDesktop ? {} : { paddingHorizontal: 10 }),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={onToggleLike}>
          <Image
            source={isLiked ? Icons.heartActive : Icons.heartInactive}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
        <Text style={{ color: "#D4D2D3", marginHorizontal: 5 }}>
          {localLikes?.toLocaleString() ?? 0}
        </Text>
        <TouchableOpacity onPress={onOpenComments}>
          <Image source={Icons.comment} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
        <Text style={{ color: "#D4D2D3", marginHorizontal: 5 }}>{commentsCount}</Text>
      </View>
      <TouchableOpacity onPress={onOpenShare}>
        <Image source={Icons.share} style={{ width: 20, height: 20 }} />
      </TouchableOpacity>
    </View>
  );

  const artistRow = (
    <ScrollableRow
      title={`More by ${author.name}`}
      items={moreByArtist}
      onPress={onPressExploreItem}
      isDesktop={isDesktop}
    />
  );

  const recommendationRow = (
    <ScrollableRow
      title="Recommendation"
      items={recommendations}
      onPress={onPressExploreItem}
      isDesktop={isDesktop}
    />
  );

  const exploreLabel = (
    <View style={{ marginTop: 20, paddingLeft: isDesktop ? 0 : 10, paddingBottom: 10 }}>
      <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
        More to Explore
      </Text>
    </View>
  );

  /* =========================
     DESKTOP — Pinterest pin-detail layout: image pinned left, everything
     else flows in a right-hand column. `position: sticky` only actually
     works on web (react-native-web maps it to real CSS); on native it's
     ignored and the image just scrolls normally, which is fine since
     native doesn't have the wide-viewport case this is solving for.
  ========================= */
  if (isDesktop) {
    return (
      <View style={{ maxWidth: 1400, width: "100%", alignSelf: "center", paddingHorizontal: 24, paddingTop: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 32 }}>
          <View
            style={
              Platform.OS === "web"
                ? ({ position: "sticky", top: 24, width: 440 } as any)
                : { width: 440 }
            }
          >
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={onImagePress}
              style={{ borderRadius: 24, overflow: "hidden" }}
            >
              <Image
                source={{ uri: post.image }}
                style={{ width: "100%", height: 520, borderRadius: 24 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, minWidth: 320 }}>
            <Text style={{ color: "#fefefe", fontSize: 30, fontWeight: "bold" }}>
              {post.title}
            </Text>
            <Text style={{ color: "#D4D2D3", marginTop: 8, fontSize: 15, lineHeight: 22 }}>
              {post.description}
            </Text>

            {statsRow}
            {actionRow}
            {artistRow}
            {recommendationRow}
          </View>
        </View>

        {exploreLabel}
      </View>
    );
  }

  /* =========================
     MOBILE — original stacked hero layout, unchanged.
  ========================= */
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onImagePress}
        style={{ width: "100%", height: 500 }}
      >
        <Image
          source={{ uri: post.image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["#030303", "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" }}
        />
      </TouchableOpacity>

      <View style={{ width: "100%", marginTop: -100 }}>
        <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 50 }}>
          <Text style={{ color: "#fefefe", fontSize: 26, textAlign: "center" }}>
            {post.title}
          </Text>
          <Text style={{ color: "#D4D2D3", textAlign: "center", marginTop: 6 }}>
            {post.description}
          </Text>
        </View>

        {statsRow}
        {actionRow}
        {artistRow}
        {recommendationRow}
        {exploreLabel}
      </View>
    </>
  );
});

const Details = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINTS.laptop; // split kicks in at laptop width — tablet is too cramped for the right column's content
  const numColumns = getColumnCount(width);

  const { profile: viewer, session, loading: authLoading } = useAuth();

  // ─── Route params ─────────────────────────────────────────────────────────
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (!authLoading && !session && id) {
      router.replace(`/authscreen/login?redirect=/screen/details/${id}`);
    }
  }, [authLoading, session, id, router]);

  // ─── Real data ──────────────────────────────────────────────────────────
  const { post, loading: postLoading, error: postError } = usePost(id);
  const { profile: author, loading: authorLoading } = useUserProfile(post?.userId);

  const { posts: authorPosts } = useUserPosts(post?.userId);
  const moreByArtist = useMemo(
    () => authorPosts.filter((p) => p.id !== post?.id),
    [authorPosts, post?.id]
  );

  const mainLoading = postLoading || authorLoading;

  const { posts: recommendations } = useAllPosts({
    excludeUserId: post?.userId,
    excludeId: post?.id,
    limit: 10,
    enabled: !mainLoading && !!post,
  });

  const { posts: gridPosts } = useAllPosts({
    excludeId: post?.id,
    enabled: !mainLoading && !!post,
  });

  const gridColumns = useMemo(
    () => distributeToColumns(gridPosts, numColumns),
    [gridPosts, numColumns]
  );

  // Real pixel width per column — PostCard needs this to size its Image,
  // since aspectRatio-based height calc requires a concrete width, not a
  // flex:1 that only resolves after layout.
  const GRID_GAP = 14;
  const GRID_PADDING = 10; // matches paddingHorizontal on the grid container below

  const gridColumnWidth = useMemo(() => {
    const containerWidth = (isDesktop ? Math.min(width, 1400) : width) - GRID_PADDING * 2;
    return (containerWidth - GRID_GAP * (numColumns - 1)) / numColumns;
  }, [width, isDesktop, numColumns]);

  const {
    comments,
    loading: commentsLoading,
    addComment,
  } = useComments(post?.id, { enabled: commentVisible });

  const { isLiked, likes: localLikes, toggleLike } = usePostLike(
    post?.id,
    viewer?.id,
    post?.likes ?? 0
  );

  // ─── Share / Download ─────────────────────────────────────────────────────
  const shareUrl = `https://x-hibit.vercel.app/screen/details/${id}`;
  const message = `Check out this artwork on X-Hibit 👇\n${shareUrl}`;

  const shareToFacebook = useCallback(
    () => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`),
    [shareUrl]
  );
  const shareToX = useCallback(
    () =>
      Linking.openURL(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
      ),
    [message]
  );
  const shareToWhatsApp = useCallback(
    () => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`),
    [message]
  );
  const openInstagram = useCallback(() => Linking.openURL("https://www.instagram.com/"), []);

  const copyLink = useCallback(async () => {
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
  }, [shareUrl]);

  const systemShare = useCallback(async () => {
    try {
      await Share.share({ message });
    } catch (error) {
      console.log(error);
    }
  }, [message]);

  const downloadImage = useCallback(async (imageUrl: string) => {
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
  }, []);

  // ─── Stable handlers ─────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/screen");
    }
  }, [router]);

  const openShareModal = useCallback(() => setShareVisible(true), []);
  const closeShareModal = useCallback(() => setShareVisible(false), []);
  const openCommentModal = useCallback(() => setCommentVisible(true), []);
  const closeCommentModal = useCallback(() => setCommentVisible(false), []);
  const openImageViewer = useCallback(() => setImageViewerVisible(true), []);
  const closeImageViewer = useCallback(() => setImageViewerVisible(false), []);

  const handleToggleLike = useCallback(() => {
    if (!session) {
      router.push("/authscreen/login");
      return;
    }
    toggleLike();
  }, [session, router, toggleLike]);

  const handleSubmitComment = useCallback(async () => {
    if (!session || !viewer) {
      router.push("/authscreen/login");
      return;
    }
    const content = commentText.trim();
    if (!content || postingComment) return;

    setPostingComment(true);
    const result = await addComment(viewer.id, content);
    setPostingComment(false);

    if (result) {
      setCommentText("");
    }
  }, [session, viewer, router, commentText, postingComment, addComment]);

  const goToAuthor = useCallback(() => {
    if (author) router.push(`/screen/users/${author.id}`);
  }, [router, author]);

  const goToPost = useCallback(
    (postId: string) => router.push(`/screen/details/${postId}`),
    [router]
  );

  // ── Everything above this line is hooks + plain values. ──

  if (!authLoading && !session) {
    return <CenteredMessage>Redirecting to login…</CenteredMessage>;
  }

  if (authLoading || mainLoading) {
    return (
      <CenteredMessage>
        <ActivityIndicator color="#fff" />
      </CenteredMessage>
    );
  }

  if (!post || !author) {
    return (
      <CenteredMessage>
        <Text style={{ color: "#fff" }}>{postError || "Post not found."}</Text>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 12 }}>
          <Text style={{ color: "#D4D2D3" }}>Go Back</Text>
        </TouchableOpacity>
      </CenteredMessage>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#030303" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <DetailsHeader
          post={post}
          author={author}
          localLikes={localLikes ?? 0}
          isLiked={isLiked}
          commentsCount={comments.length}
          moreByArtist={moreByArtist}
          recommendations={recommendations}
          isDesktop={isDesktop}
          onImagePress={openImageViewer}
          onAuthorPress={goToAuthor}
          onToggleLike={handleToggleLike}
          onOpenComments={openCommentModal}
          onOpenShare={openShareModal}
          onPressExploreItem={goToPost}
        />

        {/* Explore grid — plain flexbox columns, fixed pixel widths, can't overlap */}
        <View
          style={{
            paddingHorizontal: GRID_PADDING,
            maxWidth: isDesktop ? 1400 : undefined,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: GRID_GAP }}>
            {gridColumns.map((col, colIndex) => (
              <View key={colIndex} style={{ gap: GRID_GAP }}>
                {col.map((item) => (
                  <PostCard key={item.id} post={item as any} cardWidth={gridColumnWidth} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        onPress={goBack}
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
        onRequestClose={closeShareModal}
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
              width: isDesktop ? 420 : "80%",
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
                onPress={closeShareModal}
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

      {/* ── FULL-SCREEN IMAGE VIEWER ── */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeImageViewer}
          style={{
            flex: 1,
            backgroundColor: "#000000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: post.image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={closeImageViewer}
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 16,
              backgroundColor: "rgba(255,255,255,0.15)",
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={Icons.close}
              style={{ width: 18, height: 18, tintColor: "#fff" }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── COMMENT MODAL ── */}
      <Modal
        visible={commentVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCommentModal}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeCommentModal}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "90%",
              ...(isDesktop
                ? { maxWidth: 480, right: 0, left: undefined, alignSelf: "flex-end" as const }
                : {}),
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#000",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden",
              }}
            >
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
                  onPress={closeCommentModal}
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
                {commentsLoading ? (
                  <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <View
                      key={comment.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <Image
                        source={{ uri: comment.authorAvatar }}
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
                          {comment.authorName ?? "Unknown"}
                        </Text>
                        <Text style={{ color: "#D4D2D3", marginTop: 4 }}>
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#686666", textAlign: "center", marginTop: 40 }}>
                    No comments yet. Be the first!
                  </Text>
                )}
              </ScrollView>

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
                  onPress={handleSubmitComment}
                  disabled={postingComment}
                  style={{
                    marginLeft: 10,
                    width: 50,
                    height: 50,
                    backgroundColor: "#ED3237",
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: postingComment ? 0.6 : 1,
                  }}
                >
                  {postingComment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Image source={Icons.add} style={{ width: 20, height: 20 }} />
                  )}
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

// import PostCard from "@/components/PostCard";
// import { Icons } from "@/constants/icons";
// import type { Post, User } from "@/data/type";
// import { useAllPosts } from "@/hooks/useAllPosts";
// import { useAuth } from "@/hooks/useAuth";
// import { useComments } from "@/hooks/useComments";
// import { usePost } from "@/hooks/usePost";
// import { usePostLike } from "@/hooks/usePostLike";
// import { useUserPosts } from "@/hooks/useUserPosts";
// import { useUserProfile } from "@/hooks/useUserProfile";
// import type { PostWithAuthor } from "@/lib/mapPost";
// import * as FileSystem from "expo-file-system/legacy";
// import { LinearGradient } from "expo-linear-gradient";
// import * as MediaLibrary from "expo-media-library";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { memo, useCallback, useEffect, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   KeyboardAvoidingView,
//   Linking,
//   Modal,
//   Platform,
//   ScrollView,
//   Share,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useWindowDimensions,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// /* =========================
//    🔥 RESPONSIVE BREAKPOINTS + MASONRY
//    Same pattern as ProfileScreen. Plain flexbox columns instead of an
//    onLayout-measured masonry library — items live in normal document flow
//    inside their column, so they physically cannot overlap each other, even
//    if images load at different times / sizes.
// ========================= */
// const BREAKPOINTS = { tablet: 768, laptop: 1024, desktop: 1440 };

// function getColumnCount(width: number) {
//   if (width >= BREAKPOINTS.desktop) return 6;
//   if (width >= BREAKPOINTS.laptop) return 5;
//   if (width >= BREAKPOINTS.tablet) return 3;
//   return 2;
// }

// function distributeToColumns<T>(items: T[], columnCount: number): T[][] {
//   const cols: T[][] = Array.from({ length: columnCount }, () => []);
//   items.forEach((item, i) => cols[i % columnCount].push(item));
//   return cols;
// }

// // ── Small shared bits ─────────────────────────────────────────────────────
// function CenteredMessage({
//   children,
//   color = "#fff",
// }: {
//   children: React.ReactNode;
//   color?: string;
// }) {
//   return (
//     <View
//       style={{
//         flex: 1,
//         backgroundColor: "#030303",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       {typeof children === "string" ? (
//         <Text style={{ color }}>{children}</Text>
//       ) : (
//         children
//       )}
//     </View>
//   );
// }

// // Small horizontal thumbnail used in "More by artist" / "Recommendation" rows
// const HorizontalThumb = memo(function HorizontalThumb({
//   post,
//   onPress,
// }: {
//   post: PostWithAuthor;
//   onPress: (id: string) => void;
// }) {
//   return (
//     <TouchableOpacity onPress={() => onPress(post.id)}>
//       <Image
//         source={{ uri: post.image }}
//         style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }}
//       />
//     </TouchableOpacity>
//   );
// });

// // ── Memoized header ───────────────────────────────────────────────────────
// type DetailsHeaderProps = {
//   post: Post;
//   author: User;
//   localLikes: number;
//   isLiked: boolean;
//   commentsCount: number;
//   moreByArtist: PostWithAuthor[];
//   recommendations: PostWithAuthor[];
//   isDesktop: boolean;
//   onImagePress: () => void;
//   onAuthorPress: () => void;
//   onToggleLike: () => void;
//   onOpenComments: () => void;
//   onOpenShare: () => void;
//   onPressExploreItem: (id: string) => void;
// };

// const DetailsHeader = memo(function DetailsHeader({
//   post,
//   author,
//   localLikes,
//   isLiked,
//   commentsCount,
//   moreByArtist,
//   recommendations,
//   isDesktop,
//   onImagePress,
//   onAuthorPress,
//   onToggleLike,
//   onOpenComments,
//   onOpenShare,
//   onPressExploreItem,
// }: DetailsHeaderProps) {
//   // Shared blocks reused by both layouts so we don't fork the JSX twice
//   const statsRow = (
//     <View
//       style={{
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 10,
//         marginTop: 10,
//         ...(isDesktop ? {} : { justifyContent: "center", paddingHorizontal: 10 }),
//       }}
//     >
//       <TouchableOpacity
//         onPress={onAuthorPress}
//         style={{
//           backgroundColor: "#4B4B4D",
//           height: 56,
//           flex: isDesktop ? undefined : 1,
//           width: isDesktop ? 140 : undefined,
//           borderRadius: 8,
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Artist</Text>
//         <Text style={{ fontWeight: "bold", color: "#fefefe" }} numberOfLines={1}>
//           {author.name}
//         </Text>
//       </TouchableOpacity>

//       <View
//         style={{
//           backgroundColor: "#4B4B4D",
//           height: 56,
//           flex: isDesktop ? undefined : 1,
//           width: isDesktop ? 140 : undefined,
//           borderRadius: 8,
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Type</Text>
//         <Text style={{ fontWeight: "bold", color: "#fefefe" }} numberOfLines={1}>
//           {post.category ?? "Painting"}
//         </Text>
//       </View>

//       <View
//         style={{
//           backgroundColor: "#4B4B4D",
//           height: 56,
//           flex: isDesktop ? undefined : 1,
//           width: isDesktop ? 140 : undefined,
//           borderRadius: 8,
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Likes</Text>
//         <Text style={{ fontWeight: "bold", color: "#fefefe", textAlign: "center" }}>
//           {localLikes?.toLocaleString() ?? 0}
//         </Text>
//       </View>
//     </View>
//   );

//   const actionRow = (
//     <View
//       style={{
//         marginTop: 14,
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: isDesktop ? "flex-start" : "space-between",
//         gap: isDesktop ? 20 : 0,
//         ...(isDesktop ? {} : { paddingHorizontal: 10 }),
//       }}
//     >
//       <View style={{ flexDirection: "row", alignItems: "center" }}>
//         <TouchableOpacity onPress={onToggleLike}>
//           <Image
//             source={isLiked ? Icons.heartActive : Icons.heartInactive}
//             style={{ width: 20, height: 20 }}
//           />
//         </TouchableOpacity>
//         <Text style={{ color: "#D4D2D3", marginHorizontal: 5 }}>
//           {localLikes?.toLocaleString() ?? 0}
//         </Text>
//         <TouchableOpacity onPress={onOpenComments}>
//           <Image source={Icons.comment} style={{ width: 20, height: 20 }} />
//         </TouchableOpacity>
//         <Text style={{ color: "#D4D2D3", marginHorizontal: 5 }}>{commentsCount}</Text>
//       </View>
//       <TouchableOpacity onPress={onOpenShare}>
//         <Image source={Icons.share} style={{ width: 20, height: 20 }} />
//       </TouchableOpacity>
//     </View>
//   );

//   const artistRow = moreByArtist.length > 0 && (
//     <View style={{ marginTop: 20, paddingLeft: isDesktop ? 0 : 10 }}>
//       <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
//         More by {author.name}
//       </Text>
//       <FlatList
//         horizontal
//         data={moreByArtist}
//         keyExtractor={(item) => item.id}
//         showsHorizontalScrollIndicator={false}
//         style={{ marginTop: 10 }}
//         renderItem={({ item }) => (
//           <HorizontalThumb post={item} onPress={onPressExploreItem} />
//         )}
//       />
//     </View>
//   );

//   const recommendationRow = recommendations.length > 0 && (
//     <View style={{ marginTop: 20, paddingLeft: isDesktop ? 0 : 10 }}>
//       <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
//         Recommendation
//       </Text>
//       <FlatList
//         horizontal
//         data={recommendations}
//         keyExtractor={(item) => item.id}
//         showsHorizontalScrollIndicator={false}
//         style={{ marginTop: 10 }}
//         renderItem={({ item }) => (
//           <HorizontalThumb post={item} onPress={onPressExploreItem} />
//         )}
//       />
//     </View>
//   );

//   const exploreLabel = (
//     <View style={{ marginTop: 20, paddingLeft: isDesktop ? 0 : 10, paddingBottom: 10 }}>
//       <Text style={{ color: "#BDBFC1", fontSize: 16, fontWeight: "bold" }}>
//         More to Explore
//       </Text>
//     </View>
//   );

//   /* =========================
//      DESKTOP — Pinterest pin-detail layout: image pinned left, everything
//      else flows in a right-hand column. `position: sticky` only actually
//      works on web (react-native-web maps it to real CSS); on native it's
//      ignored and the image just scrolls normally, which is fine since
//      native doesn't have the wide-viewport case this is solving for.
//   ========================= */
//   if (isDesktop) {
//     return (
//       <View style={{ maxWidth: 1400, width: "100%", alignSelf: "center", paddingHorizontal: 24, paddingTop: 24 }}>
//         <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 32 }}>
//           <View
//             style={
//               Platform.OS === "web"
//                 ? ({ position: "sticky", top: 24, width: 440 } as any)
//                 : { width: 440 }
//             }
//           >
//             <TouchableOpacity
//               activeOpacity={0.95}
//               onPress={onImagePress}
//               style={{ borderRadius: 24, overflow: "hidden" }}
//             >
//               <Image
//                 source={{ uri: post.image }}
//                 style={{ width: "100%", height: 520, borderRadius: 24 }}
//                 resizeMode="cover"
//               />
//             </TouchableOpacity>
//           </View>

//           <View style={{ flex: 1, minWidth: 320 }}>
//             <Text style={{ color: "#fefefe", fontSize: 30, fontWeight: "bold" }}>
//               {post.title}
//             </Text>
//             <Text style={{ color: "#D4D2D3", marginTop: 8, fontSize: 15, lineHeight: 22 }}>
//               {post.description}
//             </Text>

//             {statsRow}
//             {actionRow}
//             {artistRow}
//             {recommendationRow}
//           </View>
//         </View>

//         {exploreLabel}
//       </View>
//     );
//   }

//   /* =========================
//      MOBILE — original stacked hero layout, unchanged.
//   ========================= */
//   return (
//     <>
//       <TouchableOpacity
//         activeOpacity={0.95}
//         onPress={onImagePress}
//         style={{ width: "100%", height: 500 }}
//       >
//         <Image
//           source={{ uri: post.image }}
//           style={{ width: "100%", height: "100%" }}
//           resizeMode="cover"
//         />
//         <LinearGradient
//           colors={["#030303", "transparent"]}
//           start={{ x: 0, y: 1 }}
//           end={{ x: 0, y: 0 }}
//           style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" }}
//         />
//       </TouchableOpacity>

//       <View style={{ width: "100%", marginTop: -100 }}>
//         <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 50 }}>
//           <Text style={{ color: "#fefefe", fontSize: 26, textAlign: "center" }}>
//             {post.title}
//           </Text>
//           <Text style={{ color: "#D4D2D3", textAlign: "center", marginTop: 6 }}>
//             {post.description}
//           </Text>
//         </View>

//         {statsRow}
//         {actionRow}
//         {artistRow}
//         {recommendationRow}
//         {exploreLabel}
//       </View>
//     </>
//   );
// });

// const Details = () => {
//   // ─── State ────────────────────────────────────────────────────────────────
//   const [shareVisible, setShareVisible] = useState(false);
//   const [commentVisible, setCommentVisible] = useState(false);
//   const [imageViewerVisible, setImageViewerVisible] = useState(false);
//   const [commentText, setCommentText] = useState("");
//   const [postingComment, setPostingComment] = useState(false);

//   // ─── Hooks ────────────────────────────────────────────────────────────────
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= BREAKPOINTS.laptop; // split kicks in at laptop width — tablet is too cramped for the right column's content
//   const numColumns = getColumnCount(width);

//   const { profile: viewer, session, loading: authLoading } = useAuth();

//   // ─── Route params ─────────────────────────────────────────────────────────
//   const { id } = useLocalSearchParams<{ id: string }>();

//   useEffect(() => {
//     if (!authLoading && !session && id) {
//       router.replace(`/authscreen/login?redirect=/screen/details/${id}`);
//     }
//   }, [authLoading, session, id, router]);

//   // ─── Real data ──────────────────────────────────────────────────────────
//   const { post, loading: postLoading, error: postError } = usePost(id);
//   const { profile: author, loading: authorLoading } = useUserProfile(post?.userId);

//   const { posts: authorPosts } = useUserPosts(post?.userId);
//   const moreByArtist = useMemo(
//     () => authorPosts.filter((p) => p.id !== post?.id),
//     [authorPosts, post?.id]
//   );

//   const mainLoading = postLoading || authorLoading;

//   const { posts: recommendations } = useAllPosts({
//     excludeUserId: post?.userId,
//     excludeId: post?.id,
//     limit: 10,
//     enabled: !mainLoading && !!post,
//   });

//   const { posts: gridPosts } = useAllPosts({
//     excludeId: post?.id,
//     enabled: !mainLoading && !!post,
//   });

//   const gridColumns = useMemo(
//     () => distributeToColumns(gridPosts, numColumns),
//     [gridPosts, numColumns]
//   );

//   const {
//     comments,
//     loading: commentsLoading,
//     addComment,
//   } = useComments(post?.id, { enabled: commentVisible });

//   const { isLiked, likes: localLikes, toggleLike } = usePostLike(
//     post?.id,
//     viewer?.id,
//     post?.likes ?? 0
//   );

//   // ─── Share / Download ─────────────────────────────────────────────────────
//   const shareUrl = `https://x-hibit.vercel.app/screen/details/${id}`;
//   const message = `Check out this artwork on X-Hibit 👇\n${shareUrl}`;

//   const shareToFacebook = useCallback(
//     () => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`),
//     [shareUrl]
//   );
//   const shareToX = useCallback(
//     () =>
//       Linking.openURL(
//         `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
//       ),
//     [message]
//   );
//   const shareToWhatsApp = useCallback(
//     () => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`),
//     [message]
//   );
//   const openInstagram = useCallback(() => Linking.openURL("https://www.instagram.com/"), []);

//   const copyLink = useCallback(async () => {
//     try {
//       if (Platform.OS === "web") {
//         await navigator.clipboard.writeText(shareUrl);
//       } else {
//         const Clipboard = await import("expo-clipboard");
//         await Clipboard.setStringAsync(shareUrl);
//       }
//       alert("Link copied!");
//     } catch {
//       alert("Failed to copy link");
//     }
//   }, [shareUrl]);

//   const systemShare = useCallback(async () => {
//     try {
//       await Share.share({ message });
//     } catch (error) {
//       console.log(error);
//     }
//   }, [message]);

//   const downloadImage = useCallback(async (imageUrl: string) => {
//     try {
//       if (Platform.OS === "web") {
//         const response = await fetch(imageUrl);
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.download = "x-hibit-image.jpg";
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);
//         alert("Download started!");
//         return;
//       }
//       const { status } = await MediaLibrary.requestPermissionsAsync();
//       if (status !== "granted") {
//         alert("Permission needed to save image");
//         return;
//       }
//       const fileUri = FileSystem.documentDirectory + "x-hibit-image.jpg";
//       const downloaded = await FileSystem.downloadAsync(imageUrl, fileUri);
//       await MediaLibrary.saveToLibraryAsync(downloaded.uri);
//       alert("Image saved to gallery!");
//     } catch (error) {
//       console.log(error);
//       alert("Download failed");
//     }
//   }, []);

//   // ─── Stable handlers ─────────────────────────────────────────────────────
//   const goBack = useCallback(() => {
//     if (router.canGoBack()) {
//       router.back();
//     } else {
//       router.replace("/screen");
//     }
//   }, [router]);

//   const openShareModal = useCallback(() => setShareVisible(true), []);
//   const closeShareModal = useCallback(() => setShareVisible(false), []);
//   const openCommentModal = useCallback(() => setCommentVisible(true), []);
//   const closeCommentModal = useCallback(() => setCommentVisible(false), []);
//   const openImageViewer = useCallback(() => setImageViewerVisible(true), []);
//   const closeImageViewer = useCallback(() => setImageViewerVisible(false), []);

//   const handleToggleLike = useCallback(() => {
//     if (!session) {
//       router.push("/authscreen/login");
//       return;
//     }
//     toggleLike();
//   }, [session, router, toggleLike]);

//   const handleSubmitComment = useCallback(async () => {
//     if (!session || !viewer) {
//       router.push("/authscreen/login");
//       return;
//     }
//     const content = commentText.trim();
//     if (!content || postingComment) return;

//     setPostingComment(true);
//     const result = await addComment(viewer.id, content);
//     setPostingComment(false);

//     if (result) {
//       setCommentText("");
//     }
//   }, [session, viewer, router, commentText, postingComment, addComment]);

//   const goToAuthor = useCallback(() => {
//     if (author) router.push(`/screen/users/${author.id}`);
//   }, [router, author]);

//   const goToPost = useCallback(
//     (postId: string) => router.push(`/screen/details/${postId}`),
//     [router]
//   );

//   // ── Everything above this line is hooks + plain values. ──

//   if (!authLoading && !session) {
//     return <CenteredMessage>Redirecting to login…</CenteredMessage>;
//   }

//   if (authLoading || mainLoading) {
//     return (
//       <CenteredMessage>
//         <ActivityIndicator color="#fff" />
//       </CenteredMessage>
//     );
//   }

//   if (!post || !author) {
//     return (
//       <CenteredMessage>
//         <Text style={{ color: "#fff" }}>{postError || "Post not found."}</Text>
//         <TouchableOpacity onPress={goBack} style={{ marginTop: 12 }}>
//           <Text style={{ color: "#D4D2D3" }}>Go Back</Text>
//         </TouchableOpacity>
//       </CenteredMessage>
//     );
//   }

//   // ─── Render ───────────────────────────────────────────────────────────────
//   return (
//     <View style={{ flex: 1, backgroundColor: "#030303" }}>
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 40 }}
//       >
//         <DetailsHeader
//           post={post}
//           author={author}
//           localLikes={localLikes ?? 0}
//           isLiked={isLiked}
//           commentsCount={comments.length}
//           moreByArtist={moreByArtist}
//           recommendations={recommendations}
//           isDesktop={isDesktop}
//           onImagePress={openImageViewer}
//           onAuthorPress={goToAuthor}
//           onToggleLike={handleToggleLike}
//           onOpenComments={openCommentModal}
//           onOpenShare={openShareModal}
//           onPressExploreItem={goToPost}
//         />

//         {/* Explore grid — plain flexbox columns, can't overlap */}
//         <View
//           style={{
//             paddingHorizontal: 10,
//             maxWidth: isDesktop ? 1400 : undefined,
//             width: "100%",
//             alignSelf: "center",
//           }}
//         >
//           <View style={{ flexDirection: "row", gap: 14 }}>
//             {gridColumns.map((col, colIndex) => (
//               <View key={colIndex} style={{ flex: 1, gap: 14 }}>
//                 {col.map((item) => (
//                   <PostCard key={item.id} post={item as any} />
//                 ))}
//               </View>
//             ))}
//           </View>
//         </View>
//       </ScrollView>

//       {/* Back Button */}
//       <TouchableOpacity
//         onPress={goBack}
//         style={{
//           position: "absolute",
//           top: insets.top + 12,
//           left: 16,
//           zIndex: 100,
//           backgroundColor: "rgba(0, 0, 0, 0.5)",
//           width: 40,
//           height: 40,
//           borderRadius: 20,
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <Image source={Icons.back} style={{ width: 20, height: 20 }} />
//       </TouchableOpacity>

//       {/* ── SHARE MODAL ── */}
//       <Modal
//         visible={shareVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={closeShareModal}
//       >
//         <View
//           style={{
//             flex: 1,
//             backgroundColor: "rgba(24, 1, 1, 0.5)",
//             justifyContent: "center",
//             alignItems: "center",
//           }}
//         >
//           <View
//             style={{
//               width: isDesktop ? 420 : "80%",
//               backgroundColor: "#000000",
//               paddingHorizontal: 10,
//               paddingVertical: 10,
//               borderRadius: 12,
//             }}
//           >
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={{ color: "#fefefe", fontWeight: "bold", fontSize: 16 }}>
//                 Share
//               </Text>
//               <TouchableOpacity
//                 onPress={closeShareModal}
//                 style={{
//                   backgroundColor: "#1A1919",
//                   width: 35,
//                   height: 35,
//                   borderRadius: 6,
//                   justifyContent: "center",
//                   alignItems: "center",
//                 }}
//               >
//                 <Image
//                   source={Icons.close}
//                   style={{ width: 15, height: 15, tintColor: "#fefefe" }}
//                 />
//               </TouchableOpacity>
//             </View>

//             <Text
//               style={{ color: "#686666", fontWeight: "bold", fontSize: 16, marginTop: 20 }}
//             >
//               Share link via
//             </Text>
//             <View
//               style={{
//                 marginTop: 5,
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               {[
//                 { onPress: shareToFacebook, icon: Icons.facebook },
//                 { onPress: shareToWhatsApp, icon: Icons.whatsapp },
//                 { onPress: shareToX, icon: Icons.x },
//                 { onPress: openInstagram, icon: Icons.instagram },
//                 { onPress: () => downloadImage(post.image), icon: Icons.download },
//               ].map((btn, idx) => (
//                 <TouchableOpacity
//                   key={idx}
//                   onPress={btn.onPress}
//                   style={{
//                     justifyContent: "center",
//                     alignItems: "center",
//                     backgroundColor: "#1A1919",
//                     padding: 10,
//                     borderRadius: 12,
//                     flex: 1,
//                     marginLeft: idx === 0 ? 0 : 5,
//                   }}
//                 >
//                   <Image
//                     source={btn.icon}
//                     style={{ width: 30, height: 30, resizeMode: "contain" }}
//                   />
//                 </TouchableOpacity>
//               ))}
//             </View>

//             <Text
//               style={{ color: "#686666", fontWeight: "bold", fontSize: 16, marginTop: 20 }}
//             >
//               Page Direct
//             </Text>
//             <TouchableOpacity
//               onPress={copyLink}
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 backgroundColor: "#1A1919",
//                 padding: 20,
//                 borderRadius: 12,
//                 marginTop: 10,
//                 marginHorizontal: 10,
//                 marginBottom: 10,
//               }}
//             >
//               <Image
//                 source={Icons.copy}
//                 style={{ width: 30, height: 20, tintColor: "#00acee", marginRight: 5 }}
//               />
//               <Text style={{ color: "#fefefe", fontWeight: "bold", marginLeft: 5 }}>
//                 Copy Link
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* ── FULL-SCREEN IMAGE VIEWER ── */}
//       <Modal
//         visible={imageViewerVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={closeImageViewer}
//       >
//         <TouchableOpacity
//           activeOpacity={1}
//           onPress={closeImageViewer}
//           style={{
//             flex: 1,
//             backgroundColor: "#000000",
//             justifyContent: "center",
//             alignItems: "center",
//           }}
//         >
//           <Image
//             source={{ uri: post.image }}
//             style={{ width: "100%", height: "100%" }}
//             resizeMode="contain"
//           />

//           <TouchableOpacity
//             onPress={closeImageViewer}
//             style={{
//               position: "absolute",
//               top: insets.top + 12,
//               right: 16,
//               backgroundColor: "rgba(255,255,255,0.15)",
//               width: 40,
//               height: 40,
//               borderRadius: 20,
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <Image
//               source={Icons.close}
//               style={{ width: 18, height: 18, tintColor: "#fff" }}
//             />
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </Modal>

//       {/* ── COMMENT MODAL ── */}
//       <Modal
//         visible={commentVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={closeCommentModal}
//       >
//         <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
//           <TouchableOpacity
//             style={{ flex: 1 }}
//             activeOpacity={1}
//             onPress={closeCommentModal}
//           />

//           <KeyboardAvoidingView
//             behavior={Platform.OS === "ios" ? "padding" : "height"}
//             style={{
//               position: "absolute",
//               bottom: 0,
//               left: 0,
//               right: 0,
//               height: "90%",
//               ...(isDesktop
//                 ? { maxWidth: 480, right: 0, left: undefined, alignSelf: "flex-end" as const }
//                 : {}),
//             }}
//           >
//             <View
//               style={{
//                 flex: 1,
//                 backgroundColor: "#000",
//                 borderTopLeftRadius: 16,
//                 borderTopRightRadius: 16,
//                 overflow: "hidden",
//               }}
//             >
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   paddingHorizontal: 16,
//                   paddingTop: 16,
//                   paddingBottom: 14,
//                   borderBottomWidth: 1,
//                   borderBottomColor: "#1A1919",
//                 }}
//               >
//                 <Text style={{ color: "#fefefe", fontWeight: "bold", fontSize: 16 }}>
//                   Comments
//                 </Text>
//                 <TouchableOpacity
//                   onPress={closeCommentModal}
//                   style={{
//                     backgroundColor: "#615a5a",
//                     width: 35,
//                     height: 35,
//                     borderRadius: 6,
//                     justifyContent: "center",
//                     alignItems: "center",
//                   }}
//                 >
//                   <Image
//                     source={Icons.close}
//                     style={{ width: 15, height: 15, tintColor: "#fefefe" }}
//                   />
//                 </TouchableOpacity>
//               </View>

//               <ScrollView
//                 style={{ flex: 1 }}
//                 contentContainerStyle={{
//                   paddingHorizontal: 12,
//                   paddingTop: 12,
//                   paddingBottom: 20,
//                 }}
//                 showsVerticalScrollIndicator={false}
//                 keyboardShouldPersistTaps="handled"
//               >
//                 {commentsLoading ? (
//                   <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
//                 ) : comments.length > 0 ? (
//                   comments.map((comment) => (
//                     <View
//                       key={comment.id}
//                       style={{
//                         flexDirection: "row",
//                         alignItems: "flex-start",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <Image
//                         source={{ uri: comment.authorAvatar }}
//                         style={{
//                           width: 35,
//                           height: 35,
//                           borderRadius: 20,
//                           marginRight: 10,
//                         }}
//                       />
//                       <View
//                         style={{
//                           flex: 1,
//                           backgroundColor: "#1A1919",
//                           padding: 10,
//                           borderEndEndRadius: 12,
//                         }}
//                       >
//                         <Text style={{ color: "#fefefe", fontWeight: "bold" }}>
//                           {comment.authorName ?? "Unknown"}
//                         </Text>
//                         <Text style={{ color: "#D4D2D3", marginTop: 4 }}>
//                           {comment.content}
//                         </Text>
//                       </View>
//                     </View>
//                   ))
//                 ) : (
//                   <Text style={{ color: "#686666", textAlign: "center", marginTop: 40 }}>
//                     No comments yet. Be the first!
//                   </Text>
//                 )}
//               </ScrollView>

//               <View
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   paddingHorizontal: 12,
//                   paddingVertical: 10,
//                   paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
//                   borderTopWidth: 1,
//                   borderTopColor: "#333",
//                   backgroundColor: "#000",
//                 }}
//               >
//                 <TextInput
//                   placeholder="Comment this artwork"
//                   placeholderTextColor="#999"
//                   value={commentText}
//                   onChangeText={setCommentText}
//                   style={{
//                     flex: 1,
//                     backgroundColor: "#1A1A1A",
//                     borderRadius: 10,
//                     paddingHorizontal: 15,
//                     color: "#fff",
//                     height: 50,
//                   }}
//                 />
//                 <TouchableOpacity
//                   onPress={handleSubmitComment}
//                   disabled={postingComment}
//                   style={{
//                     marginLeft: 10,
//                     width: 50,
//                     height: 50,
//                     backgroundColor: "#ED3237",
//                     borderRadius: 10,
//                     justifyContent: "center",
//                     alignItems: "center",
//                     opacity: postingComment ? 0.6 : 1,
//                   }}
//                 >
//                   {postingComment ? (
//                     <ActivityIndicator color="#fff" />
//                   ) : (
//                     <Image source={Icons.add} style={{ width: 20, height: 20 }} />
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </KeyboardAvoidingView>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// export default Details;