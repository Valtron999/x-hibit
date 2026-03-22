import { Icons } from "@/constants/icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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

// Helper functions
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
  if (score <= 1) return "#ED3237"; // red
  if (score <= 3) return "#FFA500"; // orange
  return "#66BC50"; // green
};

const SignUpScreen = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    dob: "",
    gender: "" as "Male" | "Female" | "",
    termsAgreed: false,
  });

  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const passwordStrengthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const strength = computePasswordStrength(form.password);
    Animated.timing(passwordStrengthAnim, {
      toValue: strength / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [form.password]);

  const isFormValid =
    validateEmail(form.email) &&
    computePasswordStrength(form.password) >= 2 &&
    form.username.length >= 3 &&
    form.dob &&
    form.gender &&
    form.termsAgreed;

  const handleSignUp = () => {
    if (!isFormValid) return;
    console.log("Signing up with", form);
  };

  const handleGenderSelect = (gender: "Male" | "Female") => {
    setForm({ ...form, gender });
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS
    if (selectedDate) {
      setDobDate(selectedDate);
      setForm({ ...form, dob: selectedDate.toISOString().split("T")[0] });
    }
  };

  const passwordScore = computePasswordStrength(form.password);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Image source={Icons.back} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign up</Text>
            <View style={{ width: 20 }} />
          </View>

          <View style={styles.content}>
            {/* Email */}
            <Text style={styles.label}>What's your email address?</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#9C9996"
              keyboardType="email-address"
              style={styles.input}
              value={form.email}
              onChangeText={(val) => {
                setForm({ ...form, email: val });
                setErrors({ ...errors, email: validateEmail(val) ? "" : "Invalid email" });
              }}
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            {/* Password */}
            <Text style={[styles.label, { marginTop: 20 }]}>Create a password</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9C9996"
                style={styles.inputPassword}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(val) => {
                  setForm({ ...form, password: val });
                  setErrors({
                    ...errors,
                    password: computePasswordStrength(val) >= 2 ? "" : "Password too weak",
                  });
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Image
                  source={showPassword ? Icons.hide : Icons.show}
                  style={styles.eyeImage}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            <View style={styles.passwordBarContainer}>
              <Animated.View
                style={[
                  styles.passwordBar,
                  {
                    width: passwordStrengthAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: getStrengthColor(passwordScore),
                  },
                ]}
              />
            </View>

            <Text style={styles.helperText}>Use 8 or more characters, numbers and symbols</Text>

            {/* Username */}
            <Text style={[styles.label, { marginTop: 20 }]}>What's your username?</Text>
            <TextInput
              placeholder="Enter your username"
              placeholderTextColor="#9C9996"
              style={styles.input}
              value={form.username}
              onChangeText={(val) => setForm({ ...form, username: val })}
            />

            {/* Date of Birth */}
            <Text style={[styles.label, { marginTop: 20 }]}>Enter your date of birth</Text>

            {Platform.OS === "web" ? (
              <input
                type="date"
                style={{
                  width: "90%",
                  maxWidth: "500px",
                  height: 50,
                  borderRadius: 17,
                  borderWidth: 2,
                  borderColor: "#D4D2D3",
                  paddingLeft: 15,
                  paddingRight: 15,
                  color: "#FEFEFE",
                  backgroundColor: "#1e1e1e00",
                  marginTop: 10,
                } as React.CSSProperties}
                value={form.dob}
                onChange={(e: any) => setForm({ ...form, dob: e.target.value })}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.input, { justifyContent: "center" }]}
                >
                  <Text style={{ color: form.dob ? "#FEFEFE" : "#9C9996" }}>
                    {form.dob || "Select your date of birth"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dobDate || new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={onChangeDate}
                  />
                )}
              </>
            )}

            {/* Gender */}
            <Text style={[styles.label, { marginTop: 20 }]}>What's your gender?</Text>
            <View style={styles.genderContainer}>
              {["Female", "Male"].map((g) => {
                const selected = form.gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => handleGenderSelect(g as "Male" | "Female")}
                    style={[styles.genderOption, selected && styles.genderSelected]}
                  >
                    <Text style={{ color: selected ? "#030303" : "#D4D2D3", fontWeight: selected ? "bold" : "400" }}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                onPress={() => setForm({ ...form, termsAgreed: !form.termsAgreed })}
                style={[styles.checkbox, form.termsAgreed && styles.checkboxChecked]}
              />
              <Text style={styles.termsText}>
                By Signing up you agree to our Terms and conditions and Privacy policy
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              disabled={!isFormValid}
              onPress={handleSignUp}
              style={[styles.signUpButton, { opacity: isFormValid ? 1 : 0.5 }]}
            >
              <Text style={styles.signUpButtonText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default SignUpScreen;

// Styles
const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: "#030303" },
  container: { width: "90%", maxWidth: 500, alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  backIcon: { width: 20, height: 20 },
  headerTitle: { color: "#FEFEFE", fontSize: 18, fontWeight: "600" },
  content: { marginTop: 20 },
  label: { color: "#FEFEFE", fontSize: 24, fontWeight: "bold" },
  input: { marginTop: 10, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 50, borderWidth: 2, borderColor: "#D4D2D3" },
  inputPassword: { marginTop: 10, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 60, borderWidth: 2, borderColor: "#D4D2D3" },
  eyeIcon: { position: "absolute", right: 15, top: "50%", transform: [{ translateY: -9 }] },
  eyeImage: { width: 24, height: 24, tintColor: "#9C9996" },
  passwordBarContainer: { height: 10, width: "100%", backgroundColor: "#45463E", borderRadius: 4, marginTop: 10, overflow: "hidden" },
  passwordBar: { height: "100%" },
  helperText: { color: "#919191", fontSize: 12, marginTop: 5 },
  genderContainer: { flexDirection: "column", marginTop: 10 },
  genderOption: { marginVertical: 5, height: 60, marginHorizontal: 5, borderRadius: 17, borderWidth: 2, borderColor: "#D4D2D3", justifyContent: "center", alignItems: "center" },
  genderSelected: { borderColor: "#66BC50", backgroundColor: "#66BC50" },
  termsContainer: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: "#919191", marginRight: 5 },
  checkboxChecked: { backgroundColor: "#66BC50", borderColor: "#66BC50" },
  termsText: { color: "#919191", fontSize: 12, flex: 1, flexWrap: "wrap" },
  error: { color: "#ED3237", fontSize: 12, marginTop: 5 },
  signUpButton: { height: 62, backgroundColor: "#ED3237", borderRadius: 11, justifyContent: "center", alignItems: "center", marginVertical: 30 },
  signUpButtonText: { color: "#FEFEFE", fontSize: 18, fontWeight: "600" },
});
