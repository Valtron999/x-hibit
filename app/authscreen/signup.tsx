import { Icons } from "@/constants/icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { uploadProfileImage } from "@/lib/uploadImage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ---------- helpers ----------
const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const computePasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const getStrengthColor = (score: number) => {
  if (score <= 1) return "#ED3237";
  if (score <= 3) return "#FFA500";
  return "#66BC50";
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i); // most recent first

const computeAge = (dob: Date) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

// ---------- steps ----------
type StepKey =
  | "name"
  | "email"
  | "password"
  | "username"
  | "dob"
  | "gender"
  | "category"
  | "photo"
  | "terms";

const STEPS: StepKey[] = [
  "name",
  "email",
  "password",
  "username",
  "dob",
  "gender",
  "category",
  "photo",
  "terms",
];

const OPTIONAL_STEPS: StepKey[] = ["photo"];

// ---------- reusable UI ----------

const ProgressBar = ({ progress }: { progress: number }) => {
  const anim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 250, useNativeDriver: false }).start();
  }, [progress]);
  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
};

const StepHeader = ({
  onBack,
  onSkip,
  progress,
}: {
  onBack: () => void;
  onSkip?: () => void;
  progress: number;
}) => (
  <View>
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Image source={Icons.back} style={styles.backIcon} />
      </TouchableOpacity>
      {onSkip ? (
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} />
      )}
    </View>
    <ProgressBar progress={progress} />
  </View>
);

