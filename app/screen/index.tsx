

import CategoryTabs from "@/components/category";
import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import { Images } from "@/constants/images";
import { categories } from "@/data/category";
import type { User } from "@/data/type";
import { useAllPosts } from "@/hooks/useAllPosts";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import type { PostWithAuthor } from "@/lib/mapPost";
import MasonryList from "@react-native-seoul/masonry-list";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ── Search result types ──────────────────────────────────────────────────
type PostSearchItem = PostWithAuthor & { kind: "post"; searchText: string };
type UserSearchItem = User & { kind: "user"; searchText: string };
type SearchItem = PostSearchItem | UserSearchItem;

// ── Masonry grid tuning ───────────────────────────────────────────────────
// These MUST stay in sync with the margin values used inside PostCard.tsx.
// (Ideally move these into a shared constants file so there's only one
// source of truth — left as-is here since I don't have your constants dir.)
const CARD_MIN_WIDTH = 200; // cards never get narrower than this
const CARD_MAX_WIDTH = 280; // cards never get wider than this
const CARD_GAP = 16; // total horizontal gap "spent" per card (split 8/8 as margin in PostCard)
const MIN_COLUMNS = 2;

function computeGrid(containerWidth: number) {
  if (containerWidth <= 0) {
    return { numColumns: MIN_COLUMNS, columnWidth: CARD_MIN_WIDTH };
  }

  // How many columns fit if every card were at its minimum width?
  let columns = Math.floor(containerWidth / (CARD_MIN_WIDTH + CARD_GAP));
  columns = Math.max(MIN_COLUMNS, columns);

  let columnWidth = containerWidth / columns - CARD_GAP;

  // If that leaves cards too fat (e.g. an in-between window size), add
  // columns until they fall back into a comfortable range.
  while (columnWidth > CARD_MAX_WIDTH) {
    columns += 1;
    columnWidth = containerWidth / columns - CARD_GAP;
  }

  return { numColumns: columns, columnWidth: Math.max(columnWidth, 80) };
}

// ── Small shared helper: initials fallback avatar (no extra asset needed) ─
function getInitials(name?: string) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function Avatar({
  uri,
  name,
  size,
}: {
  uri?: string;
  name?: string;
  size: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#3a3a3a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#eee", fontWeight: "700", fontSize: size / 2.2 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

// ── Header, memoized so typing in search doesn't re-render logo/avatar/tabs ─
type HeaderProps = {
  profile: User | null;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  onAvatarPress: () => void;
  onSearchPress: () => void;
};

const Header = memo(function Header({
  profile,
  activeCategory,
  onSelectCategory,
  onAvatarPress,
  onSearchPress,
}: HeaderProps) {
  return (
    <>
      <View style={styles.headerRow}>
        <Image source={Images.logo} style={styles.logo} />

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onSearchPress}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image source={Icons.search} style={styles.headerIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onAvatarPress} style={styles.avatarButton}>
            <Avatar
              uri={profile?.profilePicture}
              name={profile?.name}
              size={35}
            />
          </TouchableOpacity>
        </View>
      </View>

      <CategoryTabs
        data={categories}
        activeCategory={activeCategory}
        onSelect={onSelectCategory}
      />
    </>
  );
});

// ── Skeleton loading placeholder (replaces spinner) ──────────────────────
function SkeletonBlock({ height }: { height: number }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  // FIX: this is a side effect (starting an animation loop), so it belongs
  // in useEffect, not useMemo. useMemo isn't guaranteed to run only once
  // and shouldn't be used to trigger effects.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        height,
        borderRadius: 12,
        backgroundColor: "#1a1a1a",
        opacity: pulse,
        margin: 6,
        flex: 1,
      }}
    />
  );
}

