import CategoryTabs from "@/components/category";
import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import { Images } from "@/constants/images";
import { categories } from "@/data/category";
import { useAllPosts } from "@/hooks/useAllPosts";
import { useAuth } from "@/hooks/useAuth";
import MasonryList from "@react-native-seoul/masonry-list";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const Route = useRouter();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();

  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  // card sizing: must match PostCard's own margin (6 on each side = 12/card)
  const CARD_MARGIN = 6;
  const HORIZONTAL_PADDING = 0; // bump this if MasonryList has outer padding
  const columnWidth =
    (width - HORIZONTAL_PADDING * 2 - CARD_MARGIN * 2 * numColumns) /
    numColumns;

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // ✅ Real data from Supabase
  const { posts, loading, error, refetch } = useAllPosts();

  // ✅ Combined filtering (category + search)
  const finalPosts = useMemo(() => {
    let result = posts;

    // category filter
    if (activeCategory !== "all") {
      result = result.filter((post) => post.category === activeCategory);
    }

    // search filter
    if (query) {
      const q = query.toLowerCase();

      result = result.filter((post) => {
        const inTitle = post.title?.toLowerCase().includes(q);

        const inDescription = post.description
          ?.toLowerCase()
          .includes(q);

        const inTags = post.tags?.some((tag) =>
          tag.toLowerCase().includes(q)
        );

        const inCategory = post.category?.toLowerCase().includes(q);

        return inTitle || inDescription || inTags || inCategory;
      });
    }

    return result;
  }, [posts, activeCategory, query]);

  // ✅ Animations
  const openSearch = () => {
    setSearchOpen(true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSearch = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSearchOpen(false);
      setQuery("");
    });
  };

  const modalTranslateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [900, 0],
  });

  // Tapping the avatar goes to your own profile if logged in, otherwise to login
  const handleAvatarPress = () => {
    if (profile) {
      Route.push(`/screen/users/${profile.id}`);
    } else {
      Route.push("/authscreen/login");
    }
  };

  const Header = () => (
    <>
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 10,
          marginTop: 10,
          marginBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#A6A1A5",
        }}
      >
        <Image
          source={Images.logo}
          style={{
            width: 53.08 * 2,
            height: 15.07 * 2,
          }}
        />

        <TouchableOpacity
          onPress={handleAvatarPress}
          style={{
            width: 35,
            height: 35,
            backgroundColor: "#ffffff",
            borderRadius: 30,
            overflow: "hidden",
          }}
        >
          {profile?.profilePicture ? (
            <Image
              source={{ uri: profile.profilePicture }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : null}
        </TouchableOpacity>
      </View>

      {/* CATEGORY */}
      <CategoryTabs
        data={categories}
        activeCategory={activeCategory}
        onSelect={(id) => setActiveCategory(id)}
      />
    </>
  );

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
        <Header />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
        <Header />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 }}>
          <Text style={{ color: "#fff", textAlign: "center", marginBottom: 12 }}>
            {error}
          </Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={{ color: "#D4D2D3" }}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
      {/* ✅ MAIN FEED (NO ScrollView) */}
      <MasonryList
        data={finalPosts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#686666" }}>No posts found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard post={item as any} cardWidth={columnWidth} />
        )}
      />

      {/* FLOATING SEARCH BUTTON */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 25,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
          transform: [{ scale: scaleAnim }],
          zIndex: 100,
        }}
      >
        <TouchableOpacity onPress={openSearch}>
          <Image
            source={Icons.search}
            style={{ width: 24, height: 24, tintColor: "#fff" }}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* SEARCH MODAL */}
      {searchOpen && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#030303",
            transform: [{ translateY: modalTranslateY }],
            zIndex: 200,
          }}
        >
          {/* HEADER */}
          <View style={{ padding: 20 }}>
            <Pressable onPress={closeSearch}>
              <View style={{ alignSelf: "flex-end", marginBottom: 10 }}>
                <Image
                  source={Icons.close}
                  style={{ width: 24, height: 24, tintColor: "#fff" }}
                />
              </View>
            </Pressable>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search posts..."
              placeholderTextColor="#aaa"
              style={{
                backgroundColor: "#111",
                padding: 15,
                borderRadius: 12,
                color: "white",
              }}
            />
          </View>

          {/* RESULTS */}
          <FlatList
            data={finalPosts}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#222",
                }}
              >
                <PostCard post={item as any} cardWidth={width - 40} />
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

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