import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import { postsData } from "@/data/posts";
import { users } from "@/data/users";
import MasonryList from "@react-native-seoul/masonry-list";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal, Platform, ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

import { comments as allComments } from "@/data/comments";

const Details = () => {
  const [visible, setVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);

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

  // get comments for current post
  const baseComments = allComments.filter(
    (c) => c.postId === post.id
  );

  // helper get user for comment
  const getCommentUser = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(baseComments);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);

  // toggle like function
  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLocalLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  // add comment function
  const addComment = () => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      postId: post.id,
      userId: "u1", // replace with logged-in user later
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setLocalComments([newComment, ...localComments]);
    setLocalCommentsCount(prev => prev + 1);
    setCommentText("");
  };

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Post not found</Text>
      </View>
    );
  }

// url for sharing
  const shareUrl = `https://x-hibit.vercel.app/screen/details/${id}`;
  const message = `Check out this artwork on X-Hibit 👇\n${shareUrl}`;


// share functions
const shareToFacebook = () => {
  Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`);
};

const shareToX = () => {
  Linking.openURL(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
  );
};

const shareToWhatsApp = () => {
  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
};

const openInstagram = () => {
  Linking.openURL("https://www.instagram.com/");
};

// LINK (WEB + MOBILE)
const copyLink = async () => {
  try {
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(shareUrl);
    }
    alert("Link copied!");
  } catch (err) {
    alert("Failed to copy link");
  }
};

// system share
const systemShare = async () => {
  try {
    await Share.share({ message });
  } catch (error) {
    console.log(error);
  }
};

// download image
const downloadImage = async (imageUrl: string) => {
  try {
    // WEB DOWNLOAD
    if (Platform.OS === "web") {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "x-hibit-image.jpg";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("Download started!");
      return;
    }

    // MOBILE DOWNLOAD
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== "granted") {
      alert("Permission needed to save image");
      return;
    }

    const fileUri = FileSystem.documentDirectory + "x-hibit-image.jpg";

    const downloaded = await FileSystem.downloadAsync(imageUrl, fileUri);

    await MediaLibrary.saveToLibraryAsync(downloaded.uri);

    alert("Image saved to gallery!");
  } catch (error) {
    console.log(error);
    alert("Download failed");
  }
};
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
          <TouchableOpacity onPress={toggleLike}>
            <Image
              source={isLiked ? Icons.heartActive : Icons.heartInactive}
              style={{ width: 24, height: 24, tintColor: isLiked ? "#ED3237" : "#D4D2D3", marginRight: 5 }}
            />
          </TouchableOpacity>
          <Text style={{ color: "#D4D2D3", fontSize: 18 }}>
            {localLikes}
          </Text>
          <TouchableOpacity onPress={() => setCommentVisible(true)}>
            <Image
              source={Icons.comment}
              style={{ width: 24, height: 24, marginLeft: 20, marginRight: 5 }}
            />
          </TouchableOpacity>
          <Text style={{ color: "#D4D2D3", fontSize: 18 }}>
            {localCommentsCount}
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

      {/* Modal for share */}
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
                <Image source={Icons.close} style={{width: 15, height: 15, tintColor: "#fefefe"}} />
            </TouchableOpacity>
          </View>
          
            <Text style={{
              color: "#686666",
              fontWeight: "bold",
              fontSize: 16,
              marginTop: 20

            }}> Share link via</Text>
          <View style={{marginTop: 5, flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%"}}>
            <TouchableOpacity onPress={shareToFacebook} style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginRight: 5}}>
              <Image source={Icons.facebook} style={{width: 30, height: 30, resizeMode: "contain", alignSelf: "center"}} />
          </TouchableOpacity>

            <TouchableOpacity onPress={shareToWhatsApp} style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.whatsapp} style={{width: 30, height: 30, resizeMode: "contain", alignSelf: "center"}} />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareToX} style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.x} style={{width: 30, height: 30, resizeMode: "contain", alignSelf: "center"}} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openInstagram} style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.instagram} style={{width: 30, height: 30, resizeMode: "contain", alignSelf: "center"}} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => downloadImage(post.image)} style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 10, borderRadius: 12, flex: 1, marginLeft: 5}}>
              <Image source={Icons.download} style={{width: 30, height: 30, resizeMode: "contain", alignSelf: "center"}} />
            </TouchableOpacity>
          </View>
            <Text style={{
              color: "#686666",
              fontWeight: "bold",
              fontSize: 16,
              marginTop: 20

            }}> Page Direct</Text>
            <TouchableOpacity onPress={copyLink} style={{flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#1A1919", padding: 20, borderRadius: 12, flex: 1, marginLeft: 5, marginTop:10, marginHorizontal: 10, marginBottom: 10, }}>
              <Image source={Icons.copy} style={{width: 30, height: 20, tintColor: "#00acee", marginRight: 5, }} />
              <Text style={{color: "#fefefe",fontWeight: "bold", marginLeft: 5, }}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for comments */}
      <Modal
        visible={commentVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
                  <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
          <View style={{
              flex: 1,
              backgroundColor: "rgba(24, 1, 1, 0.5)",
              justifyContent: "flex-end",
              alignItems: "center",
              
          }}>
          <View style={{
                width: "100%",
                height: "85%",
                backgroundColor: "#000000",
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderTopStartRadius: 31,
                borderTopEndRadius: 31,
          }}>

          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%",
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 2,
            borderBottomColor: "#A6A1A5",
          }}>
            <TouchableOpacity onPress={() => setCommentVisible(false)}>
              <Image source={Icons.close} style={{width: 15, height: 15}} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={copyLink}>
              <Image source={Icons.share} style={{width: 15, height: 15}} />
            </TouchableOpacity>
            </View>
                  <ScrollView
                          showsVerticalScrollIndicator={false}
                          style={{ marginTop: 20 }}
                          contentContainerStyle={{ paddingBottom: 120 }}
                        >
                  {localComments.map((comment) => {
                    const commentUser = getCommentUser(comment.userId);

                    return (
                      <View
                        key={comment.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 15,
                        }}
                      >
                        {/* avatar */}
                        <Image
                          source={{ uri: commentUser?.profilePicture }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            marginRight: 10,
                          }}
                        />

                        {/* comment box */}
                        <View
                          style={{
                            backgroundColor: "#1A1919",
                            padding: 10,
                            flex: 1,
                          }}
                        >
                          <Text style={{ color: "#999", fontSize: 12, marginBottom: 3 }}>
                            {commentUser?.name || "Unknown User"}
                          </Text>

                          <Text style={{ color: "#fefefe" }}>{comment.content}</Text>
                        </View>
                      </View>
                    );
                  })}
            </ScrollView>
            {/* comment input */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "#000",
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderTopWidth: 1,
                        borderTopColor: "#333",
                      }}
                    >
                    <TextInput
                      placeholder="Comment this artwork"
                      placeholderTextColor="#999"
                      value={commentText}
                      onChangeText={setCommentText}
                      style={{
                        flex: 1,
                        backgroundColor: "#1A1A1A",
                        borderRadius: 10,
                        paddingHorizontal: 15,
                        color: "#fff",
                        height: 50,
                      }}
                    />

                    <TouchableOpacity
                      onPress={addComment}
                      style={{ marginLeft: 10, width: 50, height: 50, backgroundColor: "#ED3237", borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 15}}
                    >
                      <Image source={Icons.add} style={{width: 20, height: 20}} />
                    </TouchableOpacity>
                  </View>

          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

export default Details;