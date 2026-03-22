import CategoryTabs from "@/components/category";
import PostCard from "@/components/PostCard";
import { Images } from "@/constants/images";
import { categories } from "@/data/category";
import { postsData } from "@/data/posts";
import MasonryList from "@react-native-seoul/masonry-list";
import { useState } from "react";
import { Image, ScrollView, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
    const { width } = useWindowDimensions();
    const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;
    const [activeCategory, setActiveCategory] = useState("1");
    return(
        <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: "#030303" }}>       
            <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, marginTop: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#A6A1A5"}}>
                <Image source={Images.logo} style={{ width: 53.08, height: 15.07, alignSelf: "center", }} />
                <TouchableOpacity style={{ width: 30, height: 30, backgroundColor: "#ffffff", borderRadius: 30, alignSelf: "center", marginTop: 10, }}>

                </TouchableOpacity>
            </View>
            <View>
                <CategoryTabs
                    data={categories}
                    activeCategory={activeCategory}
                    onSelect={(id) => setActiveCategory(id)}
                />
            </View>
            <View>
            <MasonryList
                data={postsData}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <PostCard post={item} />}
            />
            </View>
            </ScrollView>

        </SafeAreaView>
    )
}


export default Home