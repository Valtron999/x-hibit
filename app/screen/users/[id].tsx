import { Icons } from "@/constants/icons";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useUserPosts } from "@/hooks/useUserPosts";
import { useUserProfile } from "@/hooks/useUserProfile";

import { BlurView } from "expo-blur";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

/* =========================
   🔥 RESPONSIVE BREAKPOINTS
   Tuned for: phone / tablet / laptop / large monitor.
   Adjust the numbers to taste — these are fairly standard.
========================= */
const BREAKPOINTS = {
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
};

function getColumnCount(width: number) {
  if (width >= BREAKPOINTS.desktop) return 6;
  if (width >= BREAKPOINTS.laptop) return 5;
  if (width >= BREAKPOINTS.tablet) return 3;
  return 1;
}

/* =========================
   🔥 LIGHTWEIGHT MASONRY
   Distributes items round-robin into N columns. This is NOT true
   height-balanced masonry (that needs per-image aspect ratios measured
   up front), but it's cheap, has zero deps, and looks good enough for
   image grids of roughly similar aspect ratio. If posts vary wildly in
   height, swap this for a "shortest column gets the next item" packer
   once you have real image dimensions available.
========================= */
function distributeToColumns<T>(items: T[], columnCount: number): T[][] {
  const cols: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => cols[i % columnCount].push(item));
  return cols;
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const Route = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const isDesktop = width >= BREAKPOINTS.tablet; // Pinterest-style split kicks in here
  const columnCount = useMemo(() => getColumnCount(width), [width]);

  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openSettings = useCallback(() => {
    setSettingsVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  const closeSettings = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: width, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setSettingsVisible(false));
  }, [slideAnim, fadeAnim, width]);

  /* =========================
     🔥 WHO IS LOGGED IN, WHO IS BEING VIEWED
  ========================= */
  const { session, profile: myProfile, loading: authLoading } = useAuth();

  const { id } = useLocalSearchParams();
  const paramId = Array.isArray(id) ? id[0] : id;

  const viewingOwnProfile =
    !paramId || (!!myProfile && String(paramId) === String(myProfile.id));

  const {
    profile: otherProfile,
    loading: otherLoading,
    error: otherError,
  } = useUserProfile(viewingOwnProfile ? undefined : paramId);

  const user = viewingOwnProfile ? myProfile : otherProfile;
  const loading = authLoading || (!viewingOwnProfile && otherLoading);

  const isOwner = viewingOwnProfile && !!session;

  /* =========================
     🔥 REAL FOLLOW / UNFOLLOW
  ========================= */
  const {
    isFollowing,
    checking: followChecking,
    updating: followUpdating,
    follow,
    unfollow,
  } = useFollow(myProfile?.id, user?.id, { enabled: !isOwner && !!user });

  /* =========================
     🔥 LAZY-SEQUENCED POSTS
     `useUserPosts(user?.id)` is passed `undefined` until the profile
     resolves, so the posts request never fires in parallel with the
     profile fetch — it's naturally staged: profile → posts.
     This mirrors the load order you want: post/profile first, grid second,
     and (in the post-detail screen) comments only when that panel opens —
     i.e. don't call a `useComments()` hook unconditionally on mount there;
     gate it behind a `commentsOpen` boolean the same way `useFollow` is
     gated behind `enabled` here.
  ========================= */
  const postsEnabled = !loading && !!user?.id;
  const {
    posts: userPosts,
    loading: postsLoading,
    refetch: refetchPosts,
  } = useUserPosts(postsEnabled ? user.id : undefined);

  useFocusEffect(
    useCallback(() => {
      if (postsEnabled) refetchPosts();
    }, [postsEnabled, refetchPosts])
  );

  /* =========================
     🔥 RANDOM BACKGROUND
  ========================= */
  const randomPost =
    userPosts.length > 0
      ? userPosts[Math.floor(Math.random() * userPosts.length)]
      : null;

  /* =========================
     🔥 SCROLL ANIMATION
  ========================= */
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -120],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  /* =========================
     🔥 COUNT ANIMATION
  ========================= */
  const [followers, setFollowers] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (!user) return;

    let f = 0;
    let p = 0;
    let fg = 0;

    const interval = setInterval(() => {
      if (f < user.followersCount) f += Math.ceil(user.followersCount / 30) || 1;
      if (p < userPosts.length) p += Math.ceil(userPosts.length / 30) || 1;
      if (fg < user.followingCount) fg += Math.ceil(user.followingCount / 30) || 1;

      setFollowers(Math.min(f, user.followersCount));
      setPostsCount(Math.min(p, userPosts.length));
      setFollowing(Math.min(fg, user.followingCount));
    }, 30);

    return () => clearInterval(interval);
  }, [user?.id, userPosts.length]);

  const handleFollowPress = useCallback(async () => {
    if (!session) {
      Route.push("/authscreen/login");
      return;
    }
    if (followUpdating || followChecking) return;

    if (isFollowing) {
      setFollowers((f) => Math.max(f - 1, 0));
      const ok = await unfollow();
      if (!ok) setFollowers((f) => f + 1);
    } else {
      setFollowers((f) => f + 1);
      const ok = await follow();
      if (!ok) setFollowers((f) => Math.max(f - 1, 0));
    }
  }, [session, isFollowing, followUpdating, followChecking, follow, unfollow, Route]);

  const handleAddPostPress = useCallback(() => {
    if (!session) {
      Route.push("/authscreen/login");
      return;
    }
    Route.push("/screen/createPost");
  }, [session, Route]);

  const goBack = useCallback(() => {
    if (Route.canGoBack()) {
      Route.back();
    } else {
      Route.replace("/screen");
    }
  }, [Route]);

  const goToPost = useCallback(
    (postId: string) =>
      Route.push({ pathname: "/screen/details/[id]", params: { id: postId } }),
    [Route]
  );

  const postColumns = useMemo(
    () => distributeToColumns(userPosts, columnCount),
    [userPosts, columnCount]
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 100 }}>
          {otherError || "No user found"}
        </Text>
      </View>
    );
  }

  const followLabel = followUpdating ? "Loading..." : isFollowing ? "Unfollow" : "Follow";

  const statsBlock = (
    <View
      style={[
        styles.statsRow,
        isDesktop && { justifyContent: "flex-start", width: "auto", gap: 32 },
      ]}
    >
      <View style={styles.stat}>
        <Text style={styles.statNumber}>{postsCount}</Text>
        <Text style={styles.statLabel}>Posts</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statNumber}>{followers}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statNumber}>{following}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </View>
    </View>
  );

  const followButton = !isOwner && (
    <TouchableOpacity
      style={[
        styles.followBtn,
        isDesktop && { width: 220, alignSelf: "flex-start", marginTop: 24 },
        isFollowing && styles.followingBtn,
      ]}
      onPress={handleFollowPress}
      disabled={followUpdating || followChecking}
    >
      {followUpdating ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.followText}>{followLabel}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: randomPost?.image || user.profilePicture }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack}>
            <Image source={Icons.back} style={styles.icon} />
          </TouchableOpacity>

          {isOwner && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
              <TouchableOpacity onPress={handleAddPostPress}>
                <Image source={Icons.add} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openSettings}>
                <Image source={Icons.setting} style={styles.icon} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { paddingBottom: 200 },
            isDesktop && { maxWidth: 1400, width: "100%", alignSelf: "center", paddingHorizontal: 40 },
          ]}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          {/* PROFILE CARD — layout forks here: stacked on mobile, split on desktop */}
          {isDesktop ? (
            <Animated.View
              style={[
                styles.desktopCard,
                { transform: [{ translateY: headerTranslate }], opacity: headerOpacity },
              ]}
            >
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />

              <View style={styles.desktopImageBox}>
                <Image source={{ uri: user.profilePicture }} style={styles.desktopProfileImage} />
              </View>

              <View style={styles.desktopContent}>
                <Text style={[styles.name, { textAlign: "left" }]}>{user.name}</Text>
                <Text style={[styles.location, { textAlign: "left" }]}>
                  {user.bio || "Creative Artist"}
                </Text>
                {statsBlock}
                {followButton}
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateY: headerTranslate }], opacity: headerOpacity },
              ]}
            >
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />

              <View style={styles.profileBox}>
                <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
              </View>

              <View style={styles.content}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.location}>{user.bio || "Creative Artist"}</Text>
                {statsBlock}
              </View>

              {followButton}
            </Animated.View>
          )}

          {/* POSTS — column count scales with breakpoint */}
          <View style={styles.postsWrapper}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />

            <View style={styles.postsContainer}>
              {postsLoading ? (
                <View style={{ width: "100%", padding: 30, alignItems: "center" }}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : userPosts.length === 0 ? (
                isOwner && (
                  <TouchableOpacity
                    onPress={handleAddPostPress}
                    style={[
                      styles.postTouchable,
                      {
                        height: 180,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.3)",
                        borderStyle: "dashed",
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Image
                      source={Icons.add}
                      style={{ width: 28, height: 28, tintColor: "#fff", marginBottom: 8 }}
                    />
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Add your first post</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={{ flexDirection: "row", gap: 14 }}>
                  {postColumns.map((col, colIndex) => (
                    <View key={colIndex} style={{ flex: 1, gap: 14 }}>
                      {col.map((post) => (
                        <TouchableOpacity
                          key={post.id}
                          activeOpacity={0.9}
                          onPress={() => goToPost(post.id)}
                          style={styles.postTouchable}
                        >
                          <Image
                            source={{ uri: post.image }}
                            style={styles.postImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Animated.ScrollView>

        {isOwner && (
          <Modal transparent visible={settingsVisible} animationType="none">
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  isDesktop && { width: 420 },
                  { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Settings</Text>
                  <TouchableOpacity onPress={closeSettings}>
                    <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
                </View>
                <View></View>
              </Animated.View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 20,
  },
  icon: { width: 22, height: 22 },

  // Mobile card (unchanged)
  card: {
    marginTop: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "visible",
  },
  profileBox: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 20,
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 27 },
  content: { alignItems: "center" },
  name: { fontSize: 25, fontWeight: "bold", color: "#fff", marginTop: 10 },
  location: { fontSize: 17, color: "#ccc", marginTop: 4 },
  statsRow: { flexDirection: "row", marginTop: 20, justifyContent: "space-between", width: "80%" },
  stat: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 12, color: "#aaa", marginTop: 2 },
  followBtn: {
    width: "90%",
    backgroundColor: "#ED3237",
    height: 50,
    alignSelf: "center",
    borderRadius: 30,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  followingBtn: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#ED3237" },
  followText: { color: "#fff", fontWeight: "bold", fontSize: 18 },

  // Desktop / Pinterest-style card — image left, content right
  desktopCard: {
    marginTop: 60,
    borderRadius: 30,
    padding: 32,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  desktopImageBox: {
    width: 220,
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#121212",
    overflow: "hidden",
    flexShrink: 0,
  },
  desktopProfileImage: { width: "100%", height: "100%" },
  desktopContent: { flex: 1, justifyContent: "center" },

  postsWrapper: {
    marginTop: 24,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  postsContainer: { padding: 20 },
  postTouchable: { width: "100%", marginBottom: 0, borderRadius: 20, overflow: "hidden" },
  postImage: { width: "100%", height: 420, borderRadius: 20 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    padding: 20,
    backgroundColor: "#000000",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  modalTitle: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  closeText: { color: "#ED3237", fontWeight: "bold" },
  settingItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 },
  settingText: { color: "#fff", fontSize: 16 },
});
