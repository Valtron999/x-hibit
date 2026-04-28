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
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const { width } = useWindowDimensions();
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const Route = useRouter();


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
            style={{ width: 53.08*2, height: 15.07*2, alignSelf: "center" }}
          />

          <TouchableOpacity
            onPress={() => Route.push("/screen/users/u1")}
            style={{
              width: 35,
              height: 35,
              backgroundColor: "#ffffff",
              borderRadius: 30,
              alignSelf: "center",
              marginTop: 10,
            }}
          >

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
            data={filteredPosts}  
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
