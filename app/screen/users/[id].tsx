import { Icons } from "@/constants/icons";
import { users } from "@/data/users";
import { postsData } from "@/data/posts";

import { BlurView } from "expo-blur";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Switch,
  Dimensions
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { width } = Dimensions.get("window");
  const Route = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(width)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;

   const openSettings = () => {
    setSettingsVisible(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSettings = () => {
  Animated.parallel([
    Animated.timing(slideAnim, {
      toValue: width, // 🔥 pushes back OUT to right
      duration: 220,
      useNativeDriver: true,
    }),
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }),
  ]).start(() => setSettingsVisible(false));
};


  const authenticatedUserId = "u1";

  const authUser = users.find(
    (u) => String(u.id) === String(authenticatedUserId)
  );


  const { id } = useLocalSearchParams();
  const paramId = Array.isArray(id) ? id[0] : id;


  let user = null;


  if (paramId) {
    const found = users.find(
      (u) => String(u.id) === String(paramId)
    );

    if (found) {
      user = found;
    }
  }

  // 2️⃣ Fallback to authenticated user
  if (!user && authUser) {
    user = authUser;
  }

  // 3️⃣ Final fallback (no user at all)
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 100 }}>
          No user found
        </Text>
      </View>
    );
  }

  /* =========================
     🔥 OWNER CHECK
  ========================= */
  const isOwner =
    String(user.id) === String(authenticatedUserId);

  /* =========================
     🔥 USER POSTS
  ========================= */
  const userPosts = postsData.filter(
    (p) => String(p.userId) === String(user.id)
  );

  /* =========================
     🔥 RANDOM BACKGROUND
  ========================= */
  const randomPost =
    userPosts.length > 0
      ? userPosts[Math.floor(Math.random() * userPosts.length)]
      : null;

  /* =========================
     🔥 SCROLL ANIMATION
  ========================= */
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -120],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  /* =========================
     🔥 COUNT ANIMATION
  ========================= */
  const [followers, setFollowers] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    let f = 0;
    let p = 0;
    let fg = 0;

    const interval = setInterval(() => {
      if (f < user.followersCount)
        f += Math.ceil(user.followersCount / 30);

      if (p < userPosts.length)
        p += Math.ceil(userPosts.length / 30);

      if (fg < user.followingCount)
        fg += Math.ceil(user.followingCount / 30);

      setFollowers(Math.min(f, user.followersCount));
      setPostsCount(Math.min(p, userPosts.length));
      setFollowing(Math.min(fg, user.followingCount));
    }, 30);

    return () => clearInterval(interval);
  }, [user.id]);

  /* =========================
     UI
  ========================= */
  return (
    <View style={styles.container}>
      
      {/* BACKGROUND */}
      <ImageBackground
        source={{
          uri: randomPost?.image || user.profilePicture,
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => Route.back()}>
            <Image source={Icons.back} style={styles.icon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={openSettings}>
            <Image source={Icons.setting} style={styles.icon} />
          </TouchableOpacity>
        </View>

        {/* SCROLL */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 200 }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          
          {/* PROFILE CARD */}
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ translateY: headerTranslate }],
                opacity: headerOpacity,
              },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />

            {/* PROFILE IMAGE */}
            <View style={styles.profileBox}>
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileImage}
              />
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.location}>
                {user.bio || "Creative Artist"}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{postsCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>

                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>

                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{following}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            {/* FOLLOW BUTTON */}
            {!isOwner && (
              <TouchableOpacity style={styles.followBtn}>
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* POSTS */}
{/* POSTS */}
<View style={styles.postsWrapper}>
  <BlurView
    intensity={20}
    tint="dark"
    style={StyleSheet.absoluteFillObject}
  />

  <View style={styles.postsContainer}>
    {userPosts.map((post) => (
      <TouchableOpacity
        key={post.id}
        activeOpacity={0.9}
        onPress={() =>
          Route.push({
            pathname: "/screen/details/[id]",
            params: { id: post.id },
          })
        }
        style={styles.postTouchable}
      >
        <Image
          source={{ uri: post.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ))}
  </View>
</View>

        </Animated.ScrollView>
        <Modal transparent visible={settingsVisible} animationType="none">
        <View style={styles.modalOverlay}>
          
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >


            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>

              <TouchableOpacity onPress={closeSettings}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View>
    
            </View>

            

          </Animated.View>
        </View>
      </Modal>

      </SafeAreaView>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 20,
  },

  icon: {
    width: 22,
    height: 22,
  },

  card: {
    marginTop: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "visible",
  },

  profileBox: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 20,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
  },

  content: {
    alignItems: "center",
  },

  name: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },

  location: {
    fontSize: 17,
    color: "#ccc",
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
    width: "80%",
  },

  stat: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },

  statLabel: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 2,
  },

  followBtn: {
    width: "90%",
    backgroundColor: "#ED3237",
    height: 50,
    alignSelf: "center",
    borderRadius: 30,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  followText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  postsWrapper: {
    marginTop: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  postsContainer: {
    padding: 20,
  },

  postCard: {
    height: 300,
    borderRadius: 20,
    marginBottom: 15,
  },
  postTouchable: {
  width: "100%",
  marginBottom: 15,
  borderRadius: 20,
  overflow: "hidden",
},

postImage: {
  width: "100%",
  height: 420, 
  borderRadius: 20,
},
 modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "90%",
    padding: 20,
    backgroundColor: "#000000"
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  modalTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },

  closeText: {
    color: "#ED3237",
    fontWeight: "bold",
  },

  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
  },

  settingText: {
    color: "#fff",
    fontSize: 16,
  },
});