import PostCard from "@/components/PostCard";
import { Icons } from "@/constants/icons";
import { comments as allComments } from "@/data/comments";
import { postsData } from "@/data/posts";
import { users } from "@/data/users";
import MasonryList from "@react-native-seoul/masonry-list";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  Linking,
  Modal, Platform, ScrollView,
  Share,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Details = () => {
    const [visible, setVisible] = useState(false);
    const [commentVisible, setCommentVisible] = useState(false);
    
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

    //  Get id from route params
    const { id } = useLocalSearchParams<{ id: string }>();

    //  Derived data from relations
    const post = postsData.find((p) => p.id === id);
    const user = users.find((u) => u.id === post?.userId);
    const moreByArtist = postsData.filter(
        (p) => p.userId === post?.userId && p.id !== post?.id
    );
    const baseComments = allComments.filter((c) => c.postId === post?.id);

    //  Guard — if post not found
    if (!post || !user) {
        return (
            <View style={{ flex: 1, backgroundColor: '#030303', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff' }}>Post not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
                    <Text style={{ color: '#D4D2D3' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }
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

    const Header = () => (
        <>
            {/* Hero Image with Gradient */}
            <View style={{ width: '100%', height: 500 }}>
                <ImageBackground
                    source={{ uri: post.image }}   
                    style={{ width: '100%', height: '100%' }}
                />
                <LinearGradient
                    colors={['#030303', 'transparent']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '60%',
                    }}
                />
            </View>

            {/* Content Section */}
            <View style={{ width: '100%', marginTop: -100 }}>

                {/* Title & Description */}
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50 }}>
                    <Text style={{ color: "#fefefe", fontSize: 26, textAlign: 'center' }}>{post.title}</Text>
                    <Text style={{ color: "#D4D2D3", textAlign: 'center', marginTop: 6 }}>
                        {post.description}
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                    paddingHorizontal: 10
                }}>
                    {/* Artist */}
                    <TouchableOpacity style={{
                        backgroundColor: '#4B4B4D',
                        height: 56, 
                        flex: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Artist</Text>
                        <Text style={{ fontWeight: 'bold', color: '#fefefe' }} numberOfLines={1}>
                            {user.name}   
                        </Text>
                    </TouchableOpacity>

                    {/* Type */}
                    <TouchableOpacity style={{
                        backgroundColor: '#4B4B4D',
                        height: 56, flex: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginHorizontal: 10
                    }}>
                        <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Type</Text>
                        <Text style={{ fontWeight: 'bold', color: '#fefefe' }} numberOfLines={1}>
                            {post.category ?? 'Painting'}   
                        </Text>
                    </TouchableOpacity>

                    {/* Likes count */}
                    <TouchableOpacity style={{
                        backgroundColor: '#4B4B4D',
                        height: 56, flex: 1,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Text style={{ fontSize: 10, color: "#D4D2D3" }}>Likes</Text>
                        <Text style={{ fontWeight: 'bold', color: '#fefefe', textAlign: 'center' }}>
                            {post.likes?.toLocaleString() ?? 0}   
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Likes / Comments / Share Row */}
                <View style={{
                    marginTop: 10,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity>
                            <Image source={Icons.heartActive} style={{ width: 20, height: 20 }} />
                        </TouchableOpacity>
                       
                        <Text style={{ color: '#D4D2D3', marginHorizontal: 5 }}>
                            {post.likes?.toLocaleString() ?? 0}
                        </Text>

                        <TouchableOpacity onPress={() => setCommentVisible(true)}>
                            <Image source={Icons.comment} style={{ width: 20, height: 20 }} />
                        </TouchableOpacity>
                       
                       
                        <Text style={{ color: '#D4D2D3', marginHorizontal: 5 }}>
                            {baseComments.length}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={() => setVisible(true)}>
                        <Image source={Icons.share} style={{ width: 20, height: 20 }} />
                    </TouchableOpacity>
                </View>

                
                {moreByArtist.length > 0 && (
                    <View style={{ marginTop: 20, paddingLeft: 10 }}>
                        <Text style={{ color: '#BDBFC1', fontSize: 16, fontWeight: 'bold' }}>
                            More by {user.name}
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginTop: 10 }}
                        >
                            {moreByArtist.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => router.push(`/screen/details/${p.id}`)}
                                >
                                    <Image
                                        source={{ uri: p.image }}
                                        style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                
                <View style={{ marginTop: 20, paddingLeft: 10 }}>
                    <Text style={{ color: '#BDBFC1', fontSize: 16, fontWeight: 'bold' }}>
                        Recommendation
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 10 }}
                    >
                        {postsData
                            .filter((p) => p.userId !== post.userId && p.id !== post.id)
                            .slice(0, 10)
                            .map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => router.push(`/screen/details/${p.id}`)}
                                >
                                    <Image
                                        source={{ uri: p.image }}
                                        style={{ width: 150, height: 200, borderRadius: 5, marginRight: 10 }}
                                    />
                                </TouchableOpacity>
                            ))}
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
        onRequestClose={() => setCommentVisible(false)}
      >
        <View style={{
              flex: 1,
              backgroundColor: "rgba(24, 1, 1, 0.5)",
              justifyContent: "flex-end",
          }}>
          <View style={{
                width: "100%",
                backgroundColor: "#000000",
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                height: "80%",
          }}>
            <Text style={{
              color: "#fefefe",
              fontWeight: "bold",
              fontSize: 16,
            }}> Comments</Text>
            </View>
        </View>

      </Modal>
      
                    </ScrollView>
                </View>

                {/* More to Explore label */}
                <View style={{ marginTop: 20, paddingLeft: 10, paddingBottom: 10 }}>
                    <Text style={{ color: '#BDBFC1', fontSize: 16, fontWeight: 'bold' }}>
                        More to Explore
                    </Text>
                </View>

            </View>
        </>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#030303' }}>

            <MasonryList
                data={postsData.filter((p) => p.id !== post.id)} //  exclude current post
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <PostCard post={item as any} />}
                ListHeaderComponent={<Header />}
                contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 40 }}
                nestedScrollEnabled
            />

            {/* Back Button */}
            <TouchableOpacity
                onPress={() => router.back()}
                style={{
                    position: 'absolute',
                    top: insets.top + 12,
                    left: 16,
                    zIndex: 100,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Image source={Icons.back} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>

        </View>
    );
}

export default Details;