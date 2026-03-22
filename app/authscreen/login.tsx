import { Icons } from "@/constants/icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const LoginScreen = () => {
    const [visible, setVisible] =useState(false)
    const Route = useRouter()
    return (
        <View style={{ flex: 1, backgroundColor: "#030303" }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ width: "90%", maxWidth: 500, alignSelf: "center", }}>
                   <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20}}>
                        <TouchableOpacity onPress={()=> Route.back()}>
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
                        />
                        <Text style={{ color: "#FEFEFE", fontSize: 24, fontWeight: "bold", marginTop: 20 }}>Enter your password</Text>
                        <View>
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor="#9C9996"
                                style={{ marginTop: 10, backgroundColor: "#1e1e1e00", borderRadius: 17, paddingHorizontal: 15, color: "#FEFEFE", height: 60, borderWidth: 2, borderColor: "#D4D2D3" }}
                                secureTextEntry={!visible}
                            />
                            <TouchableOpacity  onPress={() => setVisible(!visible)} style={{ position: "absolute", right: 15, top: "50%", transform: [{ translateY: -9 }] }}>
                                <Image source={visible ? Icons.hide : Icons.show} style={{ width: 24, height: 24, tintColor: "#9C9996" }}  />
                            </TouchableOpacity>
                        </View>
                        <View style={{ justifyContent: "space-between", alignItems: "center", flexDirection: "row" }}>
                            <Text style={{ color: "#ED3237", fontSize: 12, marginTop: 10 }}>The username or password is incorrect</Text>
                            <TouchableOpacity>
                                <Text style={{ color: "#919191", fontSize: 12, marginTop: 10 }}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={{ height: 62, backgroundColor: "#ED3237", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 30 }}>
                            <Text style={{ color: "#FEFEFE", fontSize: 18, fontWeight: "600" }}>Log in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

export default LoginScreen