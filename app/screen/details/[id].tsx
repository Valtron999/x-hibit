import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import { postsData } from "@/data/posts";
import { users } from "@/data/users";
import MasonryList from "@react-native-seoul/masonry-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

const Details = () => {
  const [visible, setVisible] = useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { width } = useWindowDimensions();
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  // get current post
  const post = postsData.find((p) => p.id === id);

  // get user
  const user = users.find((u) => u.id === post?.userId);

  // more by same artist
  const moreByArtist = postsData.filter(
    (p) => p.userId === post?.userId && p.id !== post?.id
  );

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: "#030303" }}
    >
      {/* IMAGE */}
      <View
        style={{
          margin: 10,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <ImageBackground
          source={{ uri: post.image }}
          style={{ width: "100%", height: 600 }}
          resizeMode="cover"
        >
          <TouchableOpacity
            onPress={router.back}
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 45,
              height: 47,
              borderRadius: 11,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#030303",
            }}
          >
            <Image
              source={Icons.back}
              style={{ width: 20, height: 20, tintColor: "#FEFEFE" }}
            />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      {/* STATS */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={Icons.heartActive}
            style={{ width: 24, height: 24, tintColor: "#ED3237", marginRight: 5 }}
          />
          <Text style={{ color: "#D4D2D3", fontSize: 18 }}>
            {post.likes}
          </Text>

          <Image
            source={Icons.comment}
            style={{ width: 24, height: 24, marginLeft: 20, marginRight: 5 }}
          />
          <Text style={{ color: "#D4D2D3", fontSize: 18 }}>
            {post.commentsCount}
          </Text>
          
          <TouchableOpacity onPress={() => setVisible(true)}>
          <Image
            source={Icons.share}
            style={{ width: 24, height: 24, marginLeft: 20, }}
          />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            height: 48,
            width: 80,
            backgroundColor: "#ED3237",
            borderRadius: 14.87,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <Text style={{ color: "#FEFEFE", fontSize: 14 }}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* USER + DESCRIPTION */}
      <View style={{ margin: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 20,
              backgroundColor: "#D4D2D3",
              marginRight: 10,
            }}
          />

          <Text
            style={{
              color: "#FEFEFE",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {user?.name || "Unknown Artist"}
          </Text>
        </View>

        <Text style={{ color: "#FEFEFE", fontSize: 14, marginTop: 5 }}>
          {post.description}
        </Text>

        <TouchableOpacity
          style={{
            height: 48,
            width: "100%",
            backgroundColor: "#BDBFC1",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text
            style={{
              color: "#FEFEFE",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Purchase Art
          </Text>
        </TouchableOpacity>
      </View>

      {/* MORE BY ARTIST */}
      <View style={{ marginHorizontal: 10 }}>
        <Text
          style={{
            color: "#FEFEFE",
            fontSize: 15,
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          More by the artist
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 10 }}
        >
          {moreByArtist.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/screen/details/[id]",
                  params: { id: item.id },
                })
              }
            >
              <Image
                source={{ uri: item.image }}
                style={{
                  width: 146,
                  height: 260,
                  borderRadius: 10,
                  marginRight: 10,
                }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MORE TO EXPLORE */}
      <View style={{ marginHorizontal: 10 }}>
        <Text
          style={{
            color: "#FEFEFE",
            fontSize: 15,
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          More to explore
        </Text>

        <View style={{ marginVertical: 10 }}>
          <MasonryList
            data={postsData}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            renderItem={({ item }) => <PostCard post={item as any} />}
          />
        </View>
      </View>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={{
              flex: 1,
              backgroundColor: "rgba(24, 1, 1, 0.5)",
              justifyContent: "center",
              alignItems: "center",
          }}>
          <View style={{
                width: "80%",
                backgroundColor: "#000000",
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderRadius: 12,
                // alignItems: "center",
          }}>

          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%"}}>
            <Text style={{
              color: "#fefefe",
              fontWeight: "bold",
              fontSize: 16,
            }}> Share</Text>

            <TouchableOpacity onPress={() => setVisible(false)} style={{backgroundColor: "#1A1919", padding: 10, borderRadius: 6, width: 35, height: 35, justifyContent: "center", alignItems: "center", }}>
              <Text style={{color: "#c9c9c9"}}>X</Text>
            </TouchableOpacity>
          </View>
          
            <Text style={{
              color: "#686666",
              fontWeight: "bold",
              fontSize: 16,
              marginTop: 20

            }}> Share link via</Text>
          <View style={{marginTop: 5, flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%"}}>
            <TouchableOpacity style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginRight: 5}}>
              <Image source={Icons.setting} style={{width: 30, height: 30, tintColor: "#3b5998", marginRight: 5}} />
              
            </TouchableOpacity>
            <TouchableOpacity style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.setting} style={{width: 30, height: 30, tintColor: "#00acee", marginRight: 5}} />
            </TouchableOpacity>
            <TouchableOpacity style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.setting} style={{width: 30, height: 30, tintColor: "#00acee", marginRight: 5}} />
            </TouchableOpacity>
            <TouchableOpacity style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.setting} style={{width: 30, height: 30, tintColor: "#00acee", marginRight: 5}} />
            </TouchableOpacity>
            <TouchableOpacity style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.setting} style={{width: 30, height: 30, tintColor: "#00acee", marginRight: 5}} />
            </TouchableOpacity>
          </View>
            <Text style={{
              color: "#686666",
              fontWeight: "bold",
              fontSize: 16,
              marginTop: 20

            }}> Page Direct</Text>
            <TouchableOpacity style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 20, borderRadius: 12, flex: 1, marginLeft: 5, marginTop:10, marginHorizontal: 10, marginBottom: 10, }}>
              <Image source={Icons.setting} style={{width: 20, height: 20, tintColor: "#00acee", marginRight: 5, }} />
              <Text style={{color: "#fefefe",fontWeight: "bold", marginLeft: 5, }}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

export default Details;