function SkeletonGrid({ columns }: { columns: number }) {
  const rows = 4;
  return (
    <View style={{ paddingHorizontal: 6 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: "row" }}>
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBlock key={c} height={140 + ((r + c) % 3) * 40} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Search result row (user or post) ─────────────────────────────────────
function UserResultRow({
  user,
  onPress,
}: {
  user: User;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.userRow} onPress={onPress}>
      <Avatar uri={user.profilePicture} name={user.name} size={44} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.userHandle} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const Home = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  // ✅ Genuinely responsive grid: driven by available width + a comfortable
  // min/max card width, not fixed breakpoints. Because useWindowDimensions
  // reacts to browser resize/zoom, this recalculates naturally — no zoom
  // detection hacks needed.
  const { numColumns, columnWidth } = useMemo(() => computeGrid(width), [width]);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const { posts, loading, error, refetch } = useAllPosts();
  // Users are only fetched once the search modal has been opened at least
  // once, so Home doesn't pay for a profiles fetch nobody asked for.
  const { users, loading: usersLoading } = useAllUsers({
    enabled: searchOpen,
    excludeId: profile?.id,
  });

  // ✅ Category-only filter for the main feed (search no longer touches this)
  const categoryPosts = useMemo(() => {
    if (activeCategory === "all") return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [posts, activeCategory]);

  // ✅ Precomputed lowercase search index — built once per posts/users change,
  // not on every keystroke.
  const postsIndex: PostSearchItem[] = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        kind: "post",
        searchText: [
          post.title,
          post.description,
          post.category,
          ...(post.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      })),
    [posts]
  );

  const usersIndex: UserSearchItem[] = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        kind: "user",
        searchText: [user.name, user.username, user.bio]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      })),
    [users]
  );

  // ✅ Combined search results (users first, then posts) — nothing runs
  // until there's an actual debounced query.
  const searchResults: SearchItem[] = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const matchedUsers = usersIndex.filter((u) => u.searchText.includes(q));
    const matchedPosts = postsIndex.filter((p) => p.searchText.includes(q));

    return [...matchedUsers, ...matchedPosts];
  }, [debouncedQuery, usersIndex, postsIndex]);

  // ✅ Stable handlers — search behavior itself is untouched, only *where*
  // it's triggered from changed (header icon instead of bottom FAB).
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }),
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, modalAnim]);

  const closeSearch = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSearchOpen(false);
      setQuery("");
    });
  }, [scaleAnim, modalAnim]);

  const handleAvatarPress = useCallback(() => {
    if (profile) {
      router.push(`/screen/users/${profile.id}`);
    } else {
      router.push("/authscreen/login");
    }
  }, [profile, router]);

  const handleSelectCategory = useCallback((id: string) => {
    setActiveCategory(id);
  }, []);

  // ⚠️ TODO: point this at your real Create/Add Post route. I don't have
  // access to your routes/navigation to find the existing one, so this is
  // a placeholder — swap the path below for whatever your app already uses
  // (e.g. a route under /screen/create, a modal route, etc.). If Add Post
  // logic lives in a hook/handler elsewhere, call that instead of router.push.
  const handleAddPost = useCallback(() => {
    router.push("/screen/createPost");
  }, [router]);

  const goToUser = useCallback(
    (id: string) => router.push(`/screen/users/${id}`),
    [router]
  );

  const modalTranslateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [900, 0],
  });

  // ✅ Memoized renderItem for the main feed — accept unknown items and assert type
  const renderPost = useCallback(
    ({ item }: { item: any }) => (
      <PostCard post={item as PostWithAuthor} cardWidth={columnWidth} />
    ),
    [columnWidth]
  );

  // ✅ Memoized renderItem for combined search results
  const renderSearchItem = useCallback(
    ({ item }: { item: SearchItem }) => {
      if (item.kind === "user") {
        return (
          <UserResultRow user={item} onPress={() => goToUser(item.id)} />
        );
      }
      return (
        <View style={styles.postResultRow}>
          <PostCard post={item} cardWidth={width - 40} />
        </View>
      );
    },
    [goToUser, width]
  );

  const headerElement = (
    <Header
      profile={profile}
      activeCategory={activeCategory}
      onSelectCategory={handleSelectCategory}
      onAvatarPress={handleAvatarPress}
      onSearchPress={openSearch}
    />
  );

  // ── Loading state (skeleton instead of spinner) ─────────────────────────
  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        {headerElement}
        <SkeletonGrid columns={numColumns} />
      </SafeAreaView>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        {headerElement}
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <MasonryList
        data={categoryPosts}
        keyExtractor={(item: PostWithAuthor) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refetch}
        ListHeaderComponent={headerElement}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No posts found.</Text>
          </View>
        }
        renderItem={renderPost}
      />

      {/* FLOATING ADD POST BUTTON (was Search — Search now lives in the header) */}
      <Animated.View
        style={[
          styles.fab,
          {
            bottom: 25 + insets.bottom,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={handleAddPost} style={styles.fabTouchable}>
          {/* Swap this Text glyph for Icons.add (or whatever your existing
              add/create icon is called) once you confirm it exists. */}
          <Text style={styles.fabIconText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* SEARCH MODAL */}
      {searchOpen && (
        <Animated.View
          style={[
            styles.searchModal,
            { transform: [{ translateY: modalTranslateY }] },
          ]}
        >
          <View style={{ padding: 20 }}>
            <Pressable onPress={closeSearch}>
              <View style={{ alignSelf: "flex-end", marginBottom: 10 }}>
                <Image source={Icons.close} style={styles.closeIcon} />
              </View>
            </Pressable>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search posts and people..."
              placeholderTextColor="#aaa"
              autoFocus
              style={styles.searchInput}
            />
          </View>

          <FlashList
            data={searchResults}
            keyExtractor={(item: SearchItem) => `${item.kind}-${item.id}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ListEmptyComponent={
              query.trim() ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    {usersLoading ? "Searching..." : "No results found."}
                  </Text>
                </View>
              ) : null
            }
            renderItem={renderSearchItem}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#030303" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#A6A1A5",
  },
  logo: { width: 53.08 * 2, height: 15.07 * 2 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12, // gap before the avatar (in case `gap` isn't supported on your RN version)
  },
  headerIcon: { width: 22, height: 22, tintColor: "#fff" },
  avatarButton: {
    width: 35,
    height: 35,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    overflow: "hidden",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  errorText: { color: "#fff", textAlign: "center", marginBottom: 12 },
  retryText: { color: "#D4D2D3" },
  emptyBox: { padding: 40, alignItems: "center" },
  emptyText: { color: "#686666" },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  fabTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fabIconText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 32,
  },
  searchModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#030303",
    zIndex: 200,
  },
  closeIcon: { width: 24, height: 24, tintColor: "#fff" },
  searchInput: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    color: "white",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  userName: { color: "#eee", fontWeight: "600", fontSize: 15 },
  userHandle: { color: "#888", fontSize: 13 },
  postResultRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
});

export default Home;