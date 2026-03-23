import { Icons } from "@/constants/icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { postsData } from "@/data/posts";
import { users } from "@/data/users";

const Profile = () => {
    const router = useRouter();

    // 🔥 toggle state
    const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

    // 🔥 simulate logged in user
    const currentUser = users.find((user) => user.id === "u1");
    if (!currentUser) return null;

    // 🔥 user posts
    const userPosts = postsData.filter(
        (post) => post.userId === currentUser.id
    );

    // 🔥 saved posts
    const savedPosts = postsData.filter((post) =>
        currentUser.savedPosts?.includes(post.id)
    );

    // 🔥 which data to show
    const displayPosts = activeTab === "posts" ? userPosts : savedPosts;

    // 🔥 initials
    const initials = currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <ScrollView style={{ flex: 1 }}>
            <SafeAreaView>

                {/* profile heading */}
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    marginTop: 20,
                    marginBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#A6A1A5"
                }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image source={Icons.back} style={{ width: 24, height: 24, tintColor: "#BDBFC1" }} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 17, fontWeight: "bold", color: "#BDBFC1" }}>
                        {currentUser.name}
                    </Text>

                    <TouchableOpacity>
                        <Image source={Icons.setting} style={{ width: 24, height: 24, tintColor: "#BDBFC1" }} />
                    </TouchableOpacity>
                </View>

                {/* profile info */}
                <View>
                    <View style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        backgroundColor: "#fff",
                        alignSelf: "center",
                        marginBottom: 16,
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        {currentUser.profilePicture ? (
                            <Image
                                source={{ uri: currentUser.profilePicture }}
                                style={{ width: "100%", height: "100%", borderRadius: 48 }}
                            />
                        ) : (
                            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#030303" }}>
                                {initials}
                            </Text>
                        )}
                    </View>

                    <Text style={{
                        fontSize: 14,
                        color: "#eaeaeb",
                        textAlign: "center",
                        marginBottom: 8,
                        fontWeight: "bold"
                    }}>
                        @{currentUser.username}
                    </Text>

                    <Text style={{
                        fontSize: 14,
                        color: "#BDBFC1",
                        textAlign: "center",
                        marginBottom: 16,
                        marginHorizontal: 40
                    }}>
                        {currentUser.bio || "No bio yet"}
                    </Text>

                    <View style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 16
                    }}>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#fffbfb", textAlign: "center" }}>
                                {currentUser.followingCount}
                            </Text>
                            <Text style={{ fontSize: 16, color: "#BDBFC1", textAlign: "center" }}>
                                following
                            </Text>
                        </View>

                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#fffbfb", textAlign: "center" }}>
                                {currentUser.followersCount}
                            </Text>
                            <Text style={{ fontSize: 16, color: "#BDBFC1", textAlign: "center" }}>
                                followers
                            </Text>
                        </View>

                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#fffbfb", textAlign: "center" }}>
                                {userPosts.length}
                            </Text>
                            <Text style={{ fontSize: 16, color: "#BDBFC1", textAlign: "center" }}>
                                posts
                            </Text>
                        </View>
                    </View>
                </View>

                {/* tabs */}
                <View style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 32,
                    marginTop: 24,
                    borderWidth: 1,
                    borderColor: "#A6A1A5",
                    paddingBottom: 10
                }}>
                    <TouchableOpacity onPress={() => setActiveTab("posts")}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: activeTab === "posts" ? "#fffbfb" : "#BDBFC1",
                            textAlign: "center",
                            marginTop: 8
                        }}>
                            Posts
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setActiveTab("saved")}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: activeTab === "saved" ? "#fffbfb" : "#BDBFC1",
                            textAlign: "center",
                            marginTop: 8
                        }}>
                            Saved
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* posts grid */}
                <View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {displayPosts.length > 0 ? (
                            displayPosts.map((post) => (
                                <TouchableOpacity
                                    key={post.id}
                                    onPress={() =>
                                        router.push(`screen/details/${post.id}`)
                                    }
                                    style={{
                                        width: "33.33%",
                                        aspectRatio: 1,
                                        borderWidth: 1,
                                        borderColor: "#fff"
                                    }}
                                >
                                    <Image
                                        source={{ uri: post.image }}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ width: "100%", padding: 20 }}>
                                <Text style={{ color: "#BDBFC1", textAlign: "center" }}>
                                    {activeTab === "posts"
                                        ? "No posts yet"
                                        : "No saved posts"}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

            </SafeAreaView>
        </ScrollView>
    );
};

export default Profile;