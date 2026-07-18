import { Icons } from "@/constants/icons"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const ForgotPasswordScreen = () => {
    const Route = useRouter()
    const { forgotPassword } = useAuth()

    const [email, setEmail] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState("")

    const canSubmit = email.trim().length > 0 && !submitting

    const handleSend = async () => {
        if (!canSubmit) return

        setSubmitting(true)
        setFormError("")

        const { email: resolvedEmail, error } = await forgotPassword(email.trim())

        setSubmitting(false)

        if (error) {
            setFormError(error.message)
            return
        }

        // Pass the email along so the next screen doesn't need the user to
        // retype it.
        Route.push({ pathname: "/authscreen/reset-password", params: { email: resolvedEmail } } as any)
    }

    const goBack = () => {
        if (Route.canGoBack()) {
            Route.back()
        } else {
            Route.replace("/authscreen/login" as any)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#030303" }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ width: "90%", maxWidth: 500, alignSelf: "center" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                        <TouchableOpacity onPress={goBack}>
                            <Image source={Icons.back} style={{ width: 20, height: 20 }} />
                        </TouchableOpacity>
                        <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Reset password</Text>
                        <View style={{ width: 20 }} />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: "#FEFEFE", fontSize: 24, fontWeight: "bold" }}>
                            Enter your email
                        </Text>
                        <Text style={{ color: "#9C9996", fontSize: 14, marginTop: 8 }}>
                            We'll email an OTP to reset your password.
                        </Text>
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#9C9996"
                            style={{ marginTop: 16, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 50, borderWidth: 2, borderColor: "#D4D2D3" }}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={setEmail}
                        />

                        {formError ? (
                            <Text style={{ color: "#ED3237", fontSize: 12, marginTop: 10 }}>{formError}</Text>
                        ) : null}

                        <TouchableOpacity
                            disabled={!canSubmit}
                            onPress={handleSend}
                            style={{ height: 62, backgroundColor: "#ED3237", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 30, opacity: canSubmit ? 1 : 0.5 }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FEFEFE" />
                            ) : (
                                <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Send code</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ForgotPasswordScreen