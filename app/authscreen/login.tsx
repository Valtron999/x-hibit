import { Icons } from "@/constants/icons"
import { useAuth } from "@/hooks/useAuth"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const LoginScreen = () => {
    const [visible, setVisible] = useState(false)
    const Route = useRouter()
    const { redirect } = useLocalSearchParams<{ redirect?: string }>()
    const { signInWithUsername } = useAuth()

    const [form, setForm] = useState({ username: "", password: "" })
    const [submitting, setSubmitting] = useState(false)
    const [loginError, setLoginError] = useState("")

    const canSubmit = form.username.trim().length > 0 && form.password.length > 0 && !submitting

    const handleLogin = async () => {
        if (!canSubmit) return

        setSubmitting(true)
        setLoginError("")

        const { error } = await signInWithUsername(form.username.trim(), form.password)

        setSubmitting(false)

        if (error) {
            setLoginError(error.message)
            return
        }

        // If we were sent here from a gated screen (e.g. a shared post link),
        // go back there. Otherwise fall back to the main feed.
        const target = typeof redirect === "string" && redirect.length > 0 ? redirect : "/screen"
        Route.replace(target as any)
    }

    // If there's no back history (e.g. login was reached via a redirect from
    // a gated deep link), fall back to home instead of a dead back button.
    const goBack = () => {
        if (Route.canGoBack()) {
            Route.back()
        } else {
            Route.replace("/screen")
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#030303" }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ width: "90%", maxWidth: 500, alignSelf: "center", }}>
                   <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20}}>
                        <TouchableOpacity onPress={goBack}>
                            <Image source={Icons.back} style={{ width: 20, height: 20 }} />
                        </TouchableOpacity>
                        <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Log in</Text>
                        <View style={{ width: 20 }} />
                   </View>

                   <View style={{ marginTop: 20 }}>
                        <Text style={{ color: "#FEFEFE", fontSize: 24, fontWeight: "bold" }}>Enter your username</Text>
                        <TextInput
                            placeholder="Username"
                            placeholderTextColor="#9C9996"
                            style={{ marginTop: 10, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 50, borderWidth: 2, borderColor: "#D4D2D3" }}
                            value={form.username}
                            autoCapitalize="none"
                            onChangeText={(val) => setForm({ ...form, username: val })}
                        />
                        <Text style={{ color: "#FEFEFE", fontSize: 24, fontWeight: "bold", marginTop: 20 }}>Enter your password</Text>
                        <View>
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor="#9C9996"
                                style={{ marginTop: 10, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 60, borderWidth: 2, borderColor: "#D4D2D3" }}
                                secureTextEntry={!visible}
                                value={form.password}
                                onChangeText={(val) => setForm({ ...form, password: val })}
                            />
                            <TouchableOpacity  onPress={() => setVisible(!visible)} style={{ position: "absolute", right: 15, top: "50%", transform: [{ translateY: -9 }] }}>
                                <Image source={visible ? Icons.hide : Icons.show} style={{ width: 24, height: 24, tintColor: "#9C9996" }}  />
                            </TouchableOpacity>
                        </View>
                        <View style={{ justifyContent: "space-between", alignItems: "center", flexDirection: "row" }}>
                            {loginError ? (
                                <Text style={{ color: "#ED3237", fontSize: 12, marginTop: 10 }}>{loginError}</Text>
                            ) : <View />}
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                <TouchableOpacity onPress={() => Route.push("/authscreen/signup")}>
                                <Text style={{ color: "#ffffff", fontSize: 12, marginTop: 10 }}>Don't have an account? Sign up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Route.push("/authscreen/forgot-password")}>
                                <Text style={{ color: "#919191", fontSize: 12, marginTop: 10 }}>Forgot password?</Text>
                            </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity
                            disabled={!canSubmit}
                            onPress={handleLogin}
                            style={{ height: 62, backgroundColor: "#ED3237", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 30, opacity: canSubmit ? 1 : 0.5 }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FEFEFE" />
                            ) : (
                                <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Log in</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default LoginScreen