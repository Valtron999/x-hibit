import { Images } from "@/constants/images";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";

type FloatingImage = {
  id: number;
  source: any;
  style: ViewStyle;
};

const FloatingCollage = () => {
  const Route = useRouter();
  const floatingImages: FloatingImage[] = [
    {
      id: 1,
      source: Images.art1,
      style: { top: -90, right: -25, width: 194.0, height: 257.0},
    },
    {
      id: 2,
      source: Images.art2,
      style: { top: 140, right: 150, width: 160, height: 97.0 },
    },
    {
      id: 3,
      source: Images.art3,
      style: { top: 200, left: -25, width: 194.0, height: 173.0 },
    },
    {
      id: 4,
      source: Images.art4,
      style: { top: 100, right: 80, width: 194.0, height: 257.0 },
    },
    {
      id: 5,
      source: Images.art5,
      style: { top: -90, left: -25, width: 194.0, height: 257.0 },
    },
    {
      id: 6,
      source: Images.art6,
      style: { top: 200, right: -25, width: 100, height: 100 },
    }
  ];

  const animations = useRef(
    floatingImages.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(40),
      scale: new Animated.Value(0.95),
    }))
  ).current;

  useEffect(() => {
    const anims = animations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 140,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          delay: index * 140,
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 500,
          delay: index * 140,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(120, anims).start();
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: "#030303" }}>
    <View style={styles.container}>
      {floatingImages.map((item, index) => {
        const anim = animations[index];

        return (
          <Animated.View
            key={item.id}
            style={[
              styles.card,
              item.style,
              {
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { scale: anim.scale },
                ],
              },
            ]}
          >
            <Image
              source={item.source}
              style={styles.image}
              resizeMode="cover"
            />
          </Animated.View>
        );
      })}
    </View>
    
        <View style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#030303"
        }}>
                  <Image
                    source={Images.logo}
                    style={styles.logo}
                  />
                  <Text style={styles.tagline}>Imagination to creation</Text>
                <TouchableOpacity style={{ height: 54.0, minWidth: 334.0, backgroundColor: "#ED3237", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 30 }} onPress={()=> Route.push("/authscreen/signup")}>
                  <Text style={{ color: "#FEFEFE", fontWeight: "bold" }}>Get Started</Text>
                </TouchableOpacity>

                 <TouchableOpacity onPress={()=> Route.push("/authscreen/login")} style={{ height: 54.0, minWidth: 334.0, backgroundColor: "#9C9996", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 10 }}>
                    <Text style={{ color: "#FEFEFE", fontWeight: "bold" }}>Log in</Text>
                </TouchableOpacity>
                 <TouchableOpacity onPress={()=> Route.push("/screen")} style={{ height: 54.0, minWidth: 334.0, backgroundColor: "#301902", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 10, marginBottom: 20  }}>
                    <Text style={{ color: "#FEFEFE", fontWeight: "bold"}}>Temp</Text>
                </TouchableOpacity>
                
        </View>
    </ScrollView>
  );
};

export default FloatingCollage;

const styles = StyleSheet.create({
  container: {
    height: 420,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#030303",
  },

  card: {
    position: "absolute",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#030303",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  image: {
    width: "100%",
    height: "100%",
  },
    logo: {
    width: 98.91,
    height: 28.08,
    marginBottom: 8,
  },
  tagline: {
    color: "#FEFEFE",
    fontWeight: "bold",
  },
});
