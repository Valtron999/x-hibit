// NOTE: install FlashList if you haven't already:
//   npx expo install @shopify/flash-list

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
import { memo, useCallback, useMemo, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

// ── Search result types ──────────────────────────────────────────────────
type PostSearchItem = PostWithAuthor & { kind: "post"; searchText: string };
type UserSearchItem = User & { kind: "user"; searchText: string };
type SearchItem = PostSearchItem | UserSearchItem;

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
};

const Header = memo(function Header({
  profile,
  activeCategory,
  onSelectCategory,
  onAvatarPress,
}: HeaderProps) {
  return (
    <>
      <View style={styles.headerRow}>
        <Image source={Images.logo} style={styles.logo} />

        <TouchableOpacity onPress={onAvatarPress} style={styles.avatarButton}>
          <Avatar
            uri={profile?.profilePicture}
            name={profile?.name}
            size={35}
          />
        </TouchableOpacity>
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

  useMemo(() => {
    Animated.loop(
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
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  const CARD_MARGIN = 6;
  const HORIZONTAL_PADDING = 0;
  const columnWidth =
    (width - HORIZONTAL_PADDING * 2 - CARD_MARGIN * 2 * numColumns) /
    numColumns;

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

  // ✅ Stable handlers
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
    ({ item, i }: { item: any; i: number }) => (
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

      {/* FLOATING SEARCH BUTTON */}
      <Animated.View
        style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity onPress={openSearch}>
          <Image source={Icons.search} style={styles.fabIcon} />
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
  fabIcon: { width: 24, height: 24, tintColor: "#fff" },
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

// import CategoryTabs from "@/components/category";
// import PostCard from "@/components/PostCard";
// import { Icons } from "@/constants/icons";
// import { Images } from "@/constants/images";
// import { categories } from "@/data/category";
// import { useAllPosts } from "@/hooks/useAllPosts";
// import { useAuth } from "@/hooks/useAuth";
// import MasonryList from "@react-native-seoul/masonry-list";
// import { useRouter } from "expo-router";
// import { useMemo, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Animated,
//   FlatList,
//   Image,
//   Pressable,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useWindowDimensions,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const Home = () => {
//   const Route = useRouter();
//   const { width } = useWindowDimensions();
//   const { profile } = useAuth();

//   const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

//   // card sizing: must match PostCard's own margin (6 on each side = 12/card)
//   const CARD_MARGIN = 6;
//   const HORIZONTAL_PADDING = 0; // bump this if MasonryList has outer padding
//   const columnWidth =
//     (width - HORIZONTAL_PADDING * 2 - CARD_MARGIN * 2 * numColumns) /
//     numColumns;

//   const [activeCategory, setActiveCategory] = useState("all");
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [query, setQuery] = useState("");

//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const modalAnim = useRef(new Animated.Value(0)).current;

//   // ✅ Real data from Supabase
//   const { posts, loading, error, refetch } = useAllPosts();

//   // ✅ Combined filtering (category + search)
//   const finalPosts = useMemo(() => {
//     let result = posts;

//     // category filter
//     if (activeCategory !== "all") {
//       result = result.filter((post) => post.category === activeCategory);
//     }

//     // search filter
//     if (query) {
//       const q = query.toLowerCase();

//       result = result.filter((post) => {
//         const inTitle = post.title?.toLowerCase().includes(q);

//         const inDescription = post.description
//           ?.toLowerCase()
//           .includes(q);

//         const inTags = post.tags?.some((tag) =>
//           tag.toLowerCase().includes(q)
//         );

//         const inCategory = post.category?.toLowerCase().includes(q);

//         return inTitle || inDescription || inTags || inCategory;
//       });
//     }

//     return result;
//   }, [posts, activeCategory, query]);

//   // ✅ Animations
//   const openSearch = () => {
//     setSearchOpen(true);

//     Animated.parallel([
//       Animated.spring(scaleAnim, {
//         toValue: 0.9,
//         useNativeDriver: true,
//       }),
//       Animated.timing(modalAnim, {
//         toValue: 1,
//         duration: 250,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const closeSearch = () => {
//     Animated.parallel([
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(modalAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setSearchOpen(false);
//       setQuery("");
//     });
//   };

//   const modalTranslateY = modalAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [900, 0],
//   });

//   // Tapping the avatar goes to your own profile if logged in, otherwise to login
//   const handleAvatarPress = () => {
//     if (profile) {
//       Route.push(`/screen/users/${profile.id}`);
//     } else {
//       Route.push("/authscreen/login");
//     }
//   };

//   const Header = () => (
//     <>
//       {/* HEADER */}
//       <View
//         style={{
//           flexDirection: "row",
//           justifyContent: "space-between",
//           alignItems: "center",
//           paddingHorizontal: 20,
//           paddingBottom: 10,
//           marginTop: 10,
//           marginBottom: 10,
//           borderBottomWidth: 1,
//           borderBottomColor: "#A6A1A5",
//         }}
//       >
//         <Image
//           source={Images.logo}
//           style={{
//             width: 53.08 * 2,
//             height: 15.07 * 2,
//           }}
//         />

//         <TouchableOpacity
//           onPress={handleAvatarPress}
//           style={{
//             width: 35,
//             height: 35,
//             backgroundColor: "#ffffff",
//             borderRadius: 30,
//             overflow: "hidden",
//           }}
//         >
//           {profile?.profilePicture ? (
//             <Image
//               source={{ uri: profile.profilePicture }}
//               style={{ width: "100%", height: "100%" }}
//             />
//           ) : null}
//         </TouchableOpacity>
//       </View>

//       {/* CATEGORY */}
//       <CategoryTabs
//         data={categories}
//         activeCategory={activeCategory}
//         onSelect={(id) => setActiveCategory(id)}
//       />
//     </>
//   );

//   // ── Loading state ───────────────────────────────────────────────────────
//   if (loading && posts.length === 0) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
//         <Header />
//         <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//           <ActivityIndicator color="#fff" />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ── Error state ─────────────────────────────────────────────────────────
//   if (error && posts.length === 0) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
//         <Header />
//         <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 }}>
//           <Text style={{ color: "#fff", textAlign: "center", marginBottom: 12 }}>
//             {error}
//           </Text>
//           <TouchableOpacity onPress={refetch}>
//             <Text style={{ color: "#D4D2D3" }}>Try again</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
//       {/* ✅ MAIN FEED (NO ScrollView) */}
//       <MasonryList
//         data={finalPosts}
//         keyExtractor={(item) => item.id}
//         numColumns={numColumns}
//         showsVerticalScrollIndicator={false}
//         ListHeaderComponent={<Header />}
//         ListEmptyComponent={
//           <View style={{ padding: 40, alignItems: "center" }}>
//             <Text style={{ color: "#686666" }}>No posts found.</Text>
//           </View>
//         }
//         renderItem={({ item }) => (
//           <PostCard post={item as any} cardWidth={columnWidth} />
//         )}
//       />

//       {/* FLOATING SEARCH BUTTON */}
//       <Animated.View
//         style={{
//           position: "absolute",
//           bottom: 25,
//           right: 20,
//           width: 60,
//           height: 60,
//           borderRadius: 30,
//           backgroundColor: "#000",
//           justifyContent: "center",
//           alignItems: "center",
//           transform: [{ scale: scaleAnim }],
//           zIndex: 100,
//         }}
//       >
//         <TouchableOpacity onPress={openSearch}>
//           <Image
//             source={Icons.search}
//             style={{ width: 24, height: 24, tintColor: "#fff" }}
//           />
//         </TouchableOpacity>
//       </Animated.View>

//       {/* SEARCH MODAL */}
//       {searchOpen && (
//         <Animated.View
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: "#030303",
//             transform: [{ translateY: modalTranslateY }],
//             zIndex: 200,
//           }}
//         >
//           {/* HEADER */}
//           <View style={{ padding: 20 }}>
//             <Pressable onPress={closeSearch}>
//               <View style={{ alignSelf: "flex-end", marginBottom: 10 }}>
//                 <Image
//                   source={Icons.close}
//                   style={{ width: 24, height: 24, tintColor: "#fff" }}
//                 />
//               </View>
//             </Pressable>

//             <TextInput
//               value={query}
//               onChangeText={setQuery}
//               placeholder="Search posts..."
//               placeholderTextColor="#aaa"
//               style={{
//                 backgroundColor: "#111",
//                 padding: 15,
//                 borderRadius: 12,
//                 color: "white",
//               }}
//             />
//           </View>

//           {/* RESULTS */}
//           <FlatList
//             data={finalPosts}
//             keyExtractor={(item) => item.id}
//             keyboardShouldPersistTaps="handled"
//             contentContainerStyle={{ paddingHorizontal: 20 }}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={{
//                   paddingVertical: 12,
//                   borderBottomWidth: 1,
//                   borderBottomColor: "#222",
//                 }}
//               >
//                 <PostCard post={item as any} cardWidth={width - 40} />
//               </TouchableOpacity>
//             )}
//           />
//         </Animated.View>
//       )}
//     </SafeAreaView>
//   );
// };

// export default Home;

// import CategoryTabs from "@/components/category";
// import PostCard from "@/components/PostCard";
// import { Icons } from "@/constants/icons";
// import { Images } from "@/constants/images";
// import { categories } from "@/data/category";
// import { useAllPosts } from "@/hooks/useAllPosts";
// import { useAuth } from "@/hooks/useAuth";
// import MasonryList from "@react-native-seoul/masonry-list";
// import { useRouter } from "expo-router";
// import { useMemo, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Animated,
//   FlatList,
//   Image,
//   Pressable,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   useWindowDimensions,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const Home = () => {
//   const Route = useRouter();
//   const { width } = useWindowDimensions();
//   const { profile } = useAuth();

//   const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

//   const [activeCategory, setActiveCategory] = useState("all");
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [query, setQuery] = useState("");

//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const modalAnim = useRef(new Animated.Value(0)).current;

//   // ✅ Real data from Supabase
//   const { posts, loading, error, refetch } = useAllPosts();

//   // ✅ Combined filtering (category + search)
//   const finalPosts = useMemo(() => {
//     let result = posts;

//     // category filter
//     if (activeCategory !== "all") {
//       result = result.filter((post) => post.category === activeCategory);
//     }

//     // search filter
//     if (query) {
//       const q = query.toLowerCase();

//       result = result.filter((post) => {
//         const inTitle = post.title?.toLowerCase().includes(q);

//         const inDescription = post.description
//           ?.toLowerCase()
//           .includes(q);

//         const inTags = post.tags?.some((tag) =>
//           tag.toLowerCase().includes(q)
//         );

//         const inCategory = post.category?.toLowerCase().includes(q);

//         return inTitle || inDescription || inTags || inCategory;
//       });
//     }

//     return result;
//   }, [posts, activeCategory, query]);

//   // ✅ Animations
//   const openSearch = () => {
//     setSearchOpen(true);

//     Animated.parallel([
//       Animated.spring(scaleAnim, {
//         toValue: 0.9,
//         useNativeDriver: true,
//       }),
//       Animated.timing(modalAnim, {
//         toValue: 1,
//         duration: 250,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const closeSearch = () => {
//     Animated.parallel([
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(modalAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setSearchOpen(false);
//       setQuery("");
//     });
//   };

//   const modalTranslateY = modalAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [900, 0],
//   });

//   // Tapping the avatar goes to your own profile if logged in, otherwise to login
//   const handleAvatarPress = () => {
//     if (profile) {
//       Route.push(`/screen/users/${profile.id}`);
//     } else {
//       Route.push("/authscreen/login");
//     }
//   };

//   const Header = () => (
//     <>
//       {/* HEADER */}
//       <View
//         style={{
//           flexDirection: "row",
//           justifyContent: "space-between",
//           alignItems: "center",
//           paddingHorizontal: 20,
//           paddingBottom: 10,
//           marginTop: 10,
//           marginBottom: 10,
//           borderBottomWidth: 1,
//           borderBottomColor: "#A6A1A5",
//         }}
//       >
//         <Image
//           source={Images.logo}
//           style={{
//             width: 53.08 * 2,
//             height: 15.07 * 2,
//           }}
//         />

//         <TouchableOpacity
//           onPress={handleAvatarPress}
//           style={{
//             width: 35,
//             height: 35,
//             backgroundColor: "#ffffff",
//             borderRadius: 30,
//             overflow: "hidden",
//           }}
//         >
//           {profile?.profilePicture ? (
//             <Image
//               source={{ uri: profile.profilePicture }}
//               style={{ width: "100%", height: "100%" }}
//             />
//           ) : null}
//         </TouchableOpacity>
//       </View>

//       {/* CATEGORY */}
//       <CategoryTabs
//         data={categories}
//         activeCategory={activeCategory}
//         onSelect={(id) => setActiveCategory(id)}
//       />
//     </>
//   );

//   // ── Loading state ───────────────────────────────────────────────────────
//   if (loading && posts.length === 0) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
//         <Header />
//         <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//           <ActivityIndicator color="#fff" />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ── Error state ─────────────────────────────────────────────────────────
//   if (error && posts.length === 0) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
//         <Header />
//         <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 }}>
//           <Text style={{ color: "#fff", textAlign: "center", marginBottom: 12 }}>
//             {error}
//           </Text>
//           <TouchableOpacity onPress={refetch}>
//             <Text style={{ color: "#D4D2D3" }}>Try again</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
//       {/* ✅ MAIN FEED (NO ScrollView) */}
//       <MasonryList
//         data={finalPosts}
//         keyExtractor={(item) => item.id}
//         numColumns={numColumns}
//         showsVerticalScrollIndicator={false}
//         ListHeaderComponent={<Header />}
//         ListEmptyComponent={
//           <View style={{ padding: 40, alignItems: "center" }}>
//             <Text style={{ color: "#686666" }}>No posts found.</Text>
//           </View>
//         }
//         renderItem={({ item }) => <PostCard post={item as any} />}
//       />

//       {/* FLOATING SEARCH BUTTON */}
//       <Animated.View
//         style={{
//           position: "absolute",
//           bottom: 25,
//           right: 20,
//           width: 60,
//           height: 60,
//           borderRadius: 30,
//           backgroundColor: "#000",
//           justifyContent: "center",
//           alignItems: "center",
//           transform: [{ scale: scaleAnim }],
//           zIndex: 100,
//         }}
//       >
//         <TouchableOpacity onPress={openSearch}>
//           <Image
//             source={Icons.search}
//             style={{ width: 24, height: 24, tintColor: "#fff" }}
//           />
//         </TouchableOpacity>
//       </Animated.View>

//       {/* SEARCH MODAL */}
//       {searchOpen && (
//         <Animated.View
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: "#030303",
//             transform: [{ translateY: modalTranslateY }],
//             zIndex: 200,
//           }}
//         >
//           {/* HEADER */}
//           <View style={{ padding: 20 }}>
//             <Pressable onPress={closeSearch}>
//               <View style={{ alignSelf: "flex-end", marginBottom: 10 }}>
//                 <Image
//                   source={Icons.close}
//                   style={{ width: 24, height: 24, tintColor: "#fff" }}
//                 />
//               </View>
//             </Pressable>

//             <TextInput
//               value={query}
//               onChangeText={setQuery}
//               placeholder="Search posts..."
//               placeholderTextColor="#aaa"
//               style={{
//                 backgroundColor: "#111",
//                 padding: 15,
//                 borderRadius: 12,
//                 color: "white",
//               }}
//             />
//           </View>

//           {/* RESULTS */}
//           <FlatList
//             data={finalPosts}
//             keyExtractor={(item) => item.id}
//             keyboardShouldPersistTaps="handled"
//             contentContainerStyle={{ paddingHorizontal: 20 }}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={{
//                   paddingVertical: 12,
//                   borderBottomWidth: 1,
//                   borderBottomColor: "#222",
//                 }}
//                 >
//                 <PostCard post={item as any} />
//               </TouchableOpacity>
//             )}
//           />
//         </Animated.View>
//       )}
//     </SafeAreaView>
//   );
// };

// export default Home;