import { useFollow } from "@/hooks/useFollow";
import { SuggestedUser, useSuggestedUsers } from "@/hooks/useSuggestedUsers";
import { useRouter } from "expo-router";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

function SuggestedUserCard({
  user,
  viewerId,
  onDismiss,
}: {
  user: SuggestedUser;
  viewerId: string;
  onDismiss: (id: string) => void;
}) {
  const Route = useRouter();
  const { isFollowing, updating, follow } = useFollow(viewerId, user.id, { enabled: true });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={() => onDismiss(user.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Route.push({ pathname: "/screen/users/[id]", params: { id: user.id } })}
      >
        <Image source={{ uri: user.profilePicture || undefined }} style={styles.avatar} />
      </TouchableOpacity>

      <Text style={styles.name} numberOfLines={1}>
        {user.name}
      </Text>
      <Text style={styles.subtitle}>
        {user.mutualsCount > 0 ? `${user.mutualsCount} mutuals` : "Suggested for you"}
      </Text>

      <TouchableOpacity
        style={[styles.followBtn, isFollowing && styles.followingBtn]}
        onPress={follow}
        disabled={updating || isFollowing}
      >
        {updating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.followText}>{isFollowing ? "Following" : "Follow"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function SuggestedPeople({ viewerId }: { viewerId: string }) {
  const { users, loading, dismiss } = useSuggestedUsers(viewerId);
  const Route = useRouter();

  if (!loading && users.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover people</Text>
        <TouchableOpacity onPress={() => Route.push("/screen/users/${profile.id}")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          data={users}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ gap: 14, paddingHorizontal: 4 }}
          renderItem={({ item }) => (
            <SuggestedUserCard user={item} viewerId={viewerId} onDismiss={dismiss} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 24, marginBottom: 8, paddingHorizontal: 5 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  seeAll: { color: "#ED3237", fontWeight: "600" },
  card: {
    width: 170,
    backgroundColor: "#151515",
    borderRadius: 5,
    padding: 16,
    alignItems: "center",
  },
  dismissBtn: { position: "absolute", top: 10, right: 10, zIndex: 2 },
  dismissText: { color: "#888", fontSize: 16 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: "#222",
  },
  name: { color: "#fff", fontWeight: "700", fontSize: 15 },
  subtitle: { color: "#999", fontSize: 12, marginTop: 2, marginBottom: 14 },
  followBtn: {
    backgroundColor: "#ED3237",
    width: "100%",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  followingBtn: { backgroundColor: "#333" },
  followText: { color: "#fff", fontWeight: "700" },
});