const ContinueButton = ({
  label = "Continue",
  disabled,
  loading,
  onPress,
}: {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    disabled={disabled || loading}
    onPress={onPress}
    style={[styles.continueButton, { opacity: disabled ? 0.4 : 1 }]}
  >
    {loading ? <ActivityIndicator color="#030303" /> : <Text style={styles.continueButtonText}>{label}</Text>}
  </TouchableOpacity>
);

// ---------- wheel picker ----------

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 7;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2;

const WheelColumn = ({
  data,
  selectedIndex,
  onChange,
}: {
  data: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [centerIndex, setCenterIndex] = useState(selectedIndex);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    setCenterIndex(selectedIndex);
  }, []);

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    if (clamped !== centerIndex) setCenterIndex(clamped);
  };

  const handleMomentumEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    onChange(clamped);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ height: PICKER_HEIGHT }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={handleMomentumEnd}
      contentContainerStyle={{ paddingVertical: PADDING }}
    >
      {data.map((label, i) => (
        <View key={label} style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" }}>
          <Text style={i === centerIndex ? styles.wheelItemSelected : styles.wheelItem}>{label}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const DOBWheelPicker = ({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
}) => {
  const initial = value ?? new Date(CURRENT_YEAR - 18, 0, 1);
  const [monthIdx, setMonthIdx] = useState(initial.getMonth());
  const [yearIdx, setYearIdx] = useState(YEARS.indexOf(initial.getFullYear()) ?? 18);

  useEffect(() => {
    const year = YEARS[yearIdx] ?? CURRENT_YEAR - 18;
    const date = new Date(year, monthIdx, 1);
    onChange(date);
  }, [monthIdx, yearIdx]);

  const age = useMemo(() => computeAge(new Date(YEARS[yearIdx] ?? CURRENT_YEAR - 18, monthIdx, 1)), [
    monthIdx,
    yearIdx,
  ]);

  return (
    <View>
      <View style={{ height: PICKER_HEIGHT, justifyContent: "center" }}>
        <View style={styles.wheelHighlight} pointerEvents="none" />
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <WheelColumn data={MONTHS} selectedIndex={monthIdx} onChange={setMonthIdx} />
          </View>
          <View style={{ flex: 1 }}>
            <WheelColumn data={YEARS.map(String)} selectedIndex={yearIdx} onChange={setYearIdx} />
          </View>
        </View>
      </View>
      <Text style={styles.ageText}>{age} years old</Text>
    </View>
  );
};

// ---------- main screen ----------

const SignUpScreen = () => {
  const router = useRouter();
  const { signUp } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    dob: "",
    dobDate: null as Date | null,
    gender: "" as "Male" | "Female" | "",
    category: "" as "artist" | "designer" | "photographer" | "model" | "",
    termsAgreed: false,
  });

  const [profileImage, setProfileImage] = useState<{ uri: string; mimeType?: string } | null>(null);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrengthAnim = useRef(new Animated.Value(0)).current;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const strength = computePasswordStrength(form.password);
    Animated.timing(passwordStrengthAnim, {
      toValue: strength / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [form.password]);

  const passwordScore = computePasswordStrength(form.password);

  const goToStep = (index: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStepIndex(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) goToStep(stepIndex + 1);
  };

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
    } else {
      goToStep(stepIndex - 1);
    }
  };

  const skip = () => {
    if (OPTIONAL_STEPS.includes(step)) goNext();
  };

  // per-step validity
  const isStepValid = (() => {
    switch (step) {
      case "name":
        return form.name.trim().length >= 2;
      case "email":
        return validateEmail(form.email);
      case "password":
        return passwordScore >= 2;
      case "username":
        return form.username.length >= 3;
      case "dob":
        return !!form.dobDate;
      case "gender":
        return !!form.gender;
      case "category":
        return !!form.category;
      case "photo":
        return true; // optional
      case "terms":
        return form.termsAgreed;
      default:
        return false;
    }
  })();

  const pickImage = async () => {
    if (Platform.OS === "web") {
      await launchPicker("gallery");
      return;
    }

    Alert.alert("Profile photo", "Choose a source", [
      { text: "Camera", onPress: () => launchPicker("camera") },
      { text: "Photo Library", onPress: () => launchPicker("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const launchPicker = async (source: "camera" | "gallery") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to choose a profile picture.");
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setProfileImage({ uri: asset.uri, mimeType: asset.mimeType ?? undefined });
  };

  const handleSignUp = async () => {
    if (!isStepValid || submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const { error, data } = (await signUp({
      email: form.email,
      password: form.password,
      name: form.name.trim(),
      username: form.username,
      category: form.category as "artist" | "designer" | "photographer" | "model",
      gender: form.gender.toLowerCase() as "male" | "female",
      dateOfBirth: form.dob,
    })) as any;

    if (error) {
      setSubmitting(false);
      setSubmitError(error.message);
      return;
    }

    // Best-effort avatar upload once we have a user id — never block signup on it
    const userId = data?.user?.id;
    if (userId && profileImage) {
      try {
        const publicUrl = await uploadProfileImage(profileImage.uri, userId, profileImage.mimeType);
        await supabase.from("profiles").update({ profile_picture: publicUrl }).eq("id", userId);
      } catch (err) {
        console.error("Profile picture upload failed:", err);
      }
    }

    setSubmitting(false);
    router.replace("/screen");
  };

  const handlePrimaryPress = () => {
    if (step === "terms") {
      handleSignUp();
    } else {
      goNext();
    }
  };

  const progress = (stepIndex + 1) / STEPS.length;

  // ---------- step content ----------
  const renderStep = () => {
    switch (step) {
      case "name":
        return (
          <>
            <Text style={styles.title}>What's your name?</Text>
            <TextInput
              autoFocus
              placeholder="Enter your full name"
              placeholderTextColor="#9C9996"
              style={styles.input}
              value={form.name}
              onChangeText={(val) => setForm({ ...form, name: val })}
            />
          </>
        );

      case "email":
        return (
          <>
            <Text style={styles.title}>What's your email address?</Text>
            <TextInput
              autoFocus
              placeholder="Enter your email"
              placeholderTextColor="#9C9996"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={form.email}
              onChangeText={(val) => {
                setForm({ ...form, email: val });
                setErrors({ ...errors, email: validateEmail(val) ? "" : "Invalid email" });
              }}
            />
            {!!errors.email && !!form.email && <Text style={styles.error}>{errors.email}</Text>}
          </>
        );

      case "password":
        return (
          <>
            <Text style={styles.title}>Create a password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                autoFocus
                placeholder="Password"
                placeholderTextColor="#9C9996"
                style={styles.inputPassword}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(val) => setForm({ ...form, password: val })}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Image source={showPassword ? Icons.hide : Icons.show} style={styles.eyeImage} />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordBarContainer}>
              <Animated.View
                style={[
                  styles.passwordBar,
                  {
                    width: passwordStrengthAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                    backgroundColor: getStrengthColor(passwordScore),
                  },
                ]}
              />
            </View>
            <Text style={styles.helperText}>Use 8 or more characters, numbers and symbols</Text>
          </>
        );

      case "username":
        return (
          <>
            <Text style={styles.title}>Choose a username</Text>
            <TextInput
              autoFocus
              placeholder="Enter your username"
              placeholderTextColor="#9C9996"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              value={form.username}
              onChangeText={(val) => setForm({ ...form, username: val.replace(/\s/g, "") })}
            />
          </>
        );

      case "dob":
        return (
          <>
            <Text style={styles.title}>Confirm your{"\n"}date of birth</Text>
            <DOBWheelPicker
              value={form.dobDate}
              onChange={(date) => setForm({ ...form, dobDate: date, dob: date.toISOString().split("T")[0] })}
            />
          </>
        );

      case "gender":
        return (
          <>
            <Text style={styles.title}>What's your gender?</Text>
            <View style={styles.genderContainer}>
              {(["Female", "Male"] as const).map((g) => {
                const selected = form.gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setForm({ ...form, gender: g })}
                    style={[styles.genderOption, selected && styles.optionSelected]}
                  >
                    <Text style={selected ? styles.optionTextSelected : styles.optionText}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );

      case "category":
        return (
          <>
            <Text style={styles.title}>What best describes you?</Text>
            <View style={styles.categoryContainer}>
              {(["artist", "designer", "photographer", "model"] as const).map((c) => {
                const selected = form.category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setForm({ ...form, category: c })}
                    style={[styles.categoryOption, selected && styles.optionSelected]}
                  >
                    <Text style={[selected ? styles.optionTextSelected : styles.optionText, { textTransform: "capitalize" }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );

      case "photo":
        return (
          <>
            <Text style={styles.title}>Choose a{"\n"}profile picture</Text>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                {profileImage ? (
                  <Image source={{ uri: profileImage.uri }} style={styles.avatarImage} />
                ) : (
                  <Image source={Icons.back} style={styles.avatarPlaceholderIcon} />
                )}
              </View>
              <TouchableOpacity style={styles.avatarAddBadge} onPress={pickImage}>
                <Text style={{ fontSize: 20, fontWeight: "700" }}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case "terms":
        return (
          <>
            <Text style={styles.title}>Almost there</Text>
            <TouchableOpacity
              onPress={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}
              style={styles.termsContainer}
            >
              <View style={[styles.checkbox, form.termsAgreed && styles.checkboxChecked]} />
              <Text style={styles.termsText}>
                By signing up you agree to our Terms and conditions and Privacy policy
              </Text>
            </TouchableOpacity>
            {!!submitError && <Text style={styles.error}>{submitError}</Text>}
          </>
        );
    }
  };

  const primaryLabel = step === "photo" ? "Choose photo" : step === "terms" ? "Sign up" : "Continue";
  const primaryDisabled = step === "photo" ? false : !isStepValid;

  return (
    <View style={{ flex: 1, backgroundColor: "#030303" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <StepHeader onBack={goBack} onSkip={OPTIONAL_STEPS.includes(step) ? skip : undefined} progress={progress} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            <Animated.View style={{ opacity: fadeAnim, marginTop: 40 }}>{renderStep()}</Animated.View>
          </ScrollView>

          <ContinueButton
            label={primaryLabel}
            disabled={primaryDisabled}
            loading={submitting && step === "terms"}
            onPress={step === "photo" ? pickImage : handlePrimaryPress}
          />
          {step === "photo" && (
            <TouchableOpacity onPress={goNext} style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={styles.skipText}>Continue without photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SignUpScreen;

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, width: "90%", maxWidth: 500, alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  backIcon: { width: 20, height: 20, tintColor: "#FEFEFE" },
  skipText: { color: "#9C9996", fontSize: 15, fontWeight: "600" },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: "#2A3444", marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: "#FEFEFE" },

  title: { color: "#FEFEFE", fontSize: 30, fontWeight: "800", lineHeight: 36 },

  input: {
    marginTop: 24,
    backgroundColor: "#1e1e1e00",
    borderRadius: 17,
    paddingHorizontal: 15,
    color: "#FEFEFE",
    height: 54,
    borderWidth: 2,
    borderColor: "#D4D2D3",
    fontSize: 16,
  },
  inputPassword: {
    marginTop: 24,
    backgroundColor: "#1e1e1e00",
    borderRadius: 17,
    paddingHorizontal: 15,
    color: "#FEFEFE",
    height: 60,
    borderWidth: 2,
    borderColor: "#D4D2D3",
    fontSize: 16,
  },
  eyeIcon: { position: "absolute", right: 15, top: "50%", transform: [{ translateY: -9 }] },
  eyeImage: { width: 24, height: 24, tintColor: "#9C9996" },
  passwordBarContainer: { height: 10, width: "100%", backgroundColor: "#45463E", borderRadius: 4, marginTop: 10, overflow: "hidden" },
  passwordBar: { height: "100%" },
  helperText: { color: "#919191", fontSize: 12, marginTop: 5 },

  wheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: "#2A3444",
  },
  wheelItem: { color: "#5B6472", fontSize: 20 },
  wheelItemSelected: { color: "#FEFEFE", fontSize: 22, fontWeight: "700" },
  ageText: { color: "#FEFEFE", fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 12 },

  genderContainer: { flexDirection: "column", marginTop: 24 },
  genderOption: {
    marginVertical: 6,
    height: 60,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#D4D2D3",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 24, marginHorizontal: -5 },
  categoryOption: {
    width: "48%",
    margin: "1%",
    height: 60,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#D4D2D3",
    justifyContent: "center",
    alignItems: "center",
  },
  optionSelected: { borderColor: "#66BC50", backgroundColor: "#66BC50" },
  optionText: { color: "#D4D2D3", fontSize: 16, fontWeight: "400" },
  optionTextSelected: { color: "#030303", fontSize: 16, fontWeight: "700" },

  avatarWrap: { alignSelf: "center", marginTop: 60 },
  avatarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#3A4250",
    borderWidth: 2,
    borderColor: "#5B6472",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholderIcon: { width: 60, height: 60, tintColor: "#9AA3AF" },
  avatarAddBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEFEFE",
    justifyContent: "center",
    alignItems: "center",
  },

  termsContainer: { flexDirection: "row", alignItems: "flex-start", marginTop: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "#919191", marginRight: 10, marginTop: 2 },
  checkboxChecked: { backgroundColor: "#66BC50", borderColor: "#66BC50" },
  termsText: { color: "#919191", fontSize: 14, flex: 1, flexWrap: "wrap", lineHeight: 20 },
  error: { color: "#ED3237", fontSize: 12, marginTop: 8 },

  continueButton: {
    height: 62,
    backgroundColor: "#FEFEFE",
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  continueButtonText: { color: "#030303", fontSize: 18, fontWeight: "700" },
});

