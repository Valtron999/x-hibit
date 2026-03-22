import { Images } from "@/constants/images";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  StyleSheet,
  View
} from "react-native";

const slides = [
  {
    image: Images.join,
    text: "Be part of a creative community",
  },
  {
    image: Images.discover,
    text: "Explore new art every day",
  },
  {
    image: Images.share,
    text: "Turn your art into impact",
  },
];

export default function Screen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | number | null>(null);

  // SLIDE + FADE LOGIC
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setIndex((prev) => prev + 1);
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // AUTO ROUTE AFTER LAST SLIDE
  useEffect(() => {
    if (index === slides.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);

      setTimeout(() => {
        router.replace("/authscreen");
      }, 600);
    }
  }, [index]);

  if (index >= slides.length) return null;

  return (
    <ImageBackground
      source={Images.onboardingbg}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* IMAGE */}
      <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
        <Animated.Image
          source={slides[index].image}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      {/* TEXT */}
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        {slides[index].text}
      </Animated.Text>

      {/* DOTS */}
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    alignItems: "center",
  },

  imageWrapper: {
    marginTop: "12%",
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  text: {
    marginTop: -30,
    paddingHorizontal: 30,
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  pagination: {
    flexDirection: "row",
    marginTop: 20,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "white",
    opacity: 0.4,
    marginHorizontal: 5,
  },

  activeDot: {
    width: 40,
    opacity: 1,
  },
});
