import { Icons } from "@/constants/icons"
import { useAuth } from "@/hooks/useAuth"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const ResetPasswordScreen = () => {
    const Route = useRouter()
    const { email } = useLocalSearchParams<{ email?: string }>()
    const { verifyRecoveryCode, updatePassword } = useAuth()

    const [visible, setVisible] = useState(false)
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState("")

    const canSubmit =
        code.trim().length > 0 &&
        newPassword.length >= 6 &&
        typeof email === "string" &&
        email.length > 0 &&
        !submitting

    const handleReset = async () => {
        if (!canSubmit || typeof email !== "string") return

        setSubmitting(true)
        setFormError("")

        const { error: verifyError } = await verifyRecoveryCode(email, code.trim())

        if (verifyError) {
            setSubmitting(false)
            setFormError(verifyError.message)
            return
        }

        const { error: updateError } = await updatePassword(newPassword)

        setSubmitting(false)

        if (updateError) {
            setFormError(updateError.message)
            return
        }

        // Password is changed and verifyOtp already left us with an active
        // session, so we can drop straight into the app.
        Route.replace("/screen" as any)
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
                        <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Enter code</Text>
                        <View style={{ width: 20 }} />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: "#FEFEFE", fontSize: 24, fontWeight: "bold" }}>
                            Check your email
                        </Text>
                        <Text style={{ color: "#9C9996", fontSize: 14, marginTop: 8 }}>
                            Enter the OTP we sent{typeof email === "string" && email ? ` to ${email}` : ""}, then choose a new password.
                        </Text>

                        <TextInput
                            placeholder="6-digit code"
                            placeholderTextColor="#9C9996"
                            style={{ marginTop: 16, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 50, borderWidth: 2, borderColor: "#D4D2D3" }}
                            value={code}
                            keyboardType="number-pad"
                            maxLength={8}
                            onChangeText={setCode}
                        />

                        <Text style={{ color: "#FEFEFE", fontSize: 24, fontWeight: "bold", marginTop: 20 }}>
                            New password
                        </Text>
                        <View>
                            <TextInput
                                placeholder="New password"
                                placeholderTextColor="#9C9996"
                                style={{ marginTop: 10, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 60, borderWidth: 2, borderColor: "#D4D2D3" }}
                                secureTextEntry={!visible}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity onPress={() => setVisible(!visible)} style={{ position: "absolute", right: 15, top: "50%", transform: [{ translateY: -9 }] }}>
                                <Image source={visible ? Icons.hide : Icons.show} style={{ width: 24, height: 24, tintColor: "#9C9996" }} />
                            </TouchableOpacity>
                        </View>

                        {formError ? (
                            <Text style={{ color: "#ED3237", fontSize: 12, marginTop: 10 }}>{formError}</Text>
                        ) : null}

                        <TouchableOpacity
                            disabled={!canSubmit}
                            onPress={handleReset}
                            style={{ height: 62, backgroundColor: "#ED3237", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 30, opacity: canSubmit ? 1 : 0.5 }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FEFEFE" />
                            ) : (
                                <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Reset password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default ResetPasswordScreen