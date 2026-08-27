import { SuggestedPeople } from "@/components/SuggestedPeople";
import { Icons } from "@/constants/icons";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import { useUserPosts } from "@/hooks/useUserPosts";
import { useUserProfile } from "@/hooks/useUserProfile";

import { BlurView } from "expo-blur";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ImageSourcePropType } from "react-native";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

/* =========================
   🔥 RESPONSIVE BREAKPOINTS
========================= */
const BREAKPOINTS = {
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
};

function getColumnCount(width: number) {
  if (width >= BREAKPOINTS.desktop) return 4;
  if (width >= BREAKPOINTS.laptop) return 3;
  if (width >= BREAKPOINTS.tablet) return 3;
  return 1;
}

/* =========================
   🔥 LIGHTWEIGHT MASONRY
========================= */
function distributeToColumns<T>(items: T[], columnCount: number): T[][] {
  const cols: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => cols[i % columnCount].push(item));
  return cols;
}

type SettingsRowProps = {
  icon: ImageSourcePropType;
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
};

function SettingsRow({ icon, title, description, value, onPress, right }: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
      onPress={onPress}
      disabled={!onPress && !right}
    >
      <View style={styles.settingsIconBox}>
        <Image source={icon} style={styles.settingsIcon} />
      </View>
      <View style={styles.settingsRowCopy}>
        <Text style={styles.settingsRowTitle}>{title}</Text>
        {!!description && <Text style={styles.settingsRowDescription}>{description}</Text>}
      </View>
      {!!value && <Text style={styles.settingsValue} numberOfLines={1}>{value}</Text>}
      {right || (
        <View style={styles.settingsArrow}>
          <Text style={styles.settingsArrowText}>›</Text>
        </View>
      )}
    </Pressable>
  );
}

function SettingsSection({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.settingsEyebrow}>{eyebrow}</Text>
      <View style={styles.settingsGroup}>{children}</View>
    </View>
  );
}

