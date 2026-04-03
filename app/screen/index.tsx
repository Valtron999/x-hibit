import CategoryTabs from "@/components/category";
import PostCard from "@/components/PostCard";
import { Images } from "@/constants/images";
import { categories } from "@/data/category";
import { postsData } from "@/data/posts";
import MasonryList from "@react-native-seoul/masonry-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const { width } = useWindowDimensions();
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  // "all" = default filter state (NOT in category.ts)
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const Route = useRouter();

  // ✅ FAST + CLEAN FILTER (memoized for performance)
  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return postsData;

    return postsData.filter((post) => {
      return post.category === activeCategory;
    });
  }, [activeCategory]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "#030303" }}
      >
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingBottom: 10,
            marginTop: 20,
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#A6A1A5",
          }}
        >
          <Image
            source={Images.logo}
            style={{ width: 53.08, height: 15.07, alignSelf: "center" }}
          />

          <TouchableOpacity
            onPress={() => Route.push("/screen/users/profile")}
            style={{
              width: 30,
              height: 30,
              backgroundColor: "#ffffff",
              borderRadius: 30,
              alignSelf: "center",
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#BDBFC1",
                alignSelf: "center",
                marginTop: 5,
              }}
            >
              JD
            </Text>
          </TouchableOpacity>
        </View>

        {/* CATEGORY TABS */}
        <View>
          <CategoryTabs
            data={categories}
            activeCategory={activeCategory}
            onSelect={(id) => setActiveCategory(id)}
          />
        </View>

        {/* MASONRY FEED */}
        <View>
          <MasonryList
            data={filteredPosts}   // 🔥 IMPORTANT CHANGE
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <PostCard post={item as any} />
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
