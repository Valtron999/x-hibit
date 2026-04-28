import CategoryTabs from "@/components/category";
import PostCard from "@/components/PostCard";
import { Images } from "@/constants/images";
import { Icons } from "@/constants/icons";
import { categories } from "@/data/category";
import { postsData } from "@/data/posts";
import MasonryList from "@react-native-seoul/masonry-list";
import { useRouter } from "expo-router";
import { useMemo, useState, useRef } from "react";
import {
  Animated,
  TextInput,
  FlatList,
  Pressable,
  Image,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const Route = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // ✅ Combined filtering (category + search)
  const finalPosts = useMemo(() => {
  let result = postsData;

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
}, [activeCategory, query]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
      {/* ✅ MAIN FEED (NO ScrollView) */}
      <MasonryList
        data={finalPosts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
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
                onPress={() => Route.push("/screen/users/u1")}
                style={{
                  width: 35,
                  height: 35,
                  backgroundColor: "#ffffff",
                  borderRadius: 30,
                }}
              />
            </View>

            {/* CATEGORY */}
            <CategoryTabs
              data={categories}
              activeCategory={activeCategory}
              onSelect={(id) => setActiveCategory(id)}
            />
          </>
        }
        renderItem={({ item }) => <PostCard post={item as any} />}
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
                <PostCard post={item as any} />
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default Home;