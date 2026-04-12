import { Icons } from "@/constants/icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
    Animated,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const Route = useRouter();

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

  return (
    <View style={styles.container}>
      
      {/* Background */}
      <ImageBackground
        source={{
          uri: "https://i.pinimg.com/1200x/b6/75/ff/b675ffb1f534c355d1be75cebe4a293e.jpg",
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={()=> Route.back()}>
            <Image source={Icons.back} style={styles.icon} />
          </TouchableOpacity>

          <TouchableOpacity>
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
            
            {/* Blur ONLY background layer */}
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />

            {/* PROFILE IMAGE (FLOAT FIXED) */}
            <View style={styles.profileBox}>
              <Image
                source={{
                  uri: "https://i.pinimg.com/736x/1d/0f/aa/1d0faaad3a6c1d6fcb5d76c2a6d8c4b7.jpg",
                }}
                style={styles.profileImage}
              />
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
              <Text style={styles.name}>Adeola Richard</Text>
              <Text style={styles.location}>Lekki, Lagos</Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>290</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>

                <View style={styles.stat}>
                  <Text style={styles.statNumber}>2500</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>

                <View style={styles.stat}>
                  <Text style={styles.statNumber}>180</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* POSTS SECTION */}
          <View style={styles.postsWrapper}>
            
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.postsContainer}>
              {[...Array(12)].map((_, i) => (
                <View key={i} style={styles.postCard} />
              ))}
            </View>
          </View>

        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

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

  /* PROFILE CARD */
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

    overflow: "visible", // 🔥 IMPORTANT FIX (was clipping float)
    zIndex: 5,
  },

  /* FLOATING PROFILE FIX */
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

    zIndex: 999, // 🔥 IMPORTANT
    elevation: 20, // Android fix
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

  /* POSTS */
  postsWrapper: {
    marginTop: 10,
    marginHorizontal: 0,
    borderRadius:0,
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    marginBottom: 15,
  },
});