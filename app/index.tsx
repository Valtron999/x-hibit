import { Images } from "@/constants/images";
import { useAuth } from "@/hooks/useAuth";
import { Asset } from "expo-asset";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [assetsReady, setAssetsReady] = useState(false);

  // Preload assets, enforcing a minimum splash duration so it doesn't flash by
  useEffect(() => {
    let mounted = true;
    const MIN_MS = 2000;
    const start = Date.now();

    const preload = async () => {
      const assets = [
        Images.logo,
        Images.art1,
        Images.art2,
        Images.art3,
        Images.art4,
        Images.art5,
        Images.art6,
        Images.onboardingbg,
        Images.join,
        Images.discover,
        Images.share,
      ];

      try {
        await Asset.loadAsync(assets);
      } catch (err) {
        console.warn("Asset preload failed:", err);
      }

      if (!mounted) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => {
        if (mounted) setAssetsReady(true);
      }, wait);
    };

    preload();

    return () => {
      mounted = false;
    };
  }, []);

  // Only redirect once BOTH assets are ready AND we know the auth state —
  // otherwise a logged-in user could flash onboarding before session loads.
  useEffect(() => {
    if (!assetsReady || authLoading) return;

    if (session) {
      router.replace("/screen"); // already logged in → straight to home
    } else {
      router.replace("/onboarding"); // no session → onboarding flow
    }
  }, [assetsReady, authLoading, session]);

  return (
    <View style={styles.container}>
      <Image
        source={Images.logo}
        style={styles.logo}
      />
      <Text style={styles.tagline}>Imagination to creation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#030303",
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


// import { Images } from "@/constants/images";
// import { Asset } from "expo-asset";
// import { useRouter } from "expo-router";
// import { useEffect } from "react";
// import { Image, StyleSheet, Text, View } from "react-native";

// export default function Index() {
//   const router = useRouter();

//   useEffect(() => {
//     let mounted = true;
//     const MIN_MS = 2000;
//     const start = Date.now();

//     const preload = async () => {
//       const assets = [
//         Images.logo,
//         Images.art1,
//         Images.art2,
//         Images.art3,
//         Images.art4,
//         Images.art5,
//         Images.art6,
//         Images.onboardingbg,
//         Images.join,
//         Images.discover,
//         Images.share,
//       ];

//       try {
//         await Asset.loadAsync(assets);
//       } catch (err) {
//         console.warn("Asset preload failed:", err);
//       }

//       if (!mounted) return;
//       const elapsed = Date.now() - start;
//       const wait = Math.max(0, MIN_MS - elapsed);
//       setTimeout(() => {
//         if (mounted) router.replace("/onboarding");
//       }, wait);
//     };

//     preload();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Image
//         source={Images.logo}
//         style={styles.logo}
//       />
//       <Text style={styles.tagline}>Imagination to creation</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#030303",
//   },
//   logo: {
//     width: 98.91,
//     height: 28.08,
//     marginBottom: 8,
//   },
//   tagline: {
//     color: "#FEFEFE",
//     fontWeight: "bold",
//   },
// });