function OptionChips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}) {
  return (
    <View style={styles.optionChips}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          style={[styles.optionChip, selected === option && styles.optionChipSelected]}
        >
          <Text style={[styles.optionChipText, selected === option && styles.optionChipTextSelected]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const Route = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const isDesktop = width >= BREAKPOINTS.tablet;
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
  const { session, profile: myProfile, loading: authLoading, signOut } = useAuth();

  const [appearance, setAppearance] = useState("Dark");
  const [contentDensity, setContentDensity] = useState("Balanced");
  const [recommendations, setRecommendations] = useState("More personalized");
  const [privacyMode, setPrivacyMode] = useState("Public");
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    followers: true,
    messages: false,
  });
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
  const randomPost = useMemo(() => {
    if (userPosts.length === 0) return null;
    return userPosts[Math.floor(Math.random() * userPosts.length)];
  }, [user?.id, userPosts.length]);

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

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    setLogoutError("");
    const { error } = await signOut();
    if (error) {
      setLogoutError(error.message);
      setLoggingOut(false);
      return;
    }
    setLogoutVisible(false);
    closeSettings();
    Route.replace("/");
  }, [signOut, closeSettings, Route]);

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

  /* =========================
     🔥 EDIT PROFILE PICTURE
  ========================= */
  const [pressingAvatar, setPressingAvatar] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [localProfilePicture, setLocalProfilePicture] = useState<string | undefined>(
    user?.profilePicture || undefined
  );

  useEffect(() => {
    setLocalProfilePicture(user?.profilePicture || undefined);
  }, [user?.profilePicture]);

  const { uploading, pickAndUpload } = useProfileImageUpload({
    userId: myProfile?.id,
    onUploaded: (url) => setLocalProfilePicture(url),
  });

  const handleAvatarPress = useCallback(() => {
    if (!isOwner) return;
    setPhotoSheetVisible(true);
  }, [isOwner]);

  const handlePickSource = useCallback(
    async (source: "camera" | "gallery") => {
      setPhotoSheetVisible(false);
      await pickAndUpload(source);
    },
    [pickAndUpload]
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

  /* Avatar + edit affordance, shared between mobile and desktop layouts.
     ⚠️ FIX: Pressable had no style, so it sized to its content. Its child
     Image uses percentage width/height ("100%"), which needs a *sized*
     parent to resolve against — an unstyled Pressable can't provide that,
     so the Image collapsed to nothing even though the URL was valid.
     `avatarPressable` (width/height 100%) makes Pressable fill profileBox/
     desktopImageBox, giving the Image something real to size against. */
  const avatarBlock = (
    <Pressable
      style={styles.avatarPressable}
      onPress={handleAvatarPress}
      onPressIn={() => isOwner && setPressingAvatar(true)}
      onPressOut={() => setPressingAvatar(false)}
      disabled={!isOwner}
    >
      <Image
        source={{ uri: localProfilePicture || user.profilePicture || undefined }}
        style={isDesktop ? styles.desktopProfileImage : styles.profileImage}
      />

      {isOwner && (pressingAvatar || uploading) && (
        <View style={styles.avatarOverlay}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.avatarOverlayGlyph}>✎</Text>
              <Text style={styles.avatarOverlayText}>Edit Photo</Text>
            </>
          )}
        </View>
      )}

      {isOwner && !pressingAvatar && !uploading && (
        <View style={styles.editProfileButton}>
          <Text style={styles.editGlyph}>✎</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: randomPost?.image || user.profilePicture || undefined }}
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

              <View style={styles.desktopImageBox}>{avatarBlock}</View>

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

              <View style={styles.profileBox}>{avatarBlock}</View>

              <View style={styles.content}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.location}>{user.bio || "Creative Artist"}</Text>
                {statsBlock}
              </View>

              {followButton}
            </Animated.View>
          )}

          {/* DISCOVER PEOPLE — own profile only.
              🔧 "See all" pushes to /screen/discoverPeople, which doesn't
              exist in your app/screen tree yet — either create that route
              or change/remove the button in SuggestedPeople.tsx. */}
          {isOwner && myProfile?.id && <SuggestedPeople viewerId={myProfile.id} />}

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
          <Modal
            transparent
            visible={settingsVisible}
            animationType="none"
            onRequestClose={closeSettings}
          >
            <Pressable style={styles.modalOverlay} onPress={closeSettings}>
              <Animated.View
                onStartShouldSetResponder={() => true}
                style={[
                  styles.modalContainer,
                  isDesktop && styles.modalContainerDesktop,
                  { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
                ]}
              >
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <View>
                    
                    <Text style={styles.modalTitle}>Settings</Text>
                  </View>
                  <TouchableOpacity onPress={closeSettings} style={styles.closeButton}>
                    <Image source={Icons.close} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.settingsScrollContent}
                >
                  <View style={styles.identityCard}>
                    <View style={styles.identityAvatar}>
                      {myProfile?.profilePicture ? (
                        <Image source={{ uri: myProfile.profilePicture }} style={styles.identityAvatarImage} />
                      ) : (
                        <Text style={styles.identityInitials}>
                          {myProfile?.name
                            ?.split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.identityCopy}>
                      {!!myProfile?.name && <Text style={styles.identityName}>{myProfile.name}</Text>}
                      {!!myProfile?.username && <Text style={styles.identityUsername}>@{myProfile.username}</Text>}
                      <View style={styles.identityMeta}>
                        {!!myProfile?.category && (
                          <Text style={styles.identityMetaText}>{myProfile.category}</Text>
                        )}
                        {!!myProfile?.bio && (
                          <Text style={styles.identityMetaText} numberOfLines={1}>
                            {myProfile.bio}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.profileLink}
                      onPress={() => myProfile?.id && Route.push(`/screen/users/${myProfile.id}`)}
                    >
                      <Text style={styles.profileLinkText}>View</Text>
                      <Text style={styles.profileLinkArrow}>›</Text>
                    </TouchableOpacity>
                  </View>

                  <SettingsSection eyebrow="YOUR SPACE">
                    <SettingsRow
                      icon={Icons.setting}
                      title="Profile"
                      description="Shape your creative identity"
                      onPress={() => {
                        closeSettings();
                        if (myProfile?.id) Route.push(`/screen/users/${myProfile.id}`);
                      }}
                    />
                    <SettingsRow
                      icon={Icons.share}
                      title="Portfolio"
                      description="Manage your professional showcase"
                      value="Coming soon"
                    />
                    <SettingsRow
                      icon={Icons.heartInactive}
                      title="Saved Content"
                      description="Return to work that inspired you"
                    />
                  </SettingsSection>

                  <SettingsSection eyebrow="EXPERIENCE">
                    <View style={styles.settingsControlCard}>
                      <View style={styles.controlHeading}>
                        <Image source={Icons.setting} style={styles.controlIcon} />
                        <View style={styles.settingsRowCopy}>
                          <Text style={styles.settingsRowTitle}>Appearance</Text>
                          <Text style={styles.settingsRowDescription}>Set the mood for your studio</Text>
                        </View>
                      </View>
                      <OptionChips options={["Light", "Dark", "System"]} selected={appearance} onSelect={setAppearance} />
                    </View>
                    <View style={styles.settingsControlCard}>
                      <View style={styles.controlHeading}>
                        <Image source={Icons.search} style={styles.controlIcon} />
                        <View style={styles.settingsRowCopy}>
                          <Text style={styles.settingsRowTitle}>Feed Preferences</Text>
                          <Text style={styles.settingsRowDescription}>Tune what appears in your feed</Text>
                        </View>
                      </View>
                      <OptionChips
                        options={["More personalized", "Balanced", "More diverse"]}
                        selected={recommendations}
                        onSelect={setRecommendations}
                      />
                    </View>
                    <View style={styles.settingsControlCard}>
                      <View style={styles.controlHeading}>
                        <Image source={Icons.menu} style={styles.controlIcon} />
                        <View style={styles.settingsRowCopy}>
                          <Text style={styles.settingsRowTitle}>Content Density</Text>
                          <Text style={styles.settingsRowDescription}>Choose how much work you see at once</Text>
                        </View>
                      </View>
                      <OptionChips
                        options={["Comfortable", "Balanced", "Dense"]}
                        selected={contentDensity}
                        onSelect={setContentDensity}
                      />
                    </View>
                  </SettingsSection>

                  <SettingsSection eyebrow="DISCOVERY">
                    <SettingsRow
                      icon={Icons.search}
                      title="Discovery Interests"
                      description="Choose the creative categories you discover"
                    />
                    <SettingsRow
                      icon={Icons.heartActive}
                      title="Recommendations"
                      description="More personalized, balanced, or diverse"
                      value={recommendations}
                    />
                  </SettingsSection>

                  <SettingsSection eyebrow="NOTIFICATIONS">
                    <SettingsRow
                      icon={Icons.heartActive}
                      title="Likes"
                      description="When someone likes your work"
                      right={
                        <Switch
                          value={notifications.likes}
                          onValueChange={(value) => setNotifications((current) => ({ ...current, likes: value }))}
                          trackColor={{ false: "#34343A", true: "#7E252A" }}
                          thumbColor={notifications.likes ? "#ED3237" : "#8A8A92"}
                        />
                      }
                    />
                    <SettingsRow
                      icon={Icons.comment}
                      title="Comments"
                      description="When someone responds to your work"
                      right={
                        <Switch
                          value={notifications.comments}
                          onValueChange={(value) => setNotifications((current) => ({ ...current, comments: value }))}
                          trackColor={{ false: "#34343A", true: "#7E252A" }}
                          thumbColor={notifications.comments ? "#ED3237" : "#8A8A92"}
                        />
                      }
                    />
                    <SettingsRow
                      icon={Icons.add}
                      title="New Followers"
                      description="When someone follows your profile"
                      right={
                        <Switch
                          value={notifications.followers}
                          onValueChange={(value) => setNotifications((current) => ({ ...current, followers: value }))}
                          trackColor={{ false: "#34343A", true: "#7E252A" }}
                          thumbColor={notifications.followers ? "#ED3237" : "#8A8A92"}
                        />
                      }
                    />
                    <SettingsRow
                      icon={Icons.share}
                      title="Messages"
                      description="When someone reaches out"
                      right={
                        <Switch
                          value={notifications.messages}
                          onValueChange={(value) => setNotifications((current) => ({ ...current, messages: value }))}
                          trackColor={{ false: "#34343A", true: "#7E252A" }}
                          thumbColor={notifications.messages ? "#ED3237" : "#8A8A92"}
                        />
                      }
                    />
                  </SettingsSection>

                  <SettingsSection eyebrow="PRIVACY & SAFETY">
                    <View style={styles.settingsControlCard}>
                      <View style={styles.controlHeading}>
                        <Image source={Icons.setting} style={styles.controlIcon} />
                        <View style={styles.settingsRowCopy}>
                          <Text style={styles.settingsRowTitle}>Profile Visibility</Text>
                          <Text style={styles.settingsRowDescription}>Choose who can discover your work</Text>
                        </View>
                      </View>
                      <OptionChips options={["Public", "Private"]} selected={privacyMode} onSelect={setPrivacyMode} />
                    </View>
                    <SettingsRow icon={Icons.setting} title="Security" description="Protect your account and access" />
                    <SettingsRow icon={Icons.close} title="Blocked Accounts" description="Manage accounts you have blocked" />
                  </SettingsSection>

                  <SettingsSection eyebrow="CREATOR">
                    <SettingsRow
                      icon={Icons.add}
                      title="Professional Mode"
                      description="Unlock creator-focused features"
                      value="Preview"
                    />
                    <SettingsRow
                      icon={Icons.search}
                      title="Portfolio Insights"
                      description="See how people interact with your work"
                    />
                    <SettingsRow
                      icon={Icons.share}
                      title="Profile Analytics"
                      description="Understand your creative reach"
                    />
                    <SettingsRow
                      icon={Icons.setting}
                      title="Booking Availability"
                      description="Let people know when you're available"
                    />
                  </SettingsSection>

                  <SettingsSection eyebrow="ACCOUNT & SUPPORT">
                    <SettingsRow icon={Icons.setting} title="Account Details" description={myProfile?.email} />
                    <SettingsRow icon={Icons.close} title="Help Center" description="Find answers and contact support" />
                    <SettingsRow icon={Icons.share} title="Community Guidelines" description="Build a thoughtful creative community" />
                    <SettingsRow icon={Icons.search} title="About X-HIBIT" description="The home for creative discovery" />
                  </SettingsSection>

                  <Pressable
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
                    onPress={() => {
                      setLogoutError("");
                      setLogoutVisible(true);
                    }}
                  >
                    <Text style={styles.logoutButtonText}>Log out</Text>
                  </Pressable>
                  <Text style={styles.versionText}>X-HIBIT / Creative tools for curious minds</Text>
                </ScrollView>
              </Animated.View>
            </Pressable>
          </Modal>
        )}

        {isOwner && (
          <Modal
            transparent
            visible={logoutVisible}
            animationType="fade"
            onRequestClose={() => !loggingOut && setLogoutVisible(false)}
          >
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmEyebrow}>ACCOUNT ACCESS</Text>
                <Text style={styles.confirmTitle}>Log out of X-HIBIT?</Text>
                <Text style={styles.confirmText}>You can sign back in anytime.</Text>
                {!!logoutError && <Text style={styles.logoutError}>{logoutError}</Text>}
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setLogoutVisible(false)}
                    disabled={loggingOut}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmLogoutButton}
                    onPress={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmLogoutText}>Log out</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* CAMERA / GALLERY PICKER SHEET */}
        {isOwner && (
          <Modal
            transparent
            visible={photoSheetVisible}
            animationType="slide"
            onRequestClose={() => setPhotoSheetVisible(false)}
          >
            <Pressable
              style={styles.sheetOverlay}
              onPress={() => setPhotoSheetVisible(false)}
            >
              <View style={styles.sheet}>
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => handlePickSource("camera")}
                >
                  <Text style={styles.sheetOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => handlePickSource("gallery")}
                >
                  <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomWidth: 0 }]}
                  onPress={() => setPhotoSheetVisible(false)}
                >
                  <Text style={[styles.sheetOptionText, { color: "#ED3237" }]}>✕  Cancel</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
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

  editProfileButton: {
    position: "absolute",
    right: -5,
    bottom: -5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ED3237",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarPressable: { width: "100%", height: "100%" },
  editGlyph: { color: "#fff", fontSize: 16, lineHeight: 18 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 27,
    overflow: "hidden",
  },
  avatarOverlayGlyph: { color: "#fff", fontSize: 18 },
  avatarOverlayText: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 4 },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#151515",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingBottom: 30,
  },
  sheetOption: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetOptionText: { color: "#fff", fontSize: 16, fontWeight: "600" },

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

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)" },
  modalContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "94%",
    maxWidth: 620,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#0D0D0F",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: -10, height: 0 },
    elevation: 24,
  },
  modalContainerDesktop: { width: 560, borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  modalHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: "#3A3A40", marginBottom: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  modalKicker: { color: "#ED3237", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6 },
  modalTitle: { fontSize: 32, color: "#fff", fontWeight: "800", letterSpacing: 0 },
  closeButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1C1C20", justifyContent: "center", alignItems: "center" },
  closeIcon: { width: 16, height: 16, tintColor: "#D3D3D8" },
  closeText: { color: "#ED3237", fontWeight: "bold" },
  settingsScrollContent: { paddingBottom: 36 },
  identityCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 22, backgroundColor: "#17171B", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 28 },
  identityAvatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: "#292930", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  identityAvatarImage: { width: "100%", height: "100%" },
  identityInitials: { color: "#fff", fontSize: 22, fontWeight: "800" },
  identityCopy: { flex: 1, marginLeft: 14, minWidth: 0 },
  identityName: { color: "#fff", fontSize: 19, fontWeight: "800" },
  identityUsername: { color: "#A2A2AA", fontSize: 13, marginTop: 2 },
  identityMeta: { flexDirection: "row", alignItems: "center", marginTop: 8, minWidth: 0 },
  identityMetaText: { color: "#D1D1D5", fontSize: 11, textTransform: "capitalize", marginRight: 8, maxWidth: "72%" },
  profileLink: { flexDirection: "row", alignItems: "center", paddingLeft: 8 },
  profileLinkText: { color: "#ED3237", fontSize: 12, fontWeight: "800" },
  profileLinkArrow: { color: "#ED3237", fontSize: 24, lineHeight: 22, marginLeft: 3 },
  settingsSection: { marginBottom: 26 },
  settingsEyebrow: { color: "#85858D", fontSize: 10, fontWeight: "800", letterSpacing: 1.7, marginBottom: 10, marginLeft: 4 },
  settingsGroup: { borderRadius: 18, backgroundColor: "#151518", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  settingsRow: { minHeight: 72, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  settingsRowPressed: { backgroundColor: "#202025", opacity: 0.9 },
  settingsIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#24242A", justifyContent: "center", alignItems: "center" },
  settingsIcon: { width: 17, height: 17, tintColor: "#D7D7DC" },
  settingsRowCopy: { flex: 1, marginLeft: 12, minWidth: 0 },
  settingsRowTitle: { color: "#F5F5F6", fontSize: 14, fontWeight: "700" },
  settingsRowDescription: { color: "#85858D", fontSize: 11, lineHeight: 16, marginTop: 3 },
  settingsValue: { color: "#85858D", fontSize: 10, maxWidth: 92, marginRight: 8, textAlign: "right" },
  settingsArrow: { width: 22, alignItems: "flex-end" },
  settingsArrowText: { color: "#777780", fontSize: 25, lineHeight: 25, fontWeight: "300" },
  settingsControlCard: { padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  controlHeading: { flexDirection: "row", alignItems: "center" },
  controlIcon: { width: 17, height: 17, tintColor: "#D7D7DC", marginLeft: 9 },
  optionChips: { flexDirection: "row", flexWrap: "wrap", marginTop: 13, marginLeft: 45, gap: 7 },
  optionChip: { minHeight: 32, paddingHorizontal: 11, borderRadius: 16, justifyContent: "center", borderWidth: 1, borderColor: "#37373E", backgroundColor: "#202026" },
  optionChipSelected: { borderColor: "#ED3237", backgroundColor: "rgba(237,50,55,0.16)" },
  optionChipText: { color: "#92929A", fontSize: 11, fontWeight: "600" },
  optionChipTextSelected: { color: "#FF8D91" },
  logoutButton: { height: 58, borderRadius: 18, borderWidth: 1, borderColor: "rgba(237,50,55,0.5)", backgroundColor: "rgba(237,50,55,0.08)", justifyContent: "center", alignItems: "center", marginTop: 2 },
  logoutButtonPressed: { backgroundColor: "rgba(237,50,55,0.18)" },
  logoutButtonText: { color: "#F46D72", fontSize: 15, fontWeight: "800" },
  versionText: { color: "#55555D", textAlign: "center", fontSize: 10, marginTop: 18 },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmCard: { width: "100%", maxWidth: 400, borderRadius: 24, backgroundColor: "#19191D", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 24 },
  confirmEyebrow: { color: "#ED3237", fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 12 },
  confirmTitle: { color: "#fff", fontSize: 23, fontWeight: "800" },
  confirmText: { color: "#9999A2", fontSize: 14, marginTop: 8 },
  logoutError: { color: "#F46D72", fontSize: 12, marginTop: 14 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#29292F", justifyContent: "center", alignItems: "center" },
  cancelButtonText: { color: "#E5E5E8", fontSize: 14, fontWeight: "700" },
  confirmLogoutButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#ED3237", justifyContent: "center", alignItems: "center" },
  confirmLogoutText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  settingItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 },
  settingText: { color: "#fff", fontSize: 16 },